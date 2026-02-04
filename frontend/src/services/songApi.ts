/**
 * AudioFile Song API Service
 * 
 * Handles all song-related API operations.
 * 
 * ARCHITECTURAL RULE: Backend returns unordered data.
 * This service does NOT sort or filter - that's the view layer's job.
 */

import { apiClient, isApiClientError } from './api';
import { useStore } from '@/store';
import type {
  GetSongsResponse,
  CreateSongRequest,
  CreateSongResponse,
  UpdateSongRequest,
  UpdateSongResponse,
  DeleteSongResponse,
} from '@/types/api';
import type { Song, SongId } from '@/types/entities';

/**
 * Fetch all songs for the current library
 * Returns unordered list - frontend handles ordering
 */
export async function fetchSongs(): Promise<Song[]> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }
  const response = await apiClient.get<GetSongsResponse>(
    `libraries/${activeLibraryId}/songs`
  );
  return response.songs;
}

/**
 * Fetch a single song by ID
 */
export async function fetchSongById(songId: SongId): Promise<Song> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }
  const response = await apiClient.get<{ song: Song }>(
    `libraries/${activeLibraryId}/songs/${songId}`
  );
  return response.song;
}

/**
 * Create a new song
 */
export async function createSong(data: CreateSongRequest): Promise<Song> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }

  const path = `libraries/${activeLibraryId}/songs`;
  // TEMP[libraryId-coherence]: trace libraryId used for createSong request (remove after Phase 11)
  console.log('TEMP[libraryId-coherence] songApi.createSong request', {
    file: 'services/songApi.ts',
    fn: 'createSong',
    activeLibraryIdAtRequest: activeLibraryId,
    requestPath: path,
    stack: new Error().stack,
  });

  try {
    const response = await apiClient.post<CreateSongResponse>(path, data);
    return response.song;
  } catch (error) {
    // TEMP[libraryId-coherence]: log failure response details only (remove after Phase 11)
    if (isApiClientError(error)) {
      console.log('TEMP[libraryId-coherence] songApi.createSong failure', {
        file: 'services/songApi.ts',
        fn: 'createSong',
        activeLibraryIdAtFailure: useStore.getState().activeLibraryId,
        requestPath: path,
        status: error.status,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    } else {
      console.log('TEMP[libraryId-coherence] songApi.createSong failure (non-api)', {
        file: 'services/songApi.ts',
        fn: 'createSong',
        activeLibraryIdAtFailure: useStore.getState().activeLibraryId,
        requestPath: path,
        error,
      });
    }
    throw error;
  }
}

/**
 * Update an existing song
 */
export async function updateSong(
  songId: SongId,
  data: UpdateSongRequest
): Promise<Song> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }

  const response = await apiClient.put<UpdateSongResponse>(
    `libraries/${activeLibraryId}/songs/${songId}`,
    data
  );
  return response.song;
}

/**
 * Delete a song (soft delete)
 */
export async function deleteSong(songId: SongId): Promise<SongId> {
  // GUARDRAIL: This performs a PERMANENT library-level delete of the canonical Song entity.
  // It must ONLY be called from explicitly-confirmed destructive UI (e.g. Left Song Details).
  // It must never be wired to canvas delete, keyboard shortcuts, undo/redo, or system pipelines.
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }

  const response = await apiClient.delete<DeleteSongResponse>(
    `libraries/${activeLibraryId}/songs/${songId}`
  );
  return response.deletedSongId;
}

/**
 * Song API service object
 */
export const songApi = {
  fetchAll: fetchSongs,
  fetchById: fetchSongById,
  create: createSong,
  update: updateSong,
  delete: deleteSong,
} as const;
