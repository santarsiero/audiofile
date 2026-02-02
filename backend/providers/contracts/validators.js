import { PROVIDER_TYPES } from '../providerTypes.js';
import { ProviderError } from './ProviderError.js';

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidProviderType(value) {
  return isNonEmptyString(value) && Object.values(PROVIDER_TYPES).includes(value);
}

function fail({ providerType, stage, reason, raw }) {
  const err = new ProviderError({ providerType, stage, reason, raw });
  console.error('[providers.contracts.validation]', err.toJSON());
  throw err;
}

export function validateSearchResult(obj) {
  if (!isPlainObject(obj)) {
    fail({ providerType: obj?.providerType, stage: 'normalize', reason: 'Search result must be an object', raw: obj });
  }

  if (!isNonEmptyString(obj.title)) {
    fail({ providerType: obj.providerType, stage: 'normalize', reason: 'Search result missing required non-empty string: title', raw: obj });
  }

  if (!isNonEmptyString(obj.artist)) {
    fail({ providerType: obj.providerType, stage: 'normalize', reason: 'Search result missing required non-empty string: artist', raw: obj });
  }

  if (!isNonEmptyString(obj.providerTrackId)) {
    fail({ providerType: obj.providerType, stage: 'normalize', reason: 'Search result missing required non-empty string: providerTrackId', raw: obj });
  }

  if (!isValidProviderType(obj.providerType)) {
    fail({ providerType: obj.providerType, stage: 'normalize', reason: 'Search result missing required providerType (enum)', raw: obj });
  }

  if (obj.album !== undefined && !isNonEmptyString(obj.album)) {
    fail({ providerType: obj.providerType, stage: 'normalize', reason: 'Search result optional field album must be a non-empty string when provided', raw: obj });
  }

  if (obj.artwork !== undefined && !isNonEmptyString(obj.artwork)) {
    fail({ providerType: obj.providerType, stage: 'normalize', reason: 'Search result optional field artwork must be a non-empty string when provided', raw: obj });
  }

  if (obj.durationMs !== undefined && (typeof obj.durationMs !== 'number' || Number.isNaN(obj.durationMs) || obj.durationMs <= 0)) {
    fail({ providerType: obj.providerType, stage: 'normalize', reason: 'Search result optional field durationMs must be a positive number when provided', raw: obj });
  }

  return obj;
}

export function validateImportPayload(obj) {
  if (!isPlainObject(obj)) {
    fail({ providerType: obj?.providerType, stage: 'import', reason: 'Import payload must be an object', raw: obj });
  }

  if (!isNonEmptyString(obj.displayTitle)) {
    fail({ providerType: obj.providerType, stage: 'import', reason: 'Import payload missing required non-empty string: displayTitle', raw: obj });
  }

  if (!isNonEmptyString(obj.displayArtist)) {
    fail({ providerType: obj.providerType, stage: 'import', reason: 'Import payload missing required non-empty string: displayArtist', raw: obj });
  }

  if (obj.officialTitle !== undefined && !isNonEmptyString(obj.officialTitle)) {
    fail({ providerType: obj.providerType, stage: 'import', reason: 'Import payload optional field officialTitle must be a non-empty string when provided', raw: obj });
  }

  if (obj.officialArtist !== undefined && !isNonEmptyString(obj.officialArtist)) {
    fail({ providerType: obj.providerType, stage: 'import', reason: 'Import payload optional field officialArtist must be a non-empty string when provided', raw: obj });
  }

  if (obj.providerMetadata !== undefined && !isPlainObject(obj.providerMetadata)) {
    fail({ providerType: obj.providerType, stage: 'import', reason: 'Import payload optional field providerMetadata must be an object when provided', raw: obj });
  }

  return obj;
}
