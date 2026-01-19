/**
 * AudioFile Library State Slice
 * 
 * Manages the active library and bootstrap status.
 * 
 * ARCHITECTURAL RULE: Frontend operates on exactly one active library per session.
 */

import type { StateCreator } from 'zustand';
import type { Library, LibraryId } from '@/types/entities';

// =============================================================================
// TYPES
// =============================================================================

export interface LibrarySlice {
  // State
  activeLibraryId: LibraryId | null;
  library: Library | null;
  isBootstrapped: boolean;
  isBootstrapping: boolean;
  bootstrapError: string | null;
  
  // Actions
  setActiveLibrary: (libraryId: LibraryId) => void;
  setLibraryData: (library: Library) => void;
  setBootstrapping: (isBootstrapping: boolean) => void;
  setBootstrapped: (isBootstrapped: boolean) => void;
  setBootstrapError: (error: string | null) => void;
  resetLibrary: () => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  activeLibraryId: null,
  library: null,
  isBootstrapped: false,
  isBootstrapping: false,
  bootstrapError: null,
};

// =============================================================================
// SLICE CREATOR
// =============================================================================

export const createLibrarySlice: StateCreator<
  LibrarySlice,
  [],
  [],
  LibrarySlice
> = (set) => ({
  ...initialState,
  
  setActiveLibrary: (libraryId) => {
    set({
      activeLibraryId: libraryId,
      isBootstrapped: false,
      bootstrapError: null,
    });
  },
  
  setLibraryData: (library) => {
    set({ library });
  },
  
  setBootstrapping: (isBootstrapping) => {
    set({ isBootstrapping });
  },
  
  setBootstrapped: (isBootstrapped) => {
    set({ isBootstrapped, isBootstrapping: false });
  },
  
  setBootstrapError: (error) => {
    set({ bootstrapError: error, isBootstrapping: false });
  },
  
  resetLibrary: () => {
    set(initialState);
  },
});
