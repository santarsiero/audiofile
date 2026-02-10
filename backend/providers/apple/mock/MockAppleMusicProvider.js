import { ProviderInterface } from '../../ProviderInterface.js';
import { APPLE_MUSIC } from '../../providerTypes.js';
import { ProviderError } from '../../contracts/ProviderError.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Deterministic Phase 8 mock behavior (APPLE_PROVIDER_MODE=mock):
// - search('') or whitespace -> returns search-empty.json
// - search('__empty__') -> returns search-empty.json
// - search('__error__') -> returns search-error.json
// - search('__page2__') -> returns pagination-page-2.json
// - any other non-empty search term -> returns search-success.json
//
// Important:
// - This provider returns RAW Apple-shaped payloads (no normalization/transformation).
// - Fixtures are read exclusively from backend/providers/apple/mock/data/*.json.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURE_DIR = path.join(__dirname, 'data');

const FIXTURES = Object.freeze({
  success: 'search-success.json',
  empty: 'search-empty.json',
  error: 'search-error.json',
  page2: 'pagination-page-2.json',
});

async function loadFixtureJson(filename) {
  const absPath = path.join(FIXTURE_DIR, filename);
  const text = await readFile(absPath, 'utf8');

  try {
    return JSON.parse(text);
  } catch {
    throw new ProviderError({
      providerType: APPLE_MUSIC,
      stage: 'search',
      reason: 'Mock Apple fixture JSON is malformed',
      raw: { filename },
    });
  }
}

function pickFixtureKey(query) {
  const q = typeof query === 'string' ? query.trim() : '';

  if (q.length === 0) return 'empty';

  if (q === '__empty__') return 'empty';
  if (q === '__error__') return 'error';
  if (q === '__page2__') return 'page2';

  return 'success';
}

export class MockAppleMusicProvider extends ProviderInterface {
  getProviderType() {
    return APPLE_MUSIC;
  }

  async search(query, options) {
    const fixtureKey = pickFixtureKey(query);
    const filename = FIXTURES[fixtureKey];

    if (!filename) {
      throw new ProviderError({
        providerType: APPLE_MUSIC,
        stage: 'search',
        reason: 'Unknown mock fixture key',
        raw: { fixtureKey },
      });
    }

    try {
      return await loadFixtureJson(filename);
    } catch (err) {
      if (err instanceof ProviderError) throw err;

      throw new ProviderError({
        providerType: APPLE_MUSIC,
        stage: 'search',
        reason: 'Failed to load mock Apple fixture',
        raw: { filename },
      });
    }
  }

  async import(trackId, options) {
    throw new ProviderError({
      providerType: APPLE_MUSIC,
      stage: 'import',
      reason: 'MockAppleMusicProvider.import is not implemented for Phase 8 verification',
      raw: { trackId },
    });
  }
}
