/**
 * AudioFile Core Entity Types
 * 
 * These types represent the canonical backend entities.
 * Backend returns unordered data; frontend owns all layout and ordering.
 * 
 * ARCHITECTURAL RULE: These types are immutable references to backend state.
 * Visual instances are handled separately in canvas.ts.
 */

// =============================================================================
// IDENTIFIERS
// =============================================================================

/** Stable internal ID for users (not MongoDB _id) */
export type UserId = string;

/** Stable internal ID for libraries (not MongoDB _id) */
export type LibraryId = string;

/** Stable internal ID for songs (not MongoDB _id) */
export type SongId = string;

/** Stable internal ID for labels (not MongoDB _id) */
export type LabelId = string;

/** Stable internal ID for label modes (not MongoDB _id) */
export type LabelModeId = string;

/** External streaming service identifiers */
export type AppleMusicId = string;
export type SpotifyId = string;

// =============================================================================
// CORE ENTITIES
// =============================================================================

/**
 * User - Root owner entity
 * For MVP: data scaffolding only, no auth flows
 */
export interface User {
  userId: UserId;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Library - Data partition entity
 * All core entities belong to exactly one library.
 */
export interface Library {
  libraryId: LibraryId;
  ownerUserId: UserId;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Song - Canonical song entity
 * 
 * Display fields are user-editable (nickname capability).
 * Official fields come from streaming services (immutable once set).
 * Normalized fields are auto-generated for matching.
 */
export interface Song {
  songId: SongId;
  libraryId: LibraryId;
  
  // User-editable display fields
  displayTitle: string;
  displayArtist: string;
  
  // Immutable official fields (from streaming services, nullable for manual entries)
  officialTitle: string | null;
  officialArtist: string | null;
  
  // Auto-generated normalized fields for matching/deduplication
  normTitle: string;
  normArtist: string;
  normKey: string;
  
  // External identifiers (nullable - songs can exist without streaming links)
  appleMusicId: AppleMusicId | null;
  spotifyId: SpotifyId | null;
  
  // Optional metadata
  albumName: string | null;
  albumArtUrl: string | null;
  durationMs: number | null;
  releaseYear: number | null;
  
  // User-defined fields
  nickname: string | null;
  notes: string | null;
  
  // Soft delete support
  isDeleted: boolean;
  mergedIntoSongId: SongId | null;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Label type discriminator
 */
export type LabelType = 'REGULAR' | 'SUPER';

/**
 * Label - Base label entity (can be regular or super)
 */
export interface Label {
  labelId: LabelId;
  libraryId: LibraryId;
  name: string;
  normName: string;
  type: LabelType;
  color: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Regular Label - Atomic, user-defined tag
 */
export interface RegularLabel extends Label {
  type: 'REGULAR';
}

/**
 * Super Label - Composite label (contains regular labels only)
 * componentLabelIds are always regular labels (super labels are flattened)
 */
export interface SuperLabel extends Label {
  type: 'SUPER';
  componentLabelIds: LabelId[];
}

/**
 * Type guard for regular labels
 */
export function isRegularLabel(label: Label): label is RegularLabel {
  return label.type === 'REGULAR';
}

/**
 * Type guard for super labels
 */
export function isSuperLabel(label: Label): label is SuperLabel {
  return label.type === 'SUPER';
}

/**
 * SongLabel - Join table entry (song-label relationship)
 * Only stores regular label associations (super labels are calculated)
 */
export interface SongLabel {
  songId: SongId;
  labelId: LabelId;
  libraryId: LibraryId;
}

/**
 * LabelMode - User-defined configuration for which labels are visible
 * Used for speed and focus, not data manipulation.
 */
export interface LabelMode {
  modeId: LabelModeId;
  libraryId: LibraryId;
  name: string;
  labelIds: LabelId[];
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// COMPOSITE TYPES (Frontend convenience)
// =============================================================================

/**
 * Song with its attached labels (hydrated)
 * Used for display purposes; labels are derived from SongLabel relationships
 */
export interface SongWithLabels extends Song {
  labels: Label[];
  superLabels: SuperLabel[];
}

/**
 * Union type for any label (regular or super)
 */
export type AnyLabel = RegularLabel | SuperLabel;

// =============================================================================
// SYSTEM CONSTANTS
// =============================================================================

/**
 * The "All Songs" system label
 * Special non-deletable filter option that shows all songs
 */
export const ALL_SONGS_LABEL_ID = '__ALL_SONGS__' as LabelId;
