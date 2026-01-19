/**
 * AudioFile View State Types
 * 
 * Types for frontend-only state (filters, settings, selection, etc.)
 * This is the VIEW STATE LAYER in the Architecture Contract.
 * 
 * ARCHITECTURAL RULE: View state is separate from data state (entities)
 * and layout state (computed positions).
 */

import type { LabelId, LabelModeId } from './entities';

// =============================================================================
// SETTINGS
// =============================================================================

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Primary streaming source
 */
export type StreamingSource = 'apple-music' | 'spotify';

/**
 * Click behavior mode
 */
export type ClickBehavior = 'single-click' | 'double-click';

/**
 * Search scope
 */
export type SearchScope = 'library-only' | 'library-and-external';

/**
 * Filter logic mode
 */
export type FilterMode = 'AND' | 'OR';

/**
 * User settings (persisted per-library)
 */
export interface Settings {
  /** Light or dark theme */
  theme: ThemeMode;
  
  /** Apple Music or Spotify as primary source */
  streamingSource: StreamingSource;
  
  /** Whether dual linking (both streaming IDs) is allowed */
  allowDualLinking: boolean;
  
  /** AND or OR filter logic */
  filterMode: FilterMode;
  
  /** Single or double click to open info */
  clickBehavior: ClickBehavior;
  
  /** Library only or include external search */
  searchScope: SearchScope;
  
  /** Whether undo/copy/paste is enabled */
  enableUndoCopyPaste: boolean;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  streamingSource: 'apple-music',
  allowDualLinking: true,
  filterMode: 'AND',
  clickBehavior: 'double-click',
  searchScope: 'library-only',
  enableUndoCopyPaste: true,
};

// =============================================================================
// FILTER STATE
// =============================================================================

/**
 * Active filter state
 */
export interface FilterState {
  /** Currently active label IDs (used for filtering) */
  activeLabelIds: LabelId[];
  
  /** Whether "All Songs" is active (special system filter) */
  allSongsActive: boolean;
}

/**
 * Default filter state (all songs shown)
 */
export const DEFAULT_FILTER_STATE: FilterState = {
  activeLabelIds: [],
  allSongsActive: true,
};

// =============================================================================
// LABEL MODE STATE
// =============================================================================

/**
 * Current label display mode state
 */
export interface LabelModeState {
  /** Currently selected mode ID (null = show all labels) */
  activeModeId: LabelModeId | null;
}

/**
 * Default label mode state (no mode selected = show all)
 */
export const DEFAULT_LABEL_MODE_STATE: LabelModeState = {
  activeModeId: null,
};

// =============================================================================
// SELECTION STATE
// =============================================================================

/**
 * Currently selected items on canvas
 */
export interface SelectionState {
  /** Selected canvas instance IDs */
  selectedInstanceIds: string[];
}

/**
 * Default selection state (nothing selected)
 */
export const DEFAULT_SELECTION_STATE: SelectionState = {
  selectedInstanceIds: [],
};

// =============================================================================
// PANEL STATE
// =============================================================================

/**
 * Panel identifiers
 */
export type PanelId = 'left' | 'right';

/**
 * Content type that can be shown in panels
 */
export type PanelContentType = 
  | 'song-list'
  | 'label-list'
  | 'search-results'
  | 'song-info'
  | 'label-info'
  | 'superlabel-info'
  | 'add-song'
  | 'add-label'
  | 'add-superlabel'
  | null;

/**
 * State of a single panel
 */
export interface PanelState {
  isOpen: boolean;
  contentType: PanelContentType;
  /** ID of entity being viewed (for info panels) */
  entityId: string | null;
}

/**
 * State of all panels
 */
export interface PanelsState {
  left: PanelState;
  right: PanelState;
}

/**
 * Default panels state (both closed)
 */
export const DEFAULT_PANELS_STATE: PanelsState = {
  left: { isOpen: false, contentType: null, entityId: null },
  right: { isOpen: false, contentType: null, entityId: null },
};

// =============================================================================
// SEARCH STATE
// =============================================================================

/**
 * Search mode
 */
export type SearchMode = 'songs' | 'labels' | 'mixed';

/**
 * Search state
 */
export interface SearchState {
  /** Current search query */
  query: string;
  
  /** Current search mode */
  mode: SearchMode;
  
  /** Whether search is active */
  isActive: boolean;
}

/**
 * Default search state
 */
export const DEFAULT_SEARCH_STATE: SearchState = {
  query: '',
  mode: 'mixed',
  isActive: false,
};

// =============================================================================
// UNDO STATE
// =============================================================================

/**
 * Types of actions that can be undone
 */
export type UndoableActionType =
  | 'canvas-move'
  | 'canvas-add'
  | 'canvas-remove'
  | 'label-apply'
  | 'label-remove'
  | 'filter-change';

/**
 * Base undoable action structure
 */
export interface UndoableAction {
  type: UndoableActionType;
  timestamp: number;
  /** State needed to reverse the action */
  reverseState: unknown;
}

/**
 * Undo stack state
 */
export interface UndoState {
  /** Stack of undoable actions (most recent last) */
  stack: UndoableAction[];
  
  /** Maximum stack size */
  maxSize: number;
}

/**
 * Default undo state
 */
export const DEFAULT_UNDO_STATE: UndoState = {
  stack: [],
  maxSize: 100,
};
