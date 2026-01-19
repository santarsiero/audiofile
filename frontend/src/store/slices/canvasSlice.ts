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
  LabelCanvasItem,
  SuperLabelCanvasItem,
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

export interface CanvasSlice {
  // Canvas items (visual instances)
  items: CanvasItem[];
  
  // Viewport state
  viewport: CanvasViewport;
  
  // Z-index tracking
  nextZIndex: number;
  
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
  clearSelection: () => void;
  selectAll: () => void;
  
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

const initialState = {
  items: [] as CanvasItem[],
  viewport: DEFAULT_VIEWPORT,
  nextZIndex: 1,
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
    set((state) => ({
      items: state.items.filter((item) => item.instanceId !== instanceId),
    }));
  },
  
  removeAllInstancesOfEntity: (entityId) => {
    set((state) => ({
      items: state.items.filter((item) => item.entityId !== entityId),
    }));
  },
  
  clearCanvas: () => {
    set({ items: [], nextZIndex: 1 });
  },
  
  setItems: (items) => {
    const maxZ = getMaxZIndex(items);
    set({ items, nextZIndex: maxZ + 1 });
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
    set((state) => ({
      items: state.items.map((item) =>
        item.instanceId === instanceId
          ? setSelected(item, true)
          : item
      ),
    }));
  },
  
  deselectInstance: (instanceId) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.instanceId === instanceId
          ? setSelected(item, false)
          : item
      ),
    }));
  },
  
  toggleInstanceSelection: (instanceId) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.instanceId === instanceId
          ? setSelected(item, !item.isSelected)
          : item
      ),
    }));
  },
  
  clearSelection: () => {
    set((state) => ({
      items: state.items.map((item) =>
        item.isSelected ? setSelected(item, false) : item
      ),
    }));
  },
  
  selectAll: () => {
    set((state) => ({
      items: state.items.map((item) => setSelected(item, true)),
    }));
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
