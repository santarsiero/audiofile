/**
 * AudioFile Label Mode API Service
 * 
 * Handles label display mode operations.
 * Label modes control which labels are visible for tagging/filtering (speed tool).
 */

import { apiClient } from './api';
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
  const response = await apiClient.get<GetLabelModesResponse>('/modes');
  return response.modes;
}

/**
 * Fetch a single label mode by ID
 */
export async function fetchLabelModeById(
  modeId: LabelModeId
): Promise<LabelMode> {
  return apiClient.get<LabelMode>(`/modes/${modeId}`);
}

/**
 * Create a new label mode
 */
export async function createLabelMode(
  name: string,
  labelIds: LabelId[]
): Promise<LabelMode> {
  const request: CreateLabelModeRequest = { name, labelIds };
  const response = await apiClient.post<CreateLabelModeResponse>(
    '/modes',
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
  const response = await apiClient.put<UpdateLabelModeResponse>(
    `/modes/${modeId}`,
    data
  );
  return response.mode;
}

/**
 * Delete a label mode
 */
export async function deleteLabelMode(modeId: LabelModeId): Promise<void> {
  await apiClient.delete(`/modes/${modeId}`);
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
