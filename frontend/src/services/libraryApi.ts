/**
 * AudioFile Library API Service
 * 
 * Handles library bootstrap and library-level operations.
 * Bootstrap loads all initial data for a library in one request.
 */

import { apiClient } from './api';
import type { LibraryBootstrapResponse, ListLibrariesResponse } from '@/types/api';
import type { LibraryId } from '@/types/entities';

/**
 * Bootstrap a library - load all initial data
 * This is the primary way to initialize the frontend state.
 * 
 * Returns: library, songs, labels, superLabels, songLabels, labelModes
 */
export async function bootstrapLibrary(
  libraryId: LibraryId
): Promise<LibraryBootstrapResponse> {
  return apiClient.get<LibraryBootstrapResponse>(
    `libraries/${libraryId}/bootstrap`
  );
}

export async function listLibraries(): Promise<ListLibrariesResponse> {
  return apiClient.get<ListLibrariesResponse>('libraries');
}

/**
 * Library API service object
 */
export const libraryApi = {
  bootstrap: bootstrapLibrary,
  list: listLibraries,
} as const;
