/**
 * AudioFile Alphabetical Grid Layout Engine
 * 
 * The default and only layout engine for MVP.
 * Arranges items in a grid, sorted alphabetically by display title.
 * 
 * ARCHITECTURAL RULES:
 * - This is a PURE FUNCTION
 * - No state mutation
 * - No side effects
 * - Same input always produces same output
 * 
 * SORTING RULES (from Frontend MVP Source of Truth):
 * - Songs: by displayTitle (A-Z), with displayArtist as tie-break
 * - Labels/Superlabels: by label name (A-Z)
 * - Mixed types: grouped by type first, then alphabetized within group
 */

import type { CanvasItem } from '@/types/canvas';
import type { Song, Label, SuperLabel } from '@/types/entities';
import type {
  LayoutEngine,
  GridLayoutParameters,
  LayoutResult,
  PositionedItem,
} from './types';

// =============================================================================
// DEFAULT PARAMETERS
// =============================================================================

/**
 * Default grid layout parameters
 */
export const DEFAULT_GRID_PARAMETERS: GridLayoutParameters = {
  containerWidth: 1200,
  containerHeight: undefined,
  padding: 32,
  itemWidth: 180,
  itemHeight: 220,
  gapX: 24,
  gapY: 24,
};

// =============================================================================
// SORTING HELPERS
// =============================================================================

/**
 * Entity data needed for sorting
 * This is passed alongside canvas items for sorting purposes
 */
export interface SortableEntityData {
  songs: Record<string, Song>;
  labels: Record<string, Label | SuperLabel>;
}

/**
 * Get sort key for an item
 */
function getSortKey(
  item: CanvasItem,
  entityData: SortableEntityData
): string {
  switch (item.type) {
    case 'song': {
      const song = entityData.songs[item.entityId];
      if (!song) return item.entityId;
      // Primary: displayTitle, Secondary: displayArtist
      return `${song.displayTitle.toLowerCase()}|${song.displayArtist.toLowerCase()}`;
    }
    case 'label':
    case 'superlabel': {
      const label = entityData.labels[item.entityId];
      if (!label) return item.entityId;
      return label.name.toLowerCase();
    }
    default:
      return item.entityId;
  }
}

/**
 * Sort items alphabetically
 */
function sortItemsAlphabetically(
  items: CanvasItem[],
  entityData: SortableEntityData
): CanvasItem[] {
  return [...items].sort((a, b) => {
    // Group by type first (songs before labels)
    const typeOrder = { song: 0, label: 1, superlabel: 2 };
    const typeCompare = typeOrder[a.type] - typeOrder[b.type];
    if (typeCompare !== 0) return typeCompare;
    
    // Then sort alphabetically within type
    const keyA = getSortKey(a, entityData);
    const keyB = getSortKey(b, entityData);
    return keyA.localeCompare(keyB);
  });
}

// =============================================================================
// LAYOUT COMPUTATION
// =============================================================================

/**
 * Compute grid positions for items
 */
function computeGridPositions(
  sortedItems: CanvasItem[],
  params: GridLayoutParameters
): PositionedItem[] {
  const {
    containerWidth,
    padding,
    itemWidth,
    itemHeight,
    gapX,
    gapY,
  } = params;
  
  // Calculate available width for items
  const availableWidth = containerWidth - (padding * 2);
  
  // Calculate number of columns that fit
  const columns = Math.max(
    1,
    Math.floor((availableWidth + gapX) / (itemWidth + gapX))
  );
  
  // Position each item
  return sortedItems.map((item, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    
    const x = padding + col * (itemWidth + gapX);
    const y = padding + row * (itemHeight + gapY);
    
    return {
      instanceId: item.instanceId,
      position: { x, y },
    };
  });
}

/**
 * Calculate total layout dimensions
 */
function calculateLayoutDimensions(
  itemCount: number,
  params: GridLayoutParameters
): { totalWidth: number; totalHeight: number; columns: number; rows: number } {
  const {
    containerWidth,
    padding,
    itemWidth,
    itemHeight,
    gapX,
    gapY,
  } = params;
  
  const availableWidth = containerWidth - (padding * 2);
  const columns = Math.max(
    1,
    Math.floor((availableWidth + gapX) / (itemWidth + gapX))
  );
  const rows = Math.ceil(itemCount / columns);
  
  const totalWidth = containerWidth;
  const totalHeight = rows > 0
    ? padding * 2 + rows * itemHeight + (rows - 1) * gapY
    : padding * 2;
  
  return { totalWidth, totalHeight, columns, rows };
}

// =============================================================================
// MAIN LAYOUT ENGINE
// =============================================================================

/**
 * Alphabetical Grid Layout Engine
 * 
 * Pure function that computes grid positions for canvas items.
 * 
 * @param items - Canvas items to position
 * @param parameters - Grid layout parameters
 * @param entityData - Entity data needed for sorting (optional)
 * @returns Layout result with positioned items
 */
export function alphabeticalGridLayoutEngine(
  items: CanvasItem[],
  parameters: GridLayoutParameters = DEFAULT_GRID_PARAMETERS,
  entityData: SortableEntityData = { songs: {}, labels: {} }
): LayoutResult {
  // Handle empty case
  if (items.length === 0) {
    return {
      items: [],
      totalWidth: parameters.containerWidth,
      totalHeight: parameters.padding * 2,
      columns: 0,
      rows: 0,
    };
  }
  
  // Sort items alphabetically
  const sortedItems = sortItemsAlphabetically(items, entityData);
  
  // Compute positions
  const positionedItems = computeGridPositions(sortedItems, parameters);
  
  // Calculate dimensions
  const dimensions = calculateLayoutDimensions(items.length, parameters);
  
  return {
    items: positionedItems,
    ...dimensions,
  };
}

// =============================================================================
// SIMPLIFIED VERSION (Without entity data - uses instance order)
// =============================================================================

/**
 * Simple grid layout without sorting
 * Useful when items are already in desired order
 */
export function simpleGridLayoutEngine(
  items: CanvasItem[],
  parameters: GridLayoutParameters = DEFAULT_GRID_PARAMETERS
): LayoutResult {
  if (items.length === 0) {
    return {
      items: [],
      totalWidth: parameters.containerWidth,
      totalHeight: parameters.padding * 2,
      columns: 0,
      rows: 0,
    };
  }
  
  const positionedItems = computeGridPositions(items, parameters);
  const dimensions = calculateLayoutDimensions(items.length, parameters);
  
  return {
    items: positionedItems,
    ...dimensions,
  };
}

// =============================================================================
// TYPE EXPORT FOR GENERIC USAGE
// =============================================================================

/**
 * Type-safe layout engine export
 */
export const AlphabeticalGridLayoutEngine: LayoutEngine<GridLayoutParameters> = 
  (items, params) => simpleGridLayoutEngine(items, params);
