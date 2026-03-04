import crypto from 'crypto';

import Song from '../models/Song.js';
import SongSource from '../models/SongSource.js';
import { ProviderError } from '../providers/contracts/ProviderError.js';
import { resolveProvider } from '../providers/ProviderRegistry.js';
import { generateNormKey } from '../utils/normalize.js';
import { createSong } from './SongService.js';
import { addLabelToSong } from './TaggingService.js';

function makeId(prefix) {
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  return `${prefix}_${id}`;
}

function badRequest(message, raw) {
  const error = new Error(message);
  error.status = 400;
  if (raw !== undefined) error.raw = raw;
  return error;
}

export async function importSingleTrack({
  libraryId,
  providerType,
  providerTrackId,
  starterLabelIds,
}) {
  if (typeof libraryId !== 'string' || libraryId.trim().length === 0) {
    throw badRequest('libraryId is required and must be a non-empty string', { libraryId });
  }

  if (typeof providerType !== 'string' || providerType.trim().length === 0) {
    throw badRequest('providerType is required and must be a non-empty string', { providerType });
  }

  if (typeof providerTrackId !== 'string' || providerTrackId.trim().length === 0) {
    throw badRequest('providerTrackId is required and must be a non-empty string', { providerTrackId });
  }

  if (starterLabelIds !== undefined && !Array.isArray(starterLabelIds)) {
    throw badRequest('starterLabelIds must be an array when provided', { starterLabelIds });
  }

  const resolvedProviderType = providerType.trim();
  const externalId = providerTrackId.trim();

  if (resolvedProviderType !== 'SPOTIFY') {
    throw badRequest('Only SPOTIFY providerType is supported for importSingleTrack at this time', {
      providerType: resolvedProviderType,
    });
  }

  const existingSource = await SongSource.findOne({
    libraryId: libraryId.trim(),
    providerType: resolvedProviderType,
    externalId,
  }).lean();
  if (existingSource?.songId) {
    return {
      songId: existingSource.songId,
      created: false,
      sourceCreated: false,
      providerType: resolvedProviderType,
      externalId,
    };
  }

  const provider = await resolveProvider(resolvedProviderType);
  const meta = await provider.import(externalId);

  const title = meta?.title;
  const artist = meta?.artist;

  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new ProviderError({
      providerType: resolvedProviderType,
      stage: 'provider',
      reason: 'Provider import did not return required title',
      raw: { meta },
    });
  }

  if (typeof artist !== 'string' || artist.trim().length === 0) {
    throw new ProviderError({
      providerType: resolvedProviderType,
      stage: 'provider',
      reason: 'Provider import did not return required artist',
      raw: { meta },
    });
  }

  if (meta?.providerType !== resolvedProviderType) {
    throw new ProviderError({
      providerType: resolvedProviderType,
      stage: 'provider',
      reason: 'Provider import returned mismatched providerType',
      raw: { providerType: meta?.providerType, expected: resolvedProviderType, meta },
    });
  }

  if (meta?.providerTrackId !== externalId) {
    throw new ProviderError({
      providerType: resolvedProviderType,
      stage: 'provider',
      reason: 'Provider import returned mismatched providerTrackId',
      raw: { providerTrackId: meta?.providerTrackId, expected: externalId, meta },
    });
  }

  let created = false;
  let songId;
  let songWasNewlyCreated = false;

  try {
    const createdSong = await createSong(libraryId.trim(), {
      displayTitle: title,
      displayArtist: artist,
      albumArtUrl: typeof meta?.artwork === 'string' ? meta.artwork : null,
    });

    created = true;
    songWasNewlyCreated = true;
    songId = createdSong.songId;
  } catch (error) {
    if (error?.status !== 409) {
      throw error;
    }

    const normKey = generateNormKey(title, artist);
    if (typeof normKey !== 'string' || normKey.trim().length === 0) {
      const err = new Error('Unable to compute normKey for duplicate song lookup');
      err.status = 500;
      throw err;
    }

    const existingSong = await Song.findOne({ libraryId: libraryId.trim(), normKey }).lean();
    if (!existingSong) {
      const err = new Error('Duplicate song detected but failed to find existing Song');
      err.status = 500;
      throw err;
    }

    created = false;
    songWasNewlyCreated = false;
    songId = existingSong.songId;
  }

  const uri = `spotify:track:${externalId}`;

  let sourceCreated = false;
  try {
    const existing = await SongSource.findOne({
      libraryId: libraryId.trim(),
      songId,
      providerType: resolvedProviderType,
      externalId,
    }).lean();

    if (existing) {
      sourceCreated = false;
    } else {
      await SongSource.create({
        libraryId: libraryId.trim(),
        songId,
        sourceId: makeId('source'),
        providerType: resolvedProviderType,
        externalId,
        uri,
        metadata: meta,
      });
      sourceCreated = true;
    }
  } catch (error) {
    if (error?.code === 11000) {
      if (songWasNewlyCreated) {
        await Song.deleteOne({ libraryId: libraryId.trim(), songId });
      }

      const concurrentSource = await SongSource.findOne({
        libraryId: libraryId.trim(),
        providerType: resolvedProviderType,
        externalId,
      }).lean();

      if (concurrentSource?.songId) {
        return {
          songId: concurrentSource.songId,
          created: false,
          sourceCreated: false,
          providerType: resolvedProviderType,
          externalId,
        };
      }
    }

    if (songWasNewlyCreated) {
      await Song.deleteOne({ libraryId: libraryId.trim(), songId });
    }
    throw error;
  }

  await Song.updateOne(
    { libraryId: libraryId.trim(), songId },
    { $set: { spotifyTrackId: externalId } }
  );

  if (Array.isArray(starterLabelIds) && starterLabelIds.length > 0) {
    for (const labelId of starterLabelIds) {
      if (typeof labelId !== 'string' || labelId.trim().length === 0) {
        throw badRequest('starterLabelIds must contain only non-empty strings', { starterLabelIds });
      }

      await addLabelToSong(libraryId.trim(), songId, labelId.trim());
    }
  }

  return {
    songId,
    created,
    sourceCreated,
    providerType: resolvedProviderType,
    externalId,
  };
}
