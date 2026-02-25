type ProviderType = string;

import { apiClient } from './api';

export interface CanonicalSearchResult {
  title: string;
  artist: string;
  providerTrackId: string;
  providerType: ProviderType;
  album?: string;
  artwork?: string;
  durationMs?: number;
  raw?: unknown;
}

export interface ProviderErrorPayload {
  name?: string;
  providerType?: ProviderType;
  stage?: string;
  reason?: string;
  raw?: unknown;
}

export interface ProviderSearchResponse {
  results: CanonicalSearchResult[];
}

export interface ProviderImportResponse {
  songId: string;
  created: boolean;
  sourceCreated: boolean;
  providerType: ProviderType;
  externalId: string;
}

export async function searchProviders(input: {
  providerType: ProviderType;
  query: string;
}): Promise<ProviderSearchResponse> {
  const { providerType, query } = input;

  return apiClient.get<ProviderSearchResponse>('providers/search', {
    providerType,
    q: query,
  });
}

export async function importProviderTrackToLibrary(input: {
  libraryId: string;
  providerType: ProviderType;
  providerTrackId: string;
  starterLabelIds?: string[];
}): Promise<ProviderImportResponse> {
  const { libraryId, providerType, providerTrackId, starterLabelIds } = input;

  return apiClient.post<ProviderImportResponse>(
    `libraries/${encodeURIComponent(libraryId)}/providers/import`,
    {
      providerType,
      providerTrackId,
      starterLabelIds,
    }
  );
}

export const providerApi = {
  searchProviders,
  importProviderTrackToLibrary,
} as const;
