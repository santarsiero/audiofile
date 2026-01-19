/**
 * AudioFile Filters State Slice
 * 
 * Manages active label filters.
 * 
 * ARCHITECTURAL RULE: This is VIEW STATE, not data.
 * Filters determine which songs are visible, but filtering logic
 * is applied at the layout/selector layer, not here.
 */

import type { StateCreator } from 'zustand';
import type { LabelId } from '@/types/entities';
import type { FilterState } from '@/types/state';
import { DEFAULT_FILTER_STATE } from '@/types/state';

// =============================================================================
// TYPES
// =============================================================================

export interface FiltersSlice extends FilterState {
  // Actions
  addFilter: (labelId: LabelId) => void;
  removeFilter: (labelId: LabelId) => void;
  setFilters: (labelIds: LabelId[]) => void;
  toggleFilter: (labelId: LabelId) => void;
  clearFilters: () => void;
  setAllSongsActive: (active: boolean) => void;
  resetFilters: () => void;
}

// =============================================================================
// SLICE CREATOR
// =============================================================================

export const createFiltersSlice: StateCreator<
  FiltersSlice,
  [],
  [],
  FiltersSlice
> = (set) => ({
  ...DEFAULT_FILTER_STATE,
  
  addFilter: (labelId) => {
    set((state) => {
      if (state.activeLabelIds.includes(labelId)) {
        return state; // Already active
      }
      return {
        activeLabelIds: [...state.activeLabelIds, labelId],
        allSongsActive: false, // Deactivate "All Songs" when adding filters
      };
    });
  },
  
  removeFilter: (labelId) => {
    set((state) => {
      const newFilters = state.activeLabelIds.filter((id) => id !== labelId);
      return {
        activeLabelIds: newFilters,
        // If no filters remain, activate "All Songs"
        allSongsActive: newFilters.length === 0 ? true : state.allSongsActive,
      };
    });
  },
  
  setFilters: (labelIds) => {
    set({
      activeLabelIds: labelIds,
      allSongsActive: labelIds.length === 0,
    });
  },
  
  toggleFilter: (labelId) => {
    set((state) => {
      const isActive = state.activeLabelIds.includes(labelId);
      if (isActive) {
        const newFilters = state.activeLabelIds.filter((id) => id !== labelId);
        return {
          activeLabelIds: newFilters,
          allSongsActive: newFilters.length === 0,
        };
      } else {
        return {
          activeLabelIds: [...state.activeLabelIds, labelId],
          allSongsActive: false,
        };
      }
    });
  },
  
  clearFilters: () => {
    set({
      activeLabelIds: [],
      allSongsActive: true,
    });
  },
  
  setAllSongsActive: (active) => {
    set((state) => ({
      allSongsActive: active,
      // If activating "All Songs", clear filters
      activeLabelIds: active ? [] : state.activeLabelIds,
    }));
  },
  
  resetFilters: () => {
    set(DEFAULT_FILTER_STATE);
  },
});

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Check if a specific label is active as a filter
 */
export function selectIsFilterActive(
  state: FiltersSlice,
  labelId: LabelId
): boolean {
  return state.activeLabelIds.includes(labelId);
}

/**
 * Get the count of active filters
 */
export function selectActiveFilterCount(state: FiltersSlice): number {
  return state.activeLabelIds.length;
}

/**
 * Check if any filters are active (excluding "All Songs")
 */
export function selectHasActiveFilters(state: FiltersSlice): boolean {
  return state.activeLabelIds.length > 0;
}
