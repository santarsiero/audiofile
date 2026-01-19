/**
 * AudioFile Validation Utilities
 * 
 * Pure validation functions for user input and data integrity.
 * 
 * ARCHITECTURAL RULE: These are pure functions with no side effects.
 */

import type { LabelId } from '@/types/entities';
import { normalizeLabelName } from './normalize';

// =============================================================================
// LABEL VALIDATION
// =============================================================================

/**
 * Minimum label name length
 */
export const MIN_LABEL_NAME_LENGTH = 1;

/**
 * Maximum label name length
 */
export const MAX_LABEL_NAME_LENGTH = 50;

/**
 * Validate a label name
 * Returns null if valid, error message if invalid
 */
export function validateLabelName(name: string): string | null {
  const trimmed = name.trim();
  
  if (trimmed.length < MIN_LABEL_NAME_LENGTH) {
    return 'Label name is required';
  }
  
  if (trimmed.length > MAX_LABEL_NAME_LENGTH) {
    return `Label name must be ${MAX_LABEL_NAME_LENGTH} characters or less`;
  }
  
  // Check for invalid characters (allow letters, numbers, spaces, common punctuation)
  const validPattern = /^[\w\s\-_&'"]+$/;
  if (!validPattern.test(trimmed)) {
    return 'Label name contains invalid characters';
  }
  
  return null;
}

/**
 * Check if a label name is unique within a list of existing labels
 * Comparison is case-insensitive using normalized names
 */
export function isLabelNameUnique(
  name: string,
  existingNames: string[]
): boolean {
  const normalizedNew = normalizeLabelName(name);
  return !existingNames.some(
    (existing) => normalizeLabelName(existing) === normalizedNew
  );
}

// =============================================================================
// SONG VALIDATION
// =============================================================================

/**
 * Maximum title length
 */
export const MAX_TITLE_LENGTH = 200;

/**
 * Maximum artist length
 */
export const MAX_ARTIST_LENGTH = 200;

/**
 * Maximum notes length
 */
export const MAX_NOTES_LENGTH = 2000;

/**
 * Validate a song title
 * Returns null if valid, error message if invalid
 */
export function validateSongTitle(title: string): string | null {
  const trimmed = title.trim();
  
  if (trimmed.length === 0) {
    return 'Song title is required';
  }
  
  if (trimmed.length > MAX_TITLE_LENGTH) {
    return `Song title must be ${MAX_TITLE_LENGTH} characters or less`;
  }
  
  return null;
}

/**
 * Validate a song artist
 * Returns null if valid, error message if invalid
 */
export function validateSongArtist(artist: string): string | null {
  const trimmed = artist.trim();
  
  if (trimmed.length === 0) {
    return 'Artist name is required';
  }
  
  if (trimmed.length > MAX_ARTIST_LENGTH) {
    return `Artist name must be ${MAX_ARTIST_LENGTH} characters or less`;
  }
  
  return null;
}

/**
 * Validate song notes
 * Returns null if valid, error message if invalid
 */
export function validateNotes(notes: string): string | null {
  if (notes.length > MAX_NOTES_LENGTH) {
    return `Notes must be ${MAX_NOTES_LENGTH} characters or less`;
  }
  
  return null;
}

// =============================================================================
// SUPER LABEL VALIDATION
// =============================================================================

/**
 * Minimum number of labels in a super label
 */
export const MIN_SUPER_LABEL_COMPONENTS = 2;

/**
 * Validate super label component selection
 * Returns null if valid, error message if invalid
 */
export function validateSuperLabelComponents(
  labelIds: LabelId[]
): string | null {
  if (labelIds.length < MIN_SUPER_LABEL_COMPONENTS) {
    return `Super labels must contain at least ${MIN_SUPER_LABEL_COMPONENTS} labels`;
  }
  
  // Check for duplicates
  const uniqueIds = new Set(labelIds);
  if (uniqueIds.size !== labelIds.length) {
    return 'Super label cannot contain duplicate labels';
  }
  
  return null;
}

/**
 * Check if a super label with the same component set already exists
 * Returns true if duplicate, false if unique
 */
export function isDuplicateSuperLabel(
  newLabelIds: LabelId[],
  existingSuperLabels: { componentLabelIds: LabelId[] }[]
): boolean {
  const newSet = new Set(newLabelIds);
  
  return existingSuperLabels.some((existing) => {
    if (existing.componentLabelIds.length !== newLabelIds.length) {
      return false;
    }
    return existing.componentLabelIds.every((id) => newSet.has(id));
  });
}

// =============================================================================
// COLOR VALIDATION
// =============================================================================

/**
 * Validate a hex color string
 * Returns null if valid, error message if invalid
 */
export function validateHexColor(color: string): string | null {
  if (!color) return null; // Color is optional
  
  const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  if (!hexPattern.test(color)) {
    return 'Invalid color format. Use hex format (e.g., #FF5500)';
  }
  
  return null;
}

// =============================================================================
// LABEL MODE VALIDATION
// =============================================================================

/**
 * Maximum label mode name length
 */
export const MAX_MODE_NAME_LENGTH = 50;

/**
 * Validate a label mode name
 * Returns null if valid, error message if invalid
 */
export function validateModeName(name: string): string | null {
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return 'Mode name is required';
  }
  
  if (trimmed.length > MAX_MODE_NAME_LENGTH) {
    return `Mode name must be ${MAX_MODE_NAME_LENGTH} characters or less`;
  }
  
  return null;
}
