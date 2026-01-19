/**
 * AudioFile Label Modes State Slice
 * 
 * Manages label display modes and the currently active mode.
 * Modes control which labels are visible for tagging/filtering (speed tool).
 * 
 * ARCHITECTURAL RULE: Modes do NOT filter songs or remove labels from songs.
 * They only control which labels are VISIBLE for selection.
 */

import type { StateCreator } from 'zustand';
import type { LabelMode, LabelModeId, LabelId } from '@/types/entities';
import type { LabelModeState } from '@/types/state';
import { DEFAULT_LABEL_MODE_STATE } from '@/types/state';

// =============================================================================
// TYPES
// =============================================================================

export interface ModesSlice extends LabelModeState {
  // Data
  modesById: Record<LabelModeId, LabelMode>;
  modeIds: LabelModeId[];
  
  // Loading state
  isLoadingModes: boolean;
  modesError: string | null;
  
  // Actions
  setModes: (modes: LabelMode[]) => void;
  addMode: (mode: LabelMode) => void;
  updateMode: (modeId: LabelModeId, updates: Partial<LabelMode>) => void;
  removeMode: (modeId: LabelModeId) => void;
  setActiveMode: (modeId: LabelModeId | null) => void;
  setLoadingModes: (isLoading: boolean) => void;
  setModesError: (error: string | null) => void;
  resetModes: () => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  ...DEFAULT_LABEL_MODE_STATE,
  modesById: {} as Record<LabelModeId, LabelMode>,
  modeIds: [] as LabelModeId[],
  isLoadingModes: false,
  modesError: null,
};

// =============================================================================
// SLICE CREATOR
// =============================================================================

export const createModesSlice: StateCreator<
  ModesSlice,
  [],
  [],
  ModesSlice
> = (set) => ({
  ...initialState,
  
  setModes: (modes) => {
    const modesById: Record<LabelModeId, LabelMode> = {};
    const modeIds: LabelModeId[] = [];
    
    modes.forEach((mode) => {
      modesById[mode.modeId] = mode;
      modeIds.push(mode.modeId);
    });
    
    set({ modesById, modeIds, modesError: null });
  },
  
  addMode: (mode) => {
    set((state) => ({
      modesById: { ...state.modesById, [mode.modeId]: mode },
      modeIds: [...state.modeIds, mode.modeId],
    }));
  },
  
  updateMode: (modeId, updates) => {
    set((state) => {
      const existingMode = state.modesById[modeId];
      if (!existingMode) return state;
      
      return {
        modesById: {
          ...state.modesById,
          [modeId]: { ...existingMode, ...updates },
        },
      };
    });
  },
  
  removeMode: (modeId) => {
    set((state) => {
      const { [modeId]: removed, ...remainingModes } = state.modesById;
      return {
        modesById: remainingModes,
        modeIds: state.modeIds.filter((id) => id !== modeId),
        // If the removed mode was active, clear active mode
        activeModeId: state.activeModeId === modeId ? null : state.activeModeId,
      };
    });
  },
  
  setActiveMode: (modeId) => {
    set({ activeModeId: modeId });
  },
  
  setLoadingModes: (isLoading) => {
    set({ isLoadingModes: isLoading });
  },
  
  setModesError: (error) => {
    set({ modesError: error, isLoadingModes: false });
  },
  
  resetModes: () => {
    set(initialState);
  },
});

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Get all modes as an array
 */
export function selectAllModes(state: ModesSlice): LabelMode[] {
  return state.modeIds.map((id) => state.modesById[id]);
}

/**
 * Get the currently active mode
 */
export function selectActiveMode(state: ModesSlice): LabelMode | null {
  if (!state.activeModeId) return null;
  return state.modesById[state.activeModeId] || null;
}

/**
 * Get label IDs that are visible in the current mode
 * Returns all labels if no mode is active
 */
export function selectVisibleLabelIds(
  state: ModesSlice,
  allLabelIds: LabelId[]
): LabelId[] {
  if (!state.activeModeId) {
    return allLabelIds; // No mode = show all
  }
  
  const activeMode = state.modesById[state.activeModeId];
  if (!activeMode) {
    return allLabelIds; // Mode not found = show all
  }
  
  return activeMode.labelIds;
}

/**
 * Check if a label is visible in the current mode
 */
export function selectIsLabelVisibleInMode(
  state: ModesSlice,
  labelId: LabelId,
  allLabelIds: LabelId[]
): boolean {
  const visibleIds = selectVisibleLabelIds(state, allLabelIds);
  return visibleIds.includes(labelId);
}
