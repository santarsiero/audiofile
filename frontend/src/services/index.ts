/**
 * AudioFile API Services
 * 
 * Barrel file for all API services.
 * Import from '@services' for clean imports.
 * 
 * ARCHITECTURAL RULE:
 * - All API calls go through these services
 * - Components NEVER call APIs directly
 * - Services return unordered data - ordering is view layer's job
 */

// Base API client
export { apiClient, checkApiHealth, ApiClientError, isApiClientError } from './api';

// Individual service modules
export { libraryApi } from './libraryApi';
export { songApi } from './songApi';
export { labelApi } from './labelApi';
export { filterApi } from './filterApi';
export { modeApi } from './modeApi';
