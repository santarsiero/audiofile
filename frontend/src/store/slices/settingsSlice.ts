/**
 * AudioFile Settings State Slice
 * 
 * Manages user settings (persisted per-library).
 * Settings apply immediately - no save button.
 * 
 * ARCHITECTURAL RULE: Settings are view state that affects behavior.
 */

import type { StateCreator } from 'zustand';
import type { 
  Settings, 
  ThemeMode, 
  StreamingSource, 
  ClickBehavior, 
  SearchScope,
  FilterMode,
} from '@/types/state';
import { DEFAULT_SETTINGS } from '@/types/state';

// =============================================================================
// TYPES
// =============================================================================

export interface SettingsSlice extends Settings {
  // Actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setStreamingSource: (source: StreamingSource) => void;
  setAllowDualLinking: (allow: boolean) => void;
  setFilterMode: (mode: FilterMode) => void;
  setClickBehavior: (behavior: ClickBehavior) => void;
  setSearchScope: (scope: SearchScope) => void;
  setEnableUndoCopyPaste: (enable: boolean) => void;
  resetSettings: () => void;
}

// =============================================================================
// SLICE CREATOR
// =============================================================================

export const createSettingsSlice: StateCreator<
  SettingsSlice,
  [],
  [],
  SettingsSlice
> = (set) => ({
  ...DEFAULT_SETTINGS,
  
  setTheme: (theme) => {
    set({ theme });
    // Apply to document for Tailwind dark mode
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: newTheme };
    });
  },
  
  setStreamingSource: (streamingSource) => {
    set({ streamingSource });
  },
  
  setAllowDualLinking: (allowDualLinking) => {
    set({ allowDualLinking });
  },
  
  setFilterMode: (filterMode) => {
    set({ filterMode });
  },
  
  setClickBehavior: (clickBehavior) => {
    set({ clickBehavior });
  },
  
  setSearchScope: (searchScope) => {
    set({ searchScope });
  },
  
  setEnableUndoCopyPaste: (enableUndoCopyPaste) => {
    set({ enableUndoCopyPaste });
  },
  
  resetSettings: () => {
    set(DEFAULT_SETTINGS);
  },
});
