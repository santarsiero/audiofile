/**
 * AudioFile API Types
 * 
 * Defines the shape of API requests and responses.
 * 
 * ARCHITECTURAL RULE: Backend returns unordered canonical data.
 * Frontend must not assume any ordering from these responses.
 */

import type { 
  Song, 
  Label, 
  SuperLabel, 
  LabelMode, 
  Library,
  SongId,
  LabelId,
  SongLabel,
} from './entities';

// =============================================================================
// GENERIC API RESPONSE WRAPPER
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiError;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version?: string;
}

// =============================================================================
// LIBRARY BOOTSTRAP
// =============================================================================

/**
 * Bootstrap response - initial data load for a library
 * Returns all data needed to initialize the frontend state
 */
export interface LibraryBootstrapResponse {
  library: Library;
  songs: Song[];
  labels: Label[];
  superLabels: SuperLabel[];
  songLabels: SongLabel[];
  labelModes: LabelMode[];
}

// =============================================================================
// SONG API
// =============================================================================

/** GET /songs response */
export interface GetSongsResponse {
  songs: Song[];
}

/** POST /songs request */
export interface CreateSongRequest {
  displayTitle: string;
  displayArtist: string;
  officialTitle?: string | null;
  officialArtist?: string | null;
  appleMusicId?: string | null;
  spotifyId?: string | null;
  albumName?: string | null;
  albumArtUrl?: string | null;
  durationMs?: number | null;
  releaseYear?: number | null;
  nickname?: string | null;
  notes?: string | null;
}

/** POST /songs response */
export interface CreateSongResponse {
  song: Song;
}

/** PUT /songs/:id request */
export interface UpdateSongRequest {
  displayTitle?: string;
  displayArtist?: string;
  nickname?: string | null;
  notes?: string | null;
  appleMusicId?: string | null;
  spotifyId?: string | null;
}

/** PUT /songs/:id response */
export interface UpdateSongResponse {
  song: Song;
}

/** DELETE /songs/:id response */
export interface DeleteSongResponse {
  success: boolean;
  deletedSongId: SongId;
}

// =============================================================================
// LABEL API
// =============================================================================

/** GET /labels response */
export interface GetLabelsResponse {
  labels: Label[];
  superLabels: SuperLabel[];
}

/** POST /labels request (regular label) */
export interface CreateLabelRequest {
  name: string;
  color?: string | null;
  notes?: string | null;
}

/** POST /labels response */
export interface CreateLabelResponse {
  label: Label;
}

/** POST /labels/super request */
export interface CreateSuperLabelRequest {
  name: string;
  componentLabelIds: LabelId[];
  color?: string | null;
  notes?: string | null;
}

/** POST /labels/super response */
export interface CreateSuperLabelResponse {
  superLabel: SuperLabel;
}

/** DELETE /labels/:id response */
export interface DeleteLabelResponse {
  success: boolean;
  deletedLabelId: LabelId;
}

// =============================================================================
// TAGGING API
// =============================================================================

/** POST /songs/:songId/labels request */
export interface AddLabelToSongRequest {
  labelId: LabelId;
}

/** POST /songs/:songId/labels response */
export interface AddLabelToSongResponse {
  songLabel: SongLabel;
}

/** DELETE /songs/:songId/labels/:labelId response */
export interface RemoveLabelFromSongResponse {
  success: boolean;
  songId: SongId;
  labelId: LabelId;
}

/** GET /songs/:songId/labels response */
export interface GetSongLabelsResponse {
  labels: Label[];
  superLabels: SuperLabel[];
}

// =============================================================================
// FILTER API
// =============================================================================

/** POST /songs/filter request */
export interface FilterSongsRequest {
  labelIds: LabelId[];
  mode: 'AND' | 'OR';
}

/** POST /songs/filter response */
export interface FilterSongsResponse {
  songs: Song[];
}

// =============================================================================
// DUPLICATE API
// =============================================================================

/** Duplicate group structure */
export interface DuplicateGroup {
  normKey: string;
  songs: Song[];
}

/** GET /duplicates response */
export interface GetDuplicatesResponse {
  groups: DuplicateGroup[];
}

// =============================================================================
// MERGE API
// =============================================================================

/** POST /merge request */
export interface MergeSongsRequest {
  primarySongId: SongId;
  duplicateSongIds: SongId[];
}

/** POST /merge/preview response */
export interface MergePreviewResponse {
  primarySong: Song;
  duplicates: Song[];
  mergedLabels: Label[];
}

/** POST /merge response */
export interface MergeSongsResponse {
  mergedSong: Song;
  deletedSongIds: SongId[];
}

// =============================================================================
// LABEL MODE API
// =============================================================================

/** GET /modes response */
export interface GetLabelModesResponse {
  modes: LabelMode[];
}

/** POST /modes request */
export interface CreateLabelModeRequest {
  name: string;
  labelIds: LabelId[];
}

/** POST /modes response */
export interface CreateLabelModeResponse {
  mode: LabelMode;
}

/** PUT /modes/:id request */
export interface UpdateLabelModeRequest {
  name?: string;
  labelIds?: LabelId[];
}

/** PUT /modes/:id response */
export interface UpdateLabelModeResponse {
  mode: LabelMode;
}
