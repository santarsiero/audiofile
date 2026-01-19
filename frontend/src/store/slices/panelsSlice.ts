/**
 * AudioFile Panels State Slice
 * 
 * Manages the state of left and right panels.
 * Panels are independent and can be opened/closed separately.
 * 
 * ARCHITECTURAL RULE: Panel state is view state only.
 * Closing a panel resets its content (no memory of previous state).
 */

import type { StateCreator } from 'zustand';
import type { PanelsState, PanelId, PanelContentType } from '@/types/state';
import { DEFAULT_PANELS_STATE } from '@/types/state';

// =============================================================================
// TYPES
// =============================================================================

export interface PanelsSlice extends PanelsState {
  // Actions
  openPanel: (
    panelId: PanelId,
    contentType: PanelContentType,
    entityId?: string | null
  ) => void;
  closePanel: (panelId: PanelId) => void;
  togglePanel: (panelId: PanelId) => void;
  setPanelContent: (
    panelId: PanelId,
    contentType: PanelContentType,
    entityId?: string | null
  ) => void;
  closeAllPanels: () => void;
  resetPanels: () => void;
}

// =============================================================================
// SLICE CREATOR
// =============================================================================

export const createPanelsSlice: StateCreator<
  PanelsSlice,
  [],
  [],
  PanelsSlice
> = (set) => ({
  ...DEFAULT_PANELS_STATE,
  
  openPanel: (panelId, contentType, entityId = null) => {
    set((state) => ({
      [panelId]: {
        isOpen: true,
        contentType,
        entityId,
      },
    }));
  },
  
  closePanel: (panelId) => {
    set((state) => ({
      [panelId]: {
        isOpen: false,
        contentType: null,
        entityId: null,
      },
    }));
  },
  
  togglePanel: (panelId) => {
    set((state) => {
      const panel = state[panelId];
      if (panel.isOpen) {
        return {
          [panelId]: {
            isOpen: false,
            contentType: null,
            entityId: null,
          },
        };
      }
      // If opening without content, default to appropriate list
      return {
        [panelId]: {
          isOpen: true,
          contentType: panelId === 'left' ? 'song-list' : 'label-list',
          entityId: null,
        },
      };
    });
  },
  
  setPanelContent: (panelId, contentType, entityId = null) => {
    set((state) => ({
      [panelId]: {
        ...state[panelId],
        contentType,
        entityId,
      },
    }));
  },
  
  closeAllPanels: () => {
    set(DEFAULT_PANELS_STATE);
  },
  
  resetPanels: () => {
    set(DEFAULT_PANELS_STATE);
  },
});

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Check if any panel is open
 */
export function selectAnyPanelOpen(state: PanelsSlice): boolean {
  return state.left.isOpen || state.right.isOpen;
}

/**
 * Get the entity being viewed in a panel
 */
export function selectPanelEntityId(
  state: PanelsSlice,
  panelId: PanelId
): string | null {
  return state[panelId].entityId;
}

/**
 * Check if a specific content type is open in any panel
 */
export function selectIsContentTypeOpen(
  state: PanelsSlice,
  contentType: PanelContentType
): boolean {
  return (
    state.left.contentType === contentType ||
    state.right.contentType === contentType
  );
}
