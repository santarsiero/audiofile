/**
 * AudioFile Canvas State Slice
 * 
 * Manages canvas visual instances and viewport state.
 * 
 * ARCHITECTURAL RULES:
 * - Canvas items are VISUAL INSTANCES, not entities
 * - Multiple instances of the same entity can exist
 * - Removing from canvas does NOT delete from backend
 * - Layout positions are computed by layout engines, stored here
 */

import type { StateCreator } from 'zustand';
import type {
  CanvasItem,
  CanvasInstanceId,
  CanvasPosition,
  CanvasViewport,
  SongCanvasItem,
} from '@/types/canvas';
import type { SongId, LabelId } from '@/types/entities';
import {
  createSongCanvasItem,
  createLabelCanvasItem,
  createSuperLabelCanvasItem,
  moveCanvasItem,
  bringToFront,
  setSelected,
  getMaxZIndex,
} from '@/domain/canvasItems';

// =============================================================================
// TYPES
// =============================================================================

export type CanvasUndoActionType =
  | 'move'
  | 'copy'
  | 'delete'
  | 'apply-label'
  | 'rebuild';

export interface LabelApplicationOperation {
  songId: SongId;
  labelId: LabelId;
}

export interface CanvasUndoEntryMeta {
  labelApplications?: LabelApplicationOperation[];
}

export interface CanvasSnapshot {
  items: CanvasItem[];
  nextZIndex: number;
  viewport: CanvasViewport;
  selectedInstanceIds: CanvasInstanceId[];
}

export interface CanvasUndoEntry {
  action: CanvasUndoActionType;
  snapshot: CanvasSnapshot;
  meta?: CanvasUndoEntryMeta;
}

export interface CanvasSlice {
  // Canvas items (visual instances)
  items: CanvasItem[];
  
  // Viewport state
  viewport: CanvasViewport;
  
  // Selection tracking
  selectedInstanceIds: CanvasInstanceId[];
  
  // Rebuild coordination
  rebuildVersion: number;
  markRebuildStart: () => void;
  
  // Z-index tracking
  nextZIndex: number;
  
  // Undo/redo stacks
  undoStack: CanvasUndoEntry[];
  redoStack: CanvasUndoEntry[];
  
  // Actions - Item management
  addSongInstance: (songId: SongId, position: CanvasPosition) => CanvasInstanceId;
  addLabelInstance: (labelId: LabelId, position: CanvasPosition) => CanvasInstanceId;
  addSuperLabelInstance: (labelId: LabelId, position: CanvasPosition) => CanvasInstanceId;
  removeInstance: (instanceId: CanvasInstanceId) => void;
  removeAllInstancesOfEntity: (entityId: string) => void;
  clearCanvas: () => void;
  setItems: (items: CanvasItem[]) => void;
  
  // Actions - Position/Z-index
  moveInstance: (instanceId: CanvasInstanceId, position: CanvasPosition) => void;
  bringInstanceToFront: (instanceId: CanvasInstanceId) => void;
  
  // Actions - Selection
  selectInstance: (instanceId: CanvasInstanceId) => void;
  deselectInstance: (instanceId: CanvasInstanceId) => void;
  toggleInstanceSelection: (instanceId: CanvasInstanceId) => void;
  selectExclusiveInstance: (instanceId: CanvasInstanceId) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Actions - Snapshots / Undo
  createSnapshot: () => CanvasSnapshot;
  pushUndoEntry: (entry: CanvasUndoEntry) => void;
  undo: () => CanvasUndoEntry | null;
  redo: () => CanvasUndoEntry | null;
  clearRedoStack: () => void;
  
  // Actions - Viewport
  setViewport: (viewport: Partial<CanvasViewport>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  pan: (deltaX: number, deltaY: number) => void;
  resetPan: () => void;
  
  // Actions - Reset
  resetCanvas: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_VIEWPORT: CanvasViewport = {
  panX: 0,
  panY: 0,
  zoom: 1,
};

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

// =============================================================================
// INITIAL STATE
// =============================================================================

const UNDO_STACK_LIMIT = 50;

const initialState = {
  items: [] as CanvasItem[],
  viewport: DEFAULT_VIEWPORT,
  selectedInstanceIds: [] as CanvasInstanceId[],
  rebuildVersion: 0,
  nextZIndex: 1,
  undoStack: [] as CanvasUndoEntry[],
  redoStack: [] as CanvasUndoEntry[],
};

// =============================================================================
// SLICE CREATOR
// =============================================================================

export const createCanvasSlice: StateCreator<
  CanvasSlice,
  [],
  [],
  CanvasSlice
> = (set, get) => ({
  ...initialState,
  
  markRebuildStart: () => {
    set((state) => ({ rebuildVersion: state.rebuildVersion + 1 }));
  },

  // ==========================================================================
  // Item Management
  // ==========================================================================
  
  addSongInstance: (songId, position) => {
    const zIndex = get().nextZIndex;
    const item = createSongCanvasItem(songId, position, zIndex);
    
    set((state) => ({
      items: [...state.items, item],
      nextZIndex: state.nextZIndex + 1,
    }));
    
    return item.instanceId;
  },
  
  addLabelInstance: (labelId, position) => {
    const zIndex = get().nextZIndex;
    const item = createLabelCanvasItem(labelId, position, zIndex);
    
    set((state) => ({
      items: [...state.items, item],
      nextZIndex: state.nextZIndex + 1,
    }));
    
    return item.instanceId;
  },
  
  addSuperLabelInstance: (labelId, position) => {
    const zIndex = get().nextZIndex;
    const item = createSuperLabelCanvasItem(labelId, position, zIndex);
    
    set((state) => ({
      items: [...state.items, item],
      nextZIndex: state.nextZIndex + 1,
    }));
    
    return item.instanceId;
  },
  
  removeInstance: (instanceId) => {
    set((state) => {
      const filteredItems = state.items.filter((item) => item.instanceId !== instanceId);
      if (filteredItems.length === state.items.length) {
        return state;
      }

      const selectionSync = applySelectionToItems(
        filteredItems,
        state.selectedInstanceIds,
        state.selectedInstanceIds
      );

      return {
        items: selectionSync.items,
        selectedInstanceIds: selectionSync.selectedInstanceIds,
      };
    });
  },

  removeAllInstancesOfEntity: (entityId) => {
    set((state) => {
      const remainingItems = state.items.filter((item) => item.entityId !== entityId);
      if (remainingItems.length === state.items.length) {
        return state;
      }

      const selectionSync = applySelectionToItems(
        remainingItems,
        state.selectedInstanceIds,
        state.selectedInstanceIds
      );

      return {
        items: selectionSync.items,
        selectedInstanceIds: selectionSync.selectedInstanceIds,
      };
    });
  },

  clearCanvas: () => {
    set({ items: [], nextZIndex: 1, selectedInstanceIds: [] });
  },

  setItems: (items) => {
    const maxZ = getMaxZIndex(items);
    set((state) => {
      const selectionSync = applySelectionToItems(
        items,
        state.selectedInstanceIds,
        state.selectedInstanceIds
      );

      return {
        items: selectionSync.items,
        nextZIndex: maxZ + 1,
        selectedInstanceIds: selectionSync.selectedInstanceIds,
      };
    });
  },
  
  // ==========================================================================
  // Position/Z-index
  // ==========================================================================
  
  moveInstance: (instanceId, position) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.instanceId === instanceId
          ? moveCanvasItem(item, position)
          : item
      ),
    }));
  },
  
  bringInstanceToFront: (instanceId) => {
    const zIndex = get().nextZIndex;
    
    set((state) => ({
      items: state.items.map((item) =>
        item.instanceId === instanceId
          ? bringToFront(item, zIndex)
          : item
      ),
      nextZIndex: state.nextZIndex + 1,
    }));
  },
  
  // ==========================================================================
  // Selection
  // ==========================================================================
  
  selectInstance: (instanceId) => {
    set((state) => {
      const selectionSet = new Set(state.selectedInstanceIds);
      if (!selectionSet.has(instanceId)) {
        selectionSet.add(instanceId);
      }

      const selectionSync = applySelectionToItems(
        state.items,
        Array.from(selectionSet),
        state.selectedInstanceIds
      );

      if (!selectionSync.itemsChanged && !selectionSync.selectionChanged) {
        return state;
      }

      return {
        items: selectionSync.items,
        selectedInstanceIds: selectionSync.selectedInstanceIds,
      };
    });
  },

  deselectInstance: (instanceId) => {
    set((state) => {
      const selectionSet = new Set(state.selectedInstanceIds);
      if (!selectionSet.delete(instanceId)) {
        return state;
      }

      const selectionSync = applySelectionToItems(
        state.items,
        Array.from(selectionSet),
        state.selectedInstanceIds
      );

      return {
        items: selectionSync.items,
        selectedInstanceIds: selectionSync.selectedInstanceIds,
      };
    });
  },

  toggleInstanceSelection: (instanceId) => {
    set((state) => {
      const selectionSet = new Set(state.selectedInstanceIds);
      if (selectionSet.has(instanceId)) {
        selectionSet.delete(instanceId);
      } else {
        selectionSet.add(instanceId);
      }

      const selectionSync = applySelectionToItems(
        state.items,
        Array.from(selectionSet),
        state.selectedInstanceIds
      );

      if (!selectionSync.itemsChanged && !selectionSync.selectionChanged) {
        return state;
      }

      return {
        items: selectionSync.items,
        selectedInstanceIds: selectionSync.selectedInstanceIds,
      };
    });
  },

  selectExclusiveInstance: (instanceId) => {
    set((state) => {
      const selectionSync = applySelectionToItems(
        state.items,
        [instanceId],
        state.selectedInstanceIds
      );

      if (!selectionSync.itemsChanged && !selectionSync.selectionChanged) {
        return state;
      }

      return {
        items: selectionSync.items,
        selectedInstanceIds: selectionSync.selectedInstanceIds,
      };
    });
  },

  clearSelection: () => {
    set((state) => {
      if (!state.selectedInstanceIds.length && state.items.every((item) => !item.isSelected)) {
        return state;
      }

      const selectionSync = applySelectionToItems(state.items, [], state.selectedInstanceIds);
      return {
        items: selectionSync.items,
        selectedInstanceIds: selectionSync.selectedInstanceIds,
      };
    });
  },

  selectAll: () => {
    set((state) => {
      const requestedSelection = state.items.map((item) => item.instanceId);
      const selectionSync = applySelectionToItems(
        state.items,
        requestedSelection,
        state.selectedInstanceIds
      );

      if (!selectionSync.itemsChanged && !selectionSync.selectionChanged) {
        return state;
      }

      return {
        items: selectionSync.items,
        selectedInstanceIds: selectionSync.selectedInstanceIds,
      };
    });
  },
  
  // ==========================================================================
  // Snapshots / Undo
  // ==========================================================================
  

  createSnapshot: () => {
    const { items, nextZIndex, viewport, selectedInstanceIds } = get();
    return {
      items: items.map((item) => ({ ...item })),
      nextZIndex,
      viewport: { ...viewport },
      selectedInstanceIds: [...selectedInstanceIds],
    };
  },

  pushUndoEntry: (entry) => {
    set((state) => {
      const trimmed = [...state.undoStack, entry];
      if (trimmed.length > UNDO_STACK_LIMIT) {
        trimmed.shift();
      }
      return {
        undoStack: trimmed,
        redoStack: [],
      };
    });
  },

  undo: () => {
    const state = get();
    if (!state.undoStack.length) {
      return null;
    }

    const undoEntry = state.undoStack[state.undoStack.length - 1];
    const currentSnapshot = state.createSnapshot();

    set((prevState) => {
      const updatedUndoStack = prevState.undoStack.slice(0, -1);
      const updatedRedoStack = [...prevState.redoStack, {
        action: undoEntry.action,
        snapshot: currentSnapshot,
        meta: undoEntry.meta,
      }];
      if (updatedRedoStack.length > UNDO_STACK_LIMIT) {
        updatedRedoStack.shift();
      }

      const restoredItems = undoEntry.snapshot.items.map((item) => ({ ...item }));
      const snapshotSelection =
        undoEntry.snapshot.selectedInstanceIds ?? deriveSelectionFromItems(restoredItems);
      const selectionSync = applySelectionToItems(
        restoredItems,
        snapshotSelection,
        prevState.selectedInstanceIds
      );

      return {
        items: selectionSync.items,
        nextZIndex: undoEntry.snapshot.nextZIndex,
        viewport: { ...undoEntry.snapshot.viewport },
        undoStack: updatedUndoStack,
        redoStack: updatedRedoStack,
        selectedInstanceIds: selectionSync.selectedInstanceIds,
      };
    });

    return undoEntry;
  },

  redo: () => {
    const state = get();
    if (!state.redoStack.length) {
      return null;
    }

    const redoEntry = state.redoStack[state.redoStack.length - 1];
    const currentSnapshot = state.createSnapshot();

    set((prevState) => {
      const updatedRedoStack = prevState.redoStack.slice(0, -1);
      const updatedUndoStack = [...prevState.undoStack, {
        action: redoEntry.action,
        snapshot: currentSnapshot,
        meta: redoEntry.meta,
      }];
      if (updatedUndoStack.length > UNDO_STACK_LIMIT) {
        updatedUndoStack.shift();
      }

      const restoredItems = redoEntry.snapshot.items.map((item) => ({ ...item }));
      const snapshotSelection =
        redoEntry.snapshot.selectedInstanceIds ?? deriveSelectionFromItems(restoredItems);
      const selectionSync = applySelectionToItems(
        restoredItems,
        snapshotSelection,
        prevState.selectedInstanceIds
      );

      return {
        items: selectionSync.items,
        nextZIndex: redoEntry.snapshot.nextZIndex,
        viewport: { ...redoEntry.snapshot.viewport },
        undoStack: updatedUndoStack,
        redoStack: updatedRedoStack,
        selectedInstanceIds: selectionSync.selectedInstanceIds,
      };
    });

    return redoEntry;
  },

  clearRedoStack: () => {
    set({ redoStack: [] });
  },

  // ==========================================================================
  // Viewport
  // ==========================================================================
  
  setViewport: (viewportUpdate) => {
    set((state) => ({
      viewport: { ...state.viewport, ...viewportUpdate },
    }));
  },
  
  zoomIn: () => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        zoom: Math.min(state.viewport.zoom + ZOOM_STEP, MAX_ZOOM),
      },
    }));
  },
  
  zoomOut: () => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        zoom: Math.max(state.viewport.zoom - ZOOM_STEP, MIN_ZOOM),
      },
    }));
  },
  
  resetZoom: () => {
    set((state) => ({
      viewport: { ...state.viewport, zoom: 1 },
    }));
  },
  
  pan: (deltaX, deltaY) => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        panX: state.viewport.panX + deltaX,
        panY: state.viewport.panY + deltaY,
      },
    }));
  },
  
  resetPan: () => {
    set((state) => ({
      viewport: { ...state.viewport, panX: 0, panY: 0 },
    }));
  },
  
  // ==========================================================================
  // Reset
  // ==========================================================================
  
  resetCanvas: () => {
    set(initialState);
  },
});

// =============================================================================
// SELECTION HELPERS
// =============================================================================

interface SelectionSyncResult {
  items: CanvasItem[];
  selectedInstanceIds: CanvasInstanceId[];
  itemsChanged: boolean;
  selectionChanged: boolean;
}

function applySelectionToItems(
  items: CanvasItem[],
  requestedSelection: CanvasInstanceId[],
  previousSelection?: CanvasInstanceId[]
): SelectionSyncResult {
  if (!items.length) {
    const shouldChangeSelection = requestedSelection.length > 0 || (previousSelection?.length ?? 0) > 0;
    const nextSelection = shouldChangeSelection ? [] : previousSelection ?? [];
    return {
      items,
      selectedInstanceIds: nextSelection,
      itemsChanged: false,
      selectionChanged: shouldChangeSelection,
    };
  }

  const existingIds = new Set(items.map((item) => item.instanceId));
  const dedupedSelection: CanvasInstanceId[] = [];
  const seen = new Set<CanvasInstanceId>();
  requestedSelection.forEach((id) => {
    if (!existingIds.has(id) || seen.has(id)) {
      return;
    }
    seen.add(id);
    dedupedSelection.push(id);
  });

  const selectionSet = new Set(dedupedSelection);
  let itemsChanged = false;
  const updatedItems = items.map((item) => {
    const shouldSelect = selectionSet.has(item.instanceId);
    if (item.isSelected !== shouldSelect) {
      itemsChanged = true;
      return setSelected(item, shouldSelect);
    }
    return item;
  });

  const selectionChanged = previousSelection
    ? !areArraysEqual(previousSelection, dedupedSelection)
    : true;

  const nextSelection = selectionChanged
    ? dedupedSelection
    : previousSelection ?? dedupedSelection;

  return {
    items: itemsChanged ? updatedItems : items,
    selectedInstanceIds: nextSelection,
    itemsChanged,
    selectionChanged,
  };
}

function deriveSelectionFromItems(items: CanvasItem[]): CanvasInstanceId[] {
  if (!items.length) {
    return [];
  }
  return items.filter((item) => item.isSelected).map((item) => item.instanceId);
}

function areArraysEqual<T>(a: T[], b: T[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Get all canvas items
 */
export function selectAllCanvasItems(state: CanvasSlice): CanvasItem[] {
  return state.items;
}

/**
 * Get selected canvas items
 */
export function selectSelectedItems(state: CanvasSlice): CanvasItem[] {
  return state.items.filter((item) => item.isSelected);
}

/**
 * Get canvas item by instance ID
 */
export function selectItemByInstanceId(
  state: CanvasSlice,
  instanceId: CanvasInstanceId
): CanvasItem | undefined {
  return state.items.find((item) => item.instanceId === instanceId);
}

/**
 * Get all instances of a specific entity
 */
export function selectInstancesOfEntity(
  state: CanvasSlice,
  entityId: string
): CanvasItem[] {
  return state.items.filter((item) => item.entityId === entityId);
}

/**
 * Get only song instances
 */
export function selectSongInstances(state: CanvasSlice): SongCanvasItem[] {
  return state.items.filter(
    (item): item is SongCanvasItem => item.type === 'song'
  );
}

/**
 * Get song instance count
 */
export function selectSongInstanceCount(state: CanvasSlice): number {
  return state.items.filter((item) => item.type === 'song').length;
}
