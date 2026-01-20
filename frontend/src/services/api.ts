/**
 * AudioFile Base API Client
 * 
 * Centralized API client for all backend communication.
 * 
 * ARCHITECTURAL RULES:
 * - All API calls go through this layer
 * - Components NEVER call APIs directly
 * - Backend quirks are handled here, not leaked to state/components
 * - Must tolerate additive backend changes
 */

import type { ApiError } from '@/types/api';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Base URL for API calls
 * Uses environment variable or falls back to default
 */
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';
const API_BASE_URL = rawApiBaseUrl.endsWith('/')
  ? rawApiBaseUrl
  : `${rawApiBaseUrl}/`;

/**
 * Default request timeout (ms)
 */
const DEFAULT_TIMEOUT = 30000;

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * API error class for typed error handling
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Check if an error is an ApiClientError
 */
export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

/**
 * Parse error from response
 */
async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const data = await response.json();
    if (data.error) {
      return data.error as ApiError;
    }
    return {
      code: 'UNKNOWN_ERROR',
      message: data.message || response.statusText || 'Unknown error occurred',
    };
  } catch {
    return {
      code: 'PARSE_ERROR',
      message: response.statusText || 'Failed to parse error response',
    };
  }
}

// =============================================================================
// REQUEST HELPERS
// =============================================================================

/**
 * Build full URL from path
 */
function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, API_BASE_URL);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  return url.toString();
}

/**
 * Default headers for all requests
 */
function getDefaultHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

/**
 * Create abort controller with timeout
 */
function createTimeoutController(timeout: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
}

// =============================================================================
// CORE REQUEST FUNCTION
// =============================================================================

/**
 * Generic request function with error handling
 */
async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  options?: {
    body?: unknown;
    params?: Record<string, string>;
    timeout?: number;
  }
): Promise<T> {
  const { body, params, timeout = DEFAULT_TIMEOUT } = options || {};
  
  const url = buildUrl(path, params);
  const controller = createTimeoutController(timeout);
  
  try {
    const response = await fetch(url, {
      method,
      headers: getDefaultHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    // Handle non-OK responses
    if (!response.ok) {
      const error = await parseErrorResponse(response);
      throw new ApiClientError(
        error.message,
        error.code,
        response.status,
        error.details
      );
    }
    
    // Handle empty responses (204 No Content, etc.)
    if (response.status === 204) {
      return {} as T;
    }
    
    // Parse JSON response
    const data = await response.json();
    
    // Handle wrapped responses
    if ('data' in data && typeof data === 'object') {
      return data.data as T;
    }
    
    return data as T;
  } catch (error) {
    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiClientError(
        'Request timeout',
        'TIMEOUT',
        408
      );
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiClientError(
        'Network error - unable to reach server',
        'NETWORK_ERROR',
        0
      );
    }
    
    // Re-throw ApiClientError
    if (isApiClientError(error)) {
      throw error;
    }
    
    // Wrap unknown errors
    throw new ApiClientError(
      error instanceof Error ? error.message : 'Unknown error',
      'UNKNOWN_ERROR',
      500
    );
  }
}

// =============================================================================
// PUBLIC API CLIENT
// =============================================================================

/**
 * API client object with typed methods
 */
export const apiClient = {
  /**
   * GET request
   */
  get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return request<T>('GET', path, { params });
  },
  
  /**
   * POST request
   */
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('POST', path, { body });
  },
  
  /**
   * PUT request
   */
  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('PUT', path, { body });
  },
  
  /**
   * DELETE request
   */
  delete<T>(path: string): Promise<T> {
    return request<T>('DELETE', path);
  },
} as const;

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * Check API health
 * Useful for connection verification
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    await apiClient.get('health');
    return true;
  } catch {
    return false;
  }
}
