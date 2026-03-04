import { importSingleTrack } from './ProviderIngestionService.js';
import { addLabelToSong } from './TaggingService.js';
import Song from '../models/Song.js';
import { resolveProvider } from '../providers/ProviderRegistry.js';
import { generateNormKey } from '../utils/normalize.js';

function badRequest(message, raw) {
  const error = new Error(message);
  error.status = 400;
  if (raw !== undefined) error.raw = raw;
  return error;
}

function normalizeForMatch(value) {
  if (typeof value !== 'string') return '';
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/\[.*?\]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function tokenSet(value) {
  const normalized = normalizeForMatch(value);
  if (!normalized) return new Set();
  return new Set(normalized.split(' ').filter(Boolean));
}

function jaccardSimilarity(a, b) {
  if (!a.size && !b.size) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function scoreCandidate({ inputTitle, inputArtist, candidateTitle, candidateArtist }) {
  const titleScore = jaccardSimilarity(tokenSet(inputTitle), tokenSet(candidateTitle));
  const artistScore = jaccardSimilarity(tokenSet(inputArtist), tokenSet(candidateArtist));
  return 0.7 * titleScore + 0.3 * artistScore;
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
    exactMatches: 0,
    fuzzyMatches: 0,
    misses: 0,
    missingFields: 0,
    errors: 0,
  };

  const fuzzyThreshold = 0.72;

  for (const input of items) {
    const title = input?.title;
    const artist = input?.artist;
    const spotifyTrackId = input?.spotifyTrackId ?? input?.providerTrackId;
    const appleMusicSongId = input?.appleMusicSongId;
    const appleMusicSongIdAlt = input?.appleMusicSongId ?? input?.appleMusicSongID;

    const resultRow = {
      input: {
        title: typeof title === 'string' ? title : title ?? null,
        artist: typeof artist === 'string' ? artist : artist ?? null,
        spotifyTrackId:
          typeof spotifyTrackId === 'string' ? spotifyTrackId : spotifyTrackId ?? null,
        appleMusicSongId:
          typeof appleMusicSongIdAlt === 'string'
            ? appleMusicSongIdAlt
            : appleMusicSongIdAlt ?? null,
      },
      status: 'error',
      match: null,
    };

    try {
      let providerTrackIdForImport = null;
      let matchType = null;
      let candidates = null;
      let importResult = null;

      const hasSpotifyTrackId = typeof spotifyTrackId === 'string' && spotifyTrackId.trim().length > 0;
      const hasTitle = typeof title === 'string' && title.trim().length > 0;
      const hasArtist = typeof artist === 'string' && artist.trim().length > 0;

      const importByProviderTrackId = async ({ providerTrackId }) => {
        return importSingleTrack({
          libraryId: libraryId.trim(),
          providerType: resolvedProviderType,
          providerTrackId,
          starterLabelIds: [],
        });
      };

      if (hasSpotifyTrackId) {
        providerTrackIdForImport = spotifyTrackId.trim();
        matchType = 'spotify_id';

        try {
          importResult = await importByProviderTrackId({ providerTrackId: providerTrackIdForImport });
        } catch (err) {
          // If importing by spotifyTrackId fails, fall back to title/artist search when available.
          if (hasTitle && hasArtist) {
            providerTrackIdForImport = null;
            matchType = null;
          } else {
            throw err;
          }
        }
      }

      if (!importResult) {
        if (hasTitle && hasArtist) {
          const query = `${title.trim()} ${artist.trim()}`;
          const searchResults = await provider.search(query, {});

          const inputNormKey = generateNormKey(title.trim(), artist.trim());
          const scored = (Array.isArray(searchResults) ? searchResults : [])
            .map((r) => {
              const rTitle = r?.title;
              const rArtist = r?.artist;
              const rId = r?.providerTrackId;
              if (typeof rTitle !== 'string' || typeof rArtist !== 'string' || typeof rId !== 'string') {
                return null;
              }

              const score = scoreCandidate({
                inputTitle: title,
                inputArtist: artist,
                candidateTitle: rTitle,
                candidateArtist: rArtist,
              });

              const normKey = generateNormKey(rTitle, rArtist);
              const exact = typeof inputNormKey === 'string' && inputNormKey === normKey;

              return {
                title: rTitle,
                artist: rArtist,
                providerTrackId: rId,
                score,
                exact,
              };
            })
            .filter(Boolean)
            .sort((a, b) => b.score - a.score);

          candidates = scored.slice(0, 5);

          const best = scored[0];
          if (!best || typeof best.providerTrackId !== 'string' || !best.providerTrackId.trim()) {
            resultRow.status = 'miss';
            summary.misses += 1;
            resultRow.match = { matchType: 'none', reason: 'no_candidates', candidates };
            results.push(resultRow);
            continue;
          }

          if (best.exact) {
            matchType = 'title_artist_exact';
          } else if (best.score >= fuzzyThreshold) {
            matchType = 'title_artist_fuzzy';
          } else {
            resultRow.status = 'miss';
            summary.misses += 1;
            resultRow.match = {
              matchType: 'none',
              reason: 'below_threshold',
              bestScore: best.score,
              candidates,
            };
            results.push(resultRow);
            continue;
          }

          providerTrackIdForImport = best.providerTrackId.trim();
          importResult = await importByProviderTrackId({ providerTrackId: providerTrackIdForImport });
        } else if (!hasSpotifyTrackId) {
          resultRow.status = 'missing_fields';
          summary.missingFields += 1;
          resultRow.match = { matchType: 'none', reason: 'missing_spotify_id_and_title_artist' };
          results.push(resultRow);
          continue;
        }
      }

      const appleIdToSet =
        typeof appleMusicSongIdAlt === 'string' && appleMusicSongIdAlt.trim().length > 0
          ? appleMusicSongIdAlt.trim()
          : null;

      if (appleIdToSet) {
        await Song.updateOne(
          { libraryId: libraryId.trim(), songId: importResult.songId },
          { $set: { appleMusicSongId: appleIdToSet } }
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

      if (matchType === 'title_artist_exact') {
        summary.exactMatches += 1;
      } else if (matchType === 'title_artist_fuzzy') {
        summary.fuzzyMatches += 1;
      }

      resultRow.match = {
        matchType,
        providerTrackId: providerTrackIdForImport,
        candidates,
      };

      results.push(resultRow);
    } catch (error) {
      resultRow.status = 'error';
      summary.errors += 1;
      const reason = error instanceof Error ? error.message : 'Unknown error';
      resultRow.match = { matchType: 'error', reason };
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
