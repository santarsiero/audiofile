import Song from '../models/Song.js';
import { generateNormKey } from '../utils/normalize.js';
import { createSong } from './SongService.js';
import { addLabelToSong } from './TaggingService.js';

function badRequest(message, raw) {
  const error = new Error(message);
  error.status = 400;
  if (raw !== undefined) error.raw = raw;
  return error;
}

export async function bulkImportSongs(libraryId, items, applyLabelIds) {
  if (typeof libraryId !== 'string' || libraryId.trim().length === 0) {
    throw badRequest('libraryId is required and must be a non-empty string', { libraryId });
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest('items is required and must be a non-empty array', { items });
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

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const input of items) {
    try {
      const title = input?.title;
      const artist = input?.artist;

      if (typeof title !== 'string' || title.trim().length === 0) {
        throw badRequest('Each item.title is required and must be a non-empty string', { item: input });
      }

      if (typeof artist !== 'string' || artist.trim().length === 0) {
        throw badRequest('Each item.artist is required and must be a non-empty string', { item: input });
      }

      const normKey = generateNormKey(title, artist);
      if (typeof normKey !== 'string' || normKey.trim().length === 0) {
        throw new Error('Unable to compute normKey for input');
      }

      const existing = await Song.findOne({ libraryId: libraryId.trim(), normKey }).lean();
      if (existing) {
        skipped += 1;
        continue;
      }

      const albumArtUrl = typeof input?.albumArtUrl === 'string' ? input.albumArtUrl : undefined;
      const album = typeof input?.album === 'string' ? input.album : undefined;

      const created = await createSong(libraryId.trim(), {
        displayTitle: title.trim(),
        displayArtist: artist.trim(),
        ...(typeof albumArtUrl === 'string' && albumArtUrl.trim().length > 0
          ? { albumArtUrl: albumArtUrl.trim() }
          : {}),
        ...(typeof album === 'string' && album.trim().length > 0 ? { albumName: album.trim() } : {}),
      });

      if (Array.isArray(applyLabelIds) && applyLabelIds.length > 0) {
        for (const labelId of applyLabelIds) {
          await addLabelToSong(libraryId.trim(), created.songId, labelId.trim());
        }
      }

      imported += 1;
    } catch (error) {
      if (error?.status === 409) {
        skipped += 1;
        continue;
      }

      failed += 1;
    }
  }

  return { imported, skipped, failed };
}

export default {
  bulkImportSongs,
};
