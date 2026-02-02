type ProviderType = string;

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

function getApiBaseUrl(): string {
  const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';
  return rawApiBaseUrl.endsWith('/') ? rawApiBaseUrl : `${rawApiBaseUrl}/`;
}

export async function searchProviders(input: {
  providerType: ProviderType;
  query: string;
}): Promise<ProviderSearchResponse> {
  const { providerType, query } = input;

  const url = new URL('providers/search', getApiBaseUrl());
  url.searchParams.set('providerType', providerType);
  url.searchParams.set('q', query);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (data?.error) {
      throw data.error as ProviderErrorPayload;
    }

    const message = typeof data?.message === 'string' ? data.message : `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (data?.error) {
    throw data.error as ProviderErrorPayload;
  }

  return data as ProviderSearchResponse;
}

export const providerApi = {
  searchProviders,
} as const;
