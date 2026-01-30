/**
 * AudioFile Label Mode API Service
 * 
 * Handles label display mode operations.
 * Label modes control which labels are visible for tagging/filtering (speed tool).
 */

import { apiClient } from './api';
import { useStore } from '@/store';
import type {
  GetLabelModesResponse,
  CreateLabelModeRequest,
  CreateLabelModeResponse,
  UpdateLabelModeRequest,
  UpdateLabelModeResponse,
} from '@/types/api';
import type { LabelMode, LabelModeId, LabelId } from '@/types/entities';

/**
 * Fetch all label modes for the current library
 */
export async function fetchLabelModes(): Promise<LabelMode[]> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }
  const response = await apiClient.get<GetLabelModesResponse>(
    `libraries/${activeLibraryId}/modes`
  );
  return response.modes;
}

/**
 * Fetch a single label mode by ID
 */
export async function fetchLabelModeById(
  modeId: LabelModeId
): Promise<LabelMode> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }
  const response = await apiClient.get<{ mode: LabelMode }>(
    `libraries/${activeLibraryId}/modes/${modeId}`
  );
  return response.mode;
}

/**
 * Create a new label mode
 */
export async function createLabelMode(
  name: string,
  labelIds: LabelId[]
): Promise<LabelMode> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }
  const request: CreateLabelModeRequest = { name, labelIds };
  const response = await apiClient.post<CreateLabelModeResponse>(
    `libraries/${activeLibraryId}/modes`,
    request
  );
  return response.mode;
}

/**
 * Update an existing label mode
 */
export async function updateLabelMode(
  modeId: LabelModeId,
  data: UpdateLabelModeRequest
): Promise<LabelMode> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }
  const response = await apiClient.put<UpdateLabelModeResponse>(
    `libraries/${activeLibraryId}/modes/${modeId}`,
    data
  );
  return response.mode;
}

/**
 * Delete a label mode
 */
export async function deleteLabelMode(modeId: LabelModeId): Promise<void> {
  const { activeLibraryId } = useStore.getState();
  if (!activeLibraryId) {
    throw new Error('No active library selected');
  }
  await apiClient.delete(`libraries/${activeLibraryId}/modes/${modeId}`);
}

/**
 * Label Mode API service object
 */
export const modeApi = {
  fetchAll: fetchLabelModes,
  fetchById: fetchLabelModeById,
  create: createLabelMode,
  update: updateLabelMode,
  delete: deleteLabelMode,
} as const;
