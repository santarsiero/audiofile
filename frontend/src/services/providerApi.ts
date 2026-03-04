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

export type ProviderBulkImportItem = {
  title?: string | null;
  artist?: string | null;
  spotifyTrackId?: string | null;
  appleMusicSongId?: string | null;
};

export type ProviderBulkImportResultRow = {
  input: {
    title: unknown;
    artist: unknown;
    spotifyTrackId: unknown;
    appleMusicSongId: unknown;
  };
  status:
    | 'imported'
    | 'duplicate'
    | 'miss'
    | 'missing_fields'
    | 'error';
  match: unknown;
};

export type ProviderBulkImportResponse = {
  summary: {
    total: number;
    imported: number;
    duplicates: number;
    exactMatches: number;
    fuzzyMatches: number;
    misses: number;
    missingFields: number;
    errors: number;
  };
  results: ProviderBulkImportResultRow[];
};

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

export async function bulkImportProviderSongs(input: {
  libraryId: string;
  providerType: ProviderType;
  items: ProviderBulkImportItem[];
  applyLabelIds?: string[];
}): Promise<ProviderBulkImportResponse> {
  const { libraryId, providerType, items, applyLabelIds } = input;

  return apiClient.post<ProviderBulkImportResponse>(
    `libraries/${encodeURIComponent(libraryId)}/providers/bulk-import`,
    {
      providerType,
      items,
      ...(Array.isArray(applyLabelIds) ? { applyLabelIds } : {}),
    },
    { timeout: 900000 }
  );
}

export async function importPublicSpotifyPlaylistToLibrary(input: {
  libraryId: string;
  playlistUrlOrId: string;
  applyLabelIds?: string[];
}): Promise<ProviderBulkImportResponse> {
  const { libraryId, playlistUrlOrId, applyLabelIds } = input;

  return apiClient.post<ProviderBulkImportResponse>(
    `libraries/${encodeURIComponent(libraryId)}/providers/spotify/import-playlist`,
    {
      playlistUrlOrId,
      ...(Array.isArray(applyLabelIds) ? { applyLabelIds } : {}),
    },
    { timeout: 900000 }
  );
}

export const providerApi = {
  searchProviders,
  importProviderTrackToLibrary,
  bulkImportProviderSongs,
  importPublicSpotifyPlaylistToLibrary,
} as const;
