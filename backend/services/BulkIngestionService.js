import { importSingleTrack } from './ProviderIngestionService.js';
import { addLabelToSong } from './TaggingService.js';
import Song from '../models/Song.js';

function badRequest(message, raw) {
  const error = new Error(message);
  error.status = 400;
  if (raw !== undefined) error.raw = raw;
  return error;
}

export async function bulkImportSongs({ libraryId, providerType, items, applyLabelIds }) {
  if (typeof libraryId !== 'string' || libraryId.trim().length === 0) {
    throw badRequest('libraryId is required and must be a non-empty string', { libraryId });
  }

  if (typeof providerType !== 'string' || providerType.trim().length === 0) {
    throw badRequest('providerType is required and must be a non-empty string', { providerType });
  }

  const resolvedProviderType = providerType.trim();
  if (resolvedProviderType !== 'SPOTIFY') {
    throw badRequest('Only SPOTIFY providerType is supported for bulk import at this time', {
      providerType: resolvedProviderType,
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest('items must be a non-empty array', { items });
  }

  if (applyLabelIds !== undefined && !Array.isArray(applyLabelIds)) {
    throw badRequest('applyLabelIds must be an array when provided', { applyLabelIds });
  }

  if (Array.isArray(applyLabelIds) && applyLabelIds.length > 0) {
    for (const labelId of applyLabelIds) {
      if (typeof labelId !== 'string' || labelId.trim().length === 0) {
        throw badRequest('applyLabelIds must contain only non-empty strings', { applyLabelIds });
      }
    }
  }

  const results = [];
  const summary = {
    total: items.length,
    imported: 0,
    duplicates: 0,
    notFound: 0,
    ambiguous: 0,
    missingSpotifyId: 0,
    errors: 0,
  };

  for (const input of items) {
    const title = input?.title;
    const artist = input?.artist;
    const explicit = input?.explicit;
    const spotifyTrackId = input?.spotifyTrackId ?? input?.providerTrackId;
    const appleMusicSongId = input?.appleMusicSongId;

    const resultRow = {
      input: {
        title: typeof title === 'string' ? title : title ?? null,
        artist: typeof artist === 'string' ? artist : artist ?? null,
        explicit: typeof explicit === 'boolean' ? explicit : explicit ?? null,
        spotifyTrackId:
          typeof spotifyTrackId === 'string' ? spotifyTrackId : spotifyTrackId ?? null,
        appleMusicSongId:
          typeof appleMusicSongId === 'string' ? appleMusicSongId : appleMusicSongId ?? null,
      },
      status: 'error',
    };

    try {
      let providerTrackIdForImport;
      const hasSpotifyTrackId = typeof spotifyTrackId === 'string' && spotifyTrackId.trim().length > 0;

      if (hasSpotifyTrackId) {
        providerTrackIdForImport = spotifyTrackId.trim();
      } else {
        summary.missingSpotifyId += 1;
        resultRow.status = 'missing_spotify_id';
        results.push(resultRow);
        continue;
      }

      const importResult = await importSingleTrack({
        libraryId: libraryId.trim(),
        providerType: resolvedProviderType,
        providerTrackId: providerTrackIdForImport,
        starterLabelIds: [],
      });

      if (typeof appleMusicSongId === 'string' && appleMusicSongId.trim().length > 0) {
        await Song.updateOne(
          { libraryId: libraryId.trim(), songId: importResult.songId },
          { $set: { appleMusicSongId: appleMusicSongId.trim() } }
        );
      }

      if (Array.isArray(applyLabelIds) && applyLabelIds.length > 0) {
        for (const labelId of applyLabelIds) {
          await addLabelToSong(libraryId.trim(), importResult.songId, labelId.trim());
        }
      }

      if (importResult.created) {
        resultRow.status = 'imported';
        summary.imported += 1;
      } else {
        resultRow.status = 'duplicate';
        summary.duplicates += 1;
      }

      results.push(resultRow);
    } catch (error) {
      resultRow.status = 'error';
      summary.errors += 1;
      results.push(resultRow);

      // Continue to next item; bulk import should not abort on per-item failure.
      // Route-level validation failures are thrown before the loop.
      if (error?.status === 400) {
        // Item validation errors are counted as per-item errors.
      }
    }
  }

  return { summary, results };
}
