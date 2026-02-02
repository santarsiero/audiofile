import { PROVIDER_TYPES } from '../providerTypes.js';

export const CANONICAL_SEARCH_RESULT_REQUIRED_FIELDS = {
  title: 'string',
  artist: 'string',
  providerTrackId: 'string',
  providerType: 'providerType',
};

export const CANONICAL_SEARCH_RESULT_OPTIONAL_FIELDS = {
  album: 'string',
  artwork: 'string',
  durationMs: 'number',
  raw: 'any',
};

export const CANONICAL_SEARCH_RESULT_PROVIDER_TYPES = PROVIDER_TYPES;
