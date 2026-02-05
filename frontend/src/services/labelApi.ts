/**
 * AudioFile Label API Service
 * 
 * Handles all label-related API operations (regular and super labels).
 * 
 * ARCHITECTURAL RULE: Backend returns unordered data.
 * This service does NOT sort or filter - that's the view layer's job.
 */

import { apiClient, isApiClientError } from './api';
import { useStore } from '@/store';
import type {
  GetLabelsResponse,
  CreateLabelRequest,
  CreateLabelResponse,
  CreateSuperLabelRequest,
  CreateSuperLabelResponse,
  DeleteLabelResponse,
  AddLabelToSongResponse,
  RemoveLabelFromSongResponse,
  GetSongLabelsResponse,
} from '@/types/api';
import type { Label, SuperLabel, LabelId, SongId, SongLabel } from '@/types/entities';

/**
 * Fetch all labels for the current library
 * Returns both regular and super labels
 */
export async function fetchLabels(): Promise<{
  labels: Label[];
  superLabels: SuperLabel[];
}> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }

  const response = await apiClient.get<GetLabelsResponse>(
    `libraries/${activeLibraryId}/labels`
  );
  return {
    labels: response.labels,
    superLabels: response.superLabels,
  };
}

/**
 * Fetch a single label by ID
 */
export async function fetchLabelById(labelId: LabelId): Promise<Label> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }
  const response = await apiClient.get<{ label: Label }>(
    `libraries/${activeLibraryId}/labels/${labelId}`
  );
  return response.label;
}

/**
 * Create a new regular label
 */
export async function createLabel(data: CreateLabelRequest): Promise<Label> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }

  const path = `libraries/${activeLibraryId}/labels`;

  try {
    const response = await apiClient.post<CreateLabelResponse>(path, data);
    return response.label;
  } catch (error) {
    throw error;
  }
}

/**
 * Create a new super label
 */
export async function createSuperLabel(
  data: CreateSuperLabelRequest
): Promise<SuperLabel> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }

  const response = await apiClient.post<CreateSuperLabelResponse>(
    `libraries/${activeLibraryId}/labels/super`,
    data
  );
  return response.superLabel;
}

/**
 * Delete a label (removes from all songs)
 */
export async function deleteLabel(labelId: LabelId): Promise<LabelId> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }
  const response = await apiClient.delete<DeleteLabelResponse>(
    `libraries/${activeLibraryId}/labels/${labelId}`
  );
  return response.deletedLabelId;
}

// =============================================================================
// TAGGING (Song-Label relationships)
// =============================================================================

/**
 * Add a label to a song
 */
export async function addLabelToSong(
  songId: SongId,
  labelId: LabelId
): Promise<SongLabel> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }
  const response = await apiClient.post<AddLabelToSongResponse>(
    `libraries/${activeLibraryId}/songs/${songId}/labels/${labelId}`
  );
  return response.songLabel;
}

/**
 * Remove a label from a song
 */
export async function removeLabelFromSong(
  songId: SongId,
  labelId: LabelId
): Promise<{ songId: SongId; labelId: LabelId }> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }
  const response = await apiClient.delete<RemoveLabelFromSongResponse>(
    `libraries/${activeLibraryId}/songs/${songId}/labels/${labelId}`
  );
  return { songId: response.songId, labelId: response.labelId };
}

/**
 * Get all labels for a specific song
 */
export async function fetchSongLabels(
  songId: SongId
): Promise<{ labels: Label[]; superLabels: SuperLabel[] }> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }
  const response = await apiClient.get<GetSongLabelsResponse>(
    `libraries/${activeLibraryId}/songs/${songId}/labels`
  );
  return {
    labels: response.labels,
    superLabels: response.superLabels,
  };
}

/**
 * Label API service object
 */
export const labelApi = {
  fetchAll: fetchLabels,
  fetchById: fetchLabelById,
  create: createLabel,
  createSuper: createSuperLabel,
  delete: deleteLabel,
  addToSong: addLabelToSong,
  removeFromSong: removeLabelFromSong,
  fetchForSong: fetchSongLabels,
} as const;
