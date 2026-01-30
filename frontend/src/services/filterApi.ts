/**
 * AudioFile Filter API Service
 * 
 * Handles song filtering by labels.
 * 
 * NOTE: Filtering logic is backend-executed but results are unordered.
 * Frontend still owns all ordering/layout after receiving filtered results.
 */

import { apiClient } from './api';
import { useStore } from '@/store';
import type { FilterSongsRequest, FilterSongsResponse } from '@/types/api';
import type { Song, LabelId } from '@/types/entities';
import type { FilterMode } from '@/types/state';

/**
 * Filter songs by labels
 * 
 * @param labelIds - Label IDs to filter by
 * @param mode - AND (must have all) or OR (must have any)
 * @returns Unordered list of matching songs
 */
export async function filterSongsByLabels(
  labelIds: LabelId[],
  mode: FilterMode
): Promise<Song[]> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }

  const request: FilterSongsRequest = {
    labelIds,
    mode,
  };
  
  const response = await apiClient.post<FilterSongsResponse>(
    `libraries/${activeLibraryId}/songs/filter`,
    request
  );
  
  return response.songs;
}

/**
 * Filter API service object
 */
export const filterApi = {
  filterByLabels: filterSongsByLabels,
} as const;
