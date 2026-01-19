/**
 * AudioFile Canvas Types
 * 
 * ARCHITECTURAL RULE: Canvas items are VISUAL INSTANCES of canonical entities.
 * - A single backend entity (Song, Label) can appear multiple times on canvas
 * - Each visual instance has its own instance ID
 * - Metadata changes propagate to all instances of the same entity
 * - Removing from canvas does NOT delete from backend
 * 
 * This separation is critical for the Architecture Contract.
 */

import type { SongId, LabelId, Song, Label, SuperLabel } from './entities';

// =============================================================================
// CANVAS INSTANCE IDENTIFIERS
// =============================================================================

/** Unique identifier for a visual instance on canvas (frontend-generated) */
export type CanvasInstanceId = string;

// =============================================================================
// CANVAS ITEM TYPES
// =============================================================================

/**
 * Discriminator for canvas item types
 */
export type CanvasItemType = 'song' | 'label' | 'superlabel';

/**
 * Base canvas item structure
 * All visual instances share this common structure
 */
export interface CanvasItemBase {
  /** Unique instance ID (frontend-generated) */
  instanceId: CanvasInstanceId;
  
  /** Type discriminator */
  type: CanvasItemType;
  
  /** Position on canvas (set by layout engine or user drag) */
  position: CanvasPosition;
  
  /** Z-index for stacking order (higher = on top) */
  zIndex: number;
  
  /** Whether this instance is currently selected */
  isSelected: boolean;
  
  /** Timestamp when this instance was created (for z-order resolution) */
  createdAt: number;
}

/**
 * Song canvas item - visual instance of a Song entity
 */
export interface SongCanvasItem extends CanvasItemBase {
  type: 'song';
  
  /** Reference to canonical entity ID */
  entityId: SongId;
}

/**
 * Label canvas item - visual instance of a Label entity (regular)
 */
export interface LabelCanvasItem extends CanvasItemBase {
  type: 'label';
  
  /** Reference to canonical entity ID */
  entityId: LabelId;
}

/**
 * Super label canvas item - visual instance of a SuperLabel entity
 */
export interface SuperLabelCanvasItem extends CanvasItemBase {
  type: 'superlabel';
  
  /** Reference to canonical entity ID */
  entityId: LabelId;
}

/**
 * Union type for any canvas item
 */
export type CanvasItem = SongCanvasItem | LabelCanvasItem | SuperLabelCanvasItem;

// =============================================================================
// CANVAS POSITIONING
// =============================================================================

/**
 * Position on the infinite canvas
 */
export interface CanvasPosition {
  x: number;
  y: number;
}

/**
 * Canvas viewport state
 */
export interface CanvasViewport {
  /** Current pan offset */
  panX: number;
  panY: number;
  
  /** Current zoom level (1.0 = 100%) */
  zoom: number;
}

/**
 * Canvas dimensions for layout calculations
 */
export interface CanvasDimensions {
  /** Visible width of canvas area */
  width: number;
  
  /** Visible height of canvas area */
  height: number;
}

// =============================================================================
// CANVAS STATE
// =============================================================================

/**
 * Complete canvas state
 */
export interface CanvasState {
  /** All visual instances currently on canvas */
  items: CanvasItem[];
  
  /** Current viewport (pan/zoom) */
  viewport: CanvasViewport;
  
  /** Next z-index to assign (monotonically increasing) */
  nextZIndex: number;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isSongCanvasItem(item: CanvasItem): item is SongCanvasItem {
  return item.type === 'song';
}

export function isLabelCanvasItem(item: CanvasItem): item is LabelCanvasItem {
  return item.type === 'label';
}

export function isSuperLabelCanvasItem(item: CanvasItem): item is SuperLabelCanvasItem {
  return item.type === 'superlabel';
}

// =============================================================================
// POSITIONED ITEMS (Layout Engine Output)
// =============================================================================

/**
 * A canvas item with its computed position from a layout engine
 * This is what layout engines return.
 */
export interface PositionedCanvasItem {
  instanceId: CanvasInstanceId;
  position: CanvasPosition;
}

// =============================================================================
// HYDRATED CANVAS ITEMS (For Rendering)
// =============================================================================

/**
 * Song canvas item with full entity data attached
 * Used for rendering - combines instance + canonical data
 */
export interface HydratedSongCanvasItem extends SongCanvasItem {
  entity: Song;
}

/**
 * Label canvas item with full entity data attached
 */
export interface HydratedLabelCanvasItem extends LabelCanvasItem {
  entity: Label;
}

/**
 * Super label canvas item with full entity data attached
 */
export interface HydratedSuperLabelCanvasItem extends SuperLabelCanvasItem {
  entity: SuperLabel;
}

/**
 * Union type for hydrated canvas items
 */
export type HydratedCanvasItem = 
  | HydratedSongCanvasItem 
  | HydratedLabelCanvasItem 
  | HydratedSuperLabelCanvasItem;
