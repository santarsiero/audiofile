/**
 * AudioFile Song API Service
 * 
 * Handles all song-related API operations.
 * 
 * ARCHITECTURAL RULE: Backend returns unordered data.
 * This service does NOT sort or filter - that's the view layer's job.
 */

import { apiClient } from './api';
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
  const response = await apiClient.get<GetSongsResponse>('/songs');
  return response.songs;
}

/**
 * Fetch a single song by ID
 */
export async function fetchSongById(songId: SongId): Promise<Song> {
  return apiClient.get<Song>(`/songs/${songId}`);
}

/**
 * Create a new song
 */
export async function createSong(data: CreateSongRequest): Promise<Song> {
  const response = await apiClient.post<CreateSongResponse>('/songs', data);
  return response.song;
}

/**
 * Update an existing song
 */
export async function updateSong(
  songId: SongId,
  data: UpdateSongRequest
): Promise<Song> {
  const response = await apiClient.put<UpdateSongResponse>(
    `/songs/${songId}`,
    data
  );
  return response.song;
}

/**
 * Delete a song (soft delete)
 */
export async function deleteSong(songId: SongId): Promise<SongId> {
  const response = await apiClient.delete<DeleteSongResponse>(
    `/songs/${songId}`
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
