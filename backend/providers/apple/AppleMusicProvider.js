import { ProviderInterface } from '../ProviderInterface.js';
import { APPLE_MUSIC } from '../providerTypes.js';
import { validateSearchResult } from '../contracts/validators.js';
import { ProviderError } from '../contracts/ProviderError.js';

import searchValid from './fixtures/search_valid.json' assert { type: 'json' };
import searchMissingArtwork from './fixtures/search_missing_artwork.json' assert { type: 'json' };
import searchInvalidShape from './fixtures/search_invalid_shape.json' assert { type: 'json' };

function pickFixture(options) {
  const fixtureName = options?.fixtureName;
  if (fixtureName === 'search_missing_artwork') return searchMissingArtwork;
  if (fixtureName === 'search_invalid_shape') return searchInvalidShape;
  return searchValid;
}

function buildArtworkUrl(artwork) {
  if (!artwork || typeof artwork !== 'object') return undefined;
  const url = artwork.url;
  if (typeof url !== 'string' || url.trim().length === 0) return undefined;

  const width = typeof artwork.width === 'number' && artwork.width > 0 ? artwork.width : 500;
  const height = typeof artwork.height === 'number' && artwork.height > 0 ? artwork.height : 500;

  return url.replace('{w}', String(width)).replace('{h}', String(height));
}

function normalizeAppleSong(item) {
  const attributes = item?.attributes ?? {};

  return {
    title: attributes.name,
    artist: attributes.artistName,
    providerTrackId: item?.id,
    providerType: APPLE_MUSIC,
    album: attributes.albumName,
    artwork: buildArtworkUrl(attributes.artwork),
    durationMs: attributes.durationInMillis,
  };
}

export class AppleMusicProvider extends ProviderInterface {
  getProviderType() {
    return APPLE_MUSIC;
  }

  async search(query, options) {
    console.log('[providers.apple.search.entry]', {
      providerType: APPLE_MUSIC,
      query,
      fixtureName: options?.fixtureName ?? 'search_valid',
    });

    const fixture = pickFixture(options);
    const items = fixture?.results?.songs?.data;

    if (!Array.isArray(items)) {
      const err = new ProviderError({
        providerType: APPLE_MUSIC,
        stage: 'search',
        reason: 'Fixture missing expected results.songs.data array',
        raw: { fixtureName: options?.fixtureName ?? 'search_valid' },
      });
      console.error('[providers.apple.search.failure]', err.toJSON());
      throw err;
    }

    let accepted = 0;
    let rejected = 0;
    const results = [];

    for (const item of items) {
      const normalized = normalizeAppleSong(item);

      try {
        const validated = validateSearchResult(normalized);
        results.push({ ...validated, raw: item });
        accepted += 1;
      } catch (err) {
        rejected += 1;

        const reason = typeof err?.message === 'string' ? err.message : 'Unknown normalization error';
        console.error('[providers.apple.search.normalize_failure]', {
          providerType: APPLE_MUSIC,
          stage: 'normalize',
          reason,
          providerTrackId: item?.id,
        });
      }
    }

    console.log('[providers.apple.search.complete]', {
      providerType: APPLE_MUSIC,
      total: items.length,
      accepted,
      rejected,
    });

    return results;
  }
}
