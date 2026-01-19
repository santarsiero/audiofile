/**
 * AudioFile Canvas Item Utilities
 * 
 * Helpers for creating and managing canvas items (visual instances).
 * 
 * ARCHITECTURAL RULE: Canvas items are visual instances, not entities.
 * - Multiple instances can exist for the same entity
 * - Instance IDs are frontend-generated (not backend IDs)
 * - Removing an instance does NOT affect the backend entity
 */

import type {
  CanvasItem,
  CanvasInstanceId,
  CanvasPosition,
  SongCanvasItem,
  LabelCanvasItem,
  SuperLabelCanvasItem,
} from '@/types/canvas';
import type { SongId, LabelId } from '@/types/entities';

// =============================================================================
// INSTANCE ID GENERATION
// =============================================================================

/**
 * Counter for generating unique instance IDs within a session
 */
let instanceCounter = 0;

/**
 * Generate a unique canvas instance ID
 * Format: {type}-{entityId}-{counter}-{timestamp}
 * 
 * This ensures uniqueness even if the same entity is added multiple times.
 */
export function generateInstanceId(
  type: 'song' | 'label' | 'superlabel',
  entityId: string
): CanvasInstanceId {
  instanceCounter += 1;
  return `${type}-${entityId}-${instanceCounter}-${Date.now()}`;
}

/**
 * Reset the instance counter (for testing or session reset)
 */
export function resetInstanceCounter(): void {
  instanceCounter = 0;
}

// =============================================================================
// CANVAS ITEM FACTORIES
// =============================================================================

/**
 * Create a song canvas item (visual instance)
 */
export function createSongCanvasItem(
  songId: SongId,
  position: CanvasPosition,
  zIndex: number
): SongCanvasItem {
  return {
    instanceId: generateInstanceId('song', songId),
    type: 'song',
    entityId: songId,
    position,
    zIndex,
    isSelected: false,
    createdAt: Date.now(),
  };
}

/**
 * Create a label canvas item (visual instance)
 */
export function createLabelCanvasItem(
  labelId: LabelId,
  position: CanvasPosition,
  zIndex: number
): LabelCanvasItem {
  return {
    instanceId: generateInstanceId('label', labelId),
    type: 'label',
    entityId: labelId,
    position,
    zIndex,
    isSelected: false,
    createdAt: Date.now(),
  };
}

/**
 * Create a super label canvas item (visual instance)
 */
export function createSuperLabelCanvasItem(
  labelId: LabelId,
  position: CanvasPosition,
  zIndex: number
): SuperLabelCanvasItem {
  return {
    instanceId: generateInstanceId('superlabel', labelId),
    type: 'superlabel',
    entityId: labelId,
    position,
    zIndex,
    isSelected: false,
    createdAt: Date.now(),
  };
}

// =============================================================================
// CANVAS ITEM TRANSFORMATIONS
// =============================================================================

/**
 * Update the position of a canvas item
 * Returns a new item (immutable)
 */
export function moveCanvasItem<T extends CanvasItem>(
  item: T,
  newPosition: CanvasPosition
): T {
  return {
    ...item,
    position: newPosition,
  };
}

/**
 * Update the z-index of a canvas item
 * Returns a new item (immutable)
 */
export function bringToFront<T extends CanvasItem>(
  item: T,
  newZIndex: number
): T {
  return {
    ...item,
    zIndex: newZIndex,
  };
}

/**
 * Toggle selection state of a canvas item
 * Returns a new item (immutable)
 */
export function toggleSelection<T extends CanvasItem>(item: T): T {
  return {
    ...item,
    isSelected: !item.isSelected,
  };
}

/**
 * Set selection state of a canvas item
 * Returns a new item (immutable)
 */
export function setSelected<T extends CanvasItem>(
  item: T,
  isSelected: boolean
): T {
  return {
    ...item,
    isSelected,
  };
}

// =============================================================================
// CANVAS ITEM QUERIES
// =============================================================================

/**
 * Find all instances of a specific entity on canvas
 */
export function findInstancesByEntityId(
  items: CanvasItem[],
  entityId: string
): CanvasItem[] {
  return items.filter((item) => item.entityId === entityId);
}

/**
 * Find a specific instance by instance ID
 */
export function findInstanceById(
  items: CanvasItem[],
  instanceId: CanvasInstanceId
): CanvasItem | undefined {
  return items.find((item) => item.instanceId === instanceId);
}

/**
 * Get all song instances
 */
export function getSongInstances(items: CanvasItem[]): SongCanvasItem[] {
  return items.filter((item): item is SongCanvasItem => item.type === 'song');
}

/**
 * Get all label instances (including super labels)
 */
export function getLabelInstances(
  items: CanvasItem[]
): (LabelCanvasItem | SuperLabelCanvasItem)[] {
  return items.filter(
    (item): item is LabelCanvasItem | SuperLabelCanvasItem =>
      item.type === 'label' || item.type === 'superlabel'
  );
}

/**
 * Get the highest z-index among all items
 */
export function getMaxZIndex(items: CanvasItem[]): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map((item) => item.zIndex));
}

// =============================================================================
// DEFAULT POSITIONS
// =============================================================================

/**
 * Default position for new items (will be overridden by layout engine)
 */
export const DEFAULT_POSITION: CanvasPosition = { x: 0, y: 0 };

/**
 * Grid layout constants (used by AlphabeticalGridLayoutEngine)
 */
export const GRID_CONSTANTS = {
  /** Width of a song card */
  CARD_WIDTH: 180,
  /** Height of a song card */
  CARD_HEIGHT: 220,
  /** Horizontal gap between cards */
  GAP_X: 24,
  /** Vertical gap between cards */
  GAP_Y: 24,
  /** Padding from canvas edge */
  PADDING: 32,
} as const;
