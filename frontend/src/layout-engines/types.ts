/**
 * AudioFile Layout Engine Types
 * 
 * Defines the interface for layout engines.
 * 
 * ARCHITECTURAL RULES:
 * - Layout engines are PURE FUNCTIONS
 * - Same input always produces same output
 * - No state mutation
 * - No data fetching
 * - No side effects (logging, analytics, etc.)
 * - Synchronous only (no async operations)
 */

import type { CanvasItem, CanvasPosition, CanvasInstanceId } from '@/types/canvas';

// =============================================================================
// LAYOUT PARAMETERS
// =============================================================================

/**
 * Base layout parameters (common to all engines)
 */
export interface BaseLayoutParameters {
  /** Available width for layout */
  containerWidth: number;
  
  /** Available height for layout (optional, for constrained layouts) */
  containerHeight?: number;
  
  /** Padding from container edges */
  padding: number;
}

/**
 * Grid layout specific parameters
 */
export interface GridLayoutParameters extends BaseLayoutParameters {
  /** Width of each item */
  itemWidth: number;
  
  /** Height of each item */
  itemHeight: number;
  
  /** Horizontal gap between items */
  gapX: number;
  
  /** Vertical gap between items */
  gapY: number;
}

/**
 * Sort configuration for layouts that support sorting
 */
export interface SortConfig {
  /** Field to sort by */
  field: 'title' | 'artist' | 'createdAt' | 'updatedAt';
  
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Combined layout parameters (union of all specific types)
 */
export type LayoutParameters = GridLayoutParameters;

// =============================================================================
// LAYOUT RESULT
// =============================================================================

/**
 * Position assignment for a single item
 */
export interface PositionedItem {
  /** Instance ID of the canvas item */
  instanceId: CanvasInstanceId;
  
  /** Computed position */
  position: CanvasPosition;
}

/**
 * Result of a layout computation
 */
export interface LayoutResult {
  /** All positioned items */
  items: PositionedItem[];
  
  /** Total width of the layout (for scroll bounds) */
  totalWidth: number;
  
  /** Total height of the layout (for scroll bounds) */
  totalHeight: number;
  
  /** Number of columns (for grid layouts) */
  columns?: number;
  
  /** Number of rows (for grid layouts) */
  rows?: number;
}

// =============================================================================
// LAYOUT ENGINE TYPE
// =============================================================================

/**
 * Layout engine function signature
 * 
 * A layout engine is a pure function that:
 * 1. Receives canvas items and parameters
 * 2. Returns positioned items
 * 
 * It does NOT:
 * - Mutate state
 * - Fetch data
 * - Store internal memory
 * - Have side effects
 */
export type LayoutEngine<P extends BaseLayoutParameters = LayoutParameters> = (
  items: CanvasItem[],
  parameters: P
) => LayoutResult;

// =============================================================================
// LAYOUT ENGINE REGISTRY (for future multi-engine support)
// =============================================================================

/**
 * Available layout engine identifiers
 */
export type LayoutEngineId = 
  | 'alphabetical-grid'
  // Future engines (Phase 6):
  // | 'force-directed'
  // | 'compass'
  // | 'timeline'
  // | 'distance-cluster'
  ;

/**
 * Layout engine metadata
 */
export interface LayoutEngineInfo {
  id: LayoutEngineId;
  name: string;
  description: string;
}

/**
 * Registry of available layout engines
 */
export const LAYOUT_ENGINE_REGISTRY: Record<LayoutEngineId, LayoutEngineInfo> = {
  'alphabetical-grid': {
    id: 'alphabetical-grid',
    name: 'Alphabetical Grid',
    description: 'Arranges items in a grid, sorted alphabetically by title',
  },
  // Future engines will be added here
};
