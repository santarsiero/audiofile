import { ProviderError } from '../providers/contracts/ProviderError.js';
import { resolveProvider } from '../providers/ProviderRegistry.js';
import { generateNormKey } from '../utils/normalize.js';
import { importSingleTrack } from './ProviderIngestionService.js';
import { addLabelToSong } from './TaggingService.js';

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

  const provider = await resolveProvider(resolvedProviderType);

  const results = [];
  const summary = {
    total: items.length,
    imported: 0,
    duplicates: 0,
    notFound: 0,
    ambiguous: 0,
    errors: 0,
  };

  for (const input of items) {
    const title = input?.title;
    const artist = input?.artist;
    const explicit = input?.explicit;

    const resultRow = {
      input: {
        title: typeof title === 'string' ? title : title ?? null,
        artist: typeof artist === 'string' ? artist : artist ?? null,
        explicit: typeof explicit === 'boolean' ? explicit : explicit ?? null,
      },
      status: 'error',
    };

    try {
      if (typeof title !== 'string' || title.trim().length === 0) {
        throw badRequest('Each item.title is required and must be a non-empty string', { item: input });
      }

      if (typeof artist !== 'string' || artist.trim().length === 0) {
        throw badRequest('Each item.artist is required and must be a non-empty string', { item: input });
      }

      if (explicit !== undefined && typeof explicit !== 'boolean') {
        throw badRequest('Each item.explicit must be a boolean when provided', { item: input });
      }

      const normKey = generateNormKey(title, artist);
      if (typeof normKey !== 'string' || normKey.trim().length === 0) {
        throw new Error('Unable to compute normKey for input');
      }

      const query = `${title} ${artist}`;
      const searchResults = await provider.search(query, {});
      const normMatches = (Array.isArray(searchResults) ? searchResults : []).filter((r) => {
        const rTitle = r?.title;
        const rArtist = r?.artist;
        if (typeof rTitle !== 'string' || typeof rArtist !== 'string') return false;
        return generateNormKey(rTitle, rArtist) === normKey;
      });

      const matches =
        typeof explicit === 'boolean'
          ? normMatches.filter((r) => r?.raw?.explicit === explicit)
          : normMatches;

      const hadExplicitFilter = typeof explicit === 'boolean';

      if (normMatches.length === 0) {
        resultRow.status = 'not_found';
        summary.notFound += 1;
        results.push(resultRow);
        continue;
      }

      if (matches.length === 0) {
        // Title/artist exists in search results, but explicit filter eliminated all candidates.
        // Treat as not_found for this explicit/clean variant.
        resultRow.status = 'not_found';
        summary.notFound += 1;
        results.push(resultRow);
        continue;
      }

      if (!hadExplicitFilter && normMatches.length !== 1) {
        // No explicit guidance and multiple normKey-equal candidates; remain conservative.
        resultRow.status = 'ambiguous';
        summary.ambiguous += 1;
        results.push(resultRow);
        continue;
      }

      // Deterministic choice: take the first match (explicit filter may still leave >1).
      const match = matches[0];
      const providerTrackId = match?.providerTrackId;
      if (typeof providerTrackId !== 'string' || providerTrackId.trim().length === 0) {
        throw new ProviderError({
          providerType: resolvedProviderType,
          stage: 'provider',
          reason: 'Spotify search match missing providerTrackId',
          raw: { match },
        });
      }

      const importResult = await importSingleTrack({
        libraryId: libraryId.trim(),
        providerType: resolvedProviderType,
        providerTrackId: providerTrackId.trim(),
        starterLabelIds: [],
      });

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
