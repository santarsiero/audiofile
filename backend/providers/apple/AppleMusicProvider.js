import { ProviderInterface } from '../ProviderInterface.js';
import { APPLE_MUSIC } from '../providerTypes.js';
import { validateSearchResult } from '../contracts/validators.js';
import { ProviderError } from '../contracts/ProviderError.js';
import https from 'https';
import { getAppleDeveloperToken } from '../../utils/apple/appleDeveloperToken.js';

function requireEnv(name) {
  const value = process.env[name];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ProviderError({
      providerType: APPLE_MUSIC,
      stage: 'search',
      reason: `Missing required env var: ${name}`,
      raw: { envVar: name },
    });
  }
  return value;
}

function fetchJson(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const chunks = [];

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const bodyText = Buffer.concat(chunks).toString('utf8');
        resolve({ statusCode: res.statusCode ?? 0, bodyText });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
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
      fixtureName: options?.fixtureName ?? null,
    });

    const storefront = requireEnv('APPLE_MUSIC_STOREFRONT');
    const token = getAppleDeveloperToken();

    const url = new URL(`https://api.music.apple.com/v1/catalog/${encodeURIComponent(storefront)}/search`);
    url.searchParams.set('term', query);
    url.searchParams.set('types', 'songs');
    url.searchParams.set('limit', '25');

    let statusCode = 0;
    let payload;

    try {
      const response = await fetchJson(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      statusCode = response.statusCode;

      if (statusCode !== 200) {
        const err = new ProviderError({
          providerType: APPLE_MUSIC,
          stage: 'search',
          reason: 'Apple Music API request failed',
          raw: { statusCode },
        });
        console.error('[providers.apple.search.failure]', err.toJSON());
        throw err;
      }

      try {
        payload = JSON.parse(response.bodyText);
      } catch {
        const err = new ProviderError({
          providerType: APPLE_MUSIC,
          stage: 'search',
          reason: 'Apple Music API returned malformed JSON',
          raw: { statusCode },
        });
        console.error('[providers.apple.search.failure]', err.toJSON());
        throw err;
      }
    } catch (err) {
      if (err instanceof ProviderError) {
        throw err;
      }

      const providerErr = new ProviderError({
        providerType: APPLE_MUSIC,
        stage: 'search',
        reason: 'Apple Music API request failed',
        raw: { statusCode: statusCode || undefined },
      });
      console.error('[providers.apple.search.failure]', providerErr.toJSON());
      throw providerErr;
    }

    const items = payload?.results?.songs?.data;
    if (items === undefined || items === null) {
      console.log('[providers.apple.search.complete]', {
        providerType: APPLE_MUSIC,
        total: 0,
        accepted: 0,
        rejected: 0,
      });
      return [];
    }

    if (!Array.isArray(items)) {
      const err = new ProviderError({
        providerType: APPLE_MUSIC,
        stage: 'search',
        reason: 'Apple Music API response missing expected results.songs.data array',
        raw: { statusCode },
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
