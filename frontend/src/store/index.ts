/**
 * AudioFile Global Store
 * 
 * Single source of truth for all frontend state.
 * Combines all slices into one unified store.
 * 
 * ARCHITECTURAL RULES:
 * - There is ONE global state
 * - Components render from state, not derive competing truth
 * - State updates flow unidirectionally
 * - No component owns its own interpretation of visibility/layout/filters
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

import {
  createLibrarySlice,
  createSongsSlice,
  createLabelsSlice,
  createFiltersSlice,
  createSettingsSlice,
  createCanvasSlice,
  createModesSlice,
  createPanelsSlice,
} from './slices';

import type { LibrarySlice } from './slices/librarySlice';
import type { SongsSlice } from './slices/songsSlice';
import type { LabelsSlice } from './slices/labelsSlice';
import type { FiltersSlice } from './slices/filtersSlice';
import type { SettingsSlice } from './slices/settingsSlice';
import type { CanvasSlice } from './slices/canvasSlice';
import type { ModesSlice } from './slices/modesSlice';
import type { PanelsSlice } from './slices/panelsSlice';

// =============================================================================
// COMBINED STORE TYPE
// =============================================================================

/**
 * Complete store type combining all slices
 */
export type AppStore = LibrarySlice &
  SongsSlice &
  LabelsSlice &
  FiltersSlice &
  SettingsSlice &
  CanvasSlice &
  ModesSlice &
  PanelsSlice;

// =============================================================================
// STORE CREATION
// =============================================================================

/**
 * Global application store
 * 
 * Middleware:
 * - devtools: Redux DevTools integration (dev only)
 * - subscribeWithSelector: Enables selective subscriptions
 * - persist: Persists settings to localStorage (partial)
 */
export const useStore = create<AppStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (...args) => ({
          ...createLibrarySlice(...args),
          ...createSongsSlice(...args),
          ...createLabelsSlice(...args),
          ...createFiltersSlice(...args),
          ...createSettingsSlice(...args),
          ...createCanvasSlice(...args),
          ...createModesSlice(...args),
          ...createPanelsSlice(...args),
        }),
        {
          name: 'audiofile-storage',
          // Only persist settings, not data or canvas state
          partialize: (state) => ({
            theme: state.theme,
            streamingSource: state.streamingSource,
            allowDualLinking: state.allowDualLinking,
            filterMode: state.filterMode,
            clickBehavior: state.clickBehavior,
            searchScope: state.searchScope,
            enableUndoCopyPaste: state.enableUndoCopyPaste,
          }),
        }
      )
    ),
    {
      name: 'AudioFile',
      enabled: import.meta.env.DEV,
    }
  )
);

// =============================================================================
// TYPED SELECTORS
// =============================================================================

// Re-export selectors from slices for convenience
export {
  selectAllSongs,
  selectSongById,
  selectSongsByIds,
  selectSongCount,
} from './slices/songsSlice';

export {
  selectAllLabels,
  selectAllSuperLabels,
  selectLabelById,
  selectLabelsForSong,
  selectSongsWithLabel,
  selectSongHasLabel,
} from './slices/labelsSlice';

export {
  selectIsFilterActive,
  selectActiveFilterCount,
  selectHasActiveFilters,
} from './slices/filtersSlice';

export {
  selectAllCanvasItems,
  selectSelectedItems,
  selectItemByInstanceId,
  selectInstancesOfEntity,
  selectSongInstances,
  selectSongInstanceCount,
} from './slices/canvasSlice';

export {
  selectAllModes,
  selectActiveMode,
  selectVisibleLabelIds,
  selectIsLabelVisibleInMode,
} from './slices/modesSlice';

export {
  selectAnyPanelOpen,
  selectPanelEntityId,
  selectIsContentTypeOpen,
} from './slices/panelsSlice';

// =============================================================================
// STORE INITIALIZATION HELPERS
// =============================================================================

/**
 * Reset all store state
 * Useful for logout or library switch
 */
export function resetAllState(): void {
  const store = useStore.getState();
  store.resetLibrary();
  store.resetSongs();
  store.resetLabels();
  store.resetFilters();
  store.resetSettings();
  store.resetCanvas();
  store.resetModes();
  store.resetPanels();
}

/**
 * Initialize theme on app start
 * Applies theme class to document based on persisted setting
 */
export function initializeTheme(): void {
  const { theme } = useStore.getState();
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
