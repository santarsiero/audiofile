/**
 * AudioFile Normalization Utilities
 * 
 * Pure functions for normalizing text for matching and deduplication.
 * These mirror the backend normalization logic to ensure consistency.
 * 
 * ARCHITECTURAL RULE: These are pure functions with no side effects.
 */

/**
 * Normalize a title for matching
 * - Lowercase
 * - Trim whitespace
 * - Remove punctuation
 * - Collapse multiple spaces
 * - Remove common prefixes/suffixes (feat., remix, etc.) - optional
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Remove punctuation except spaces
    .replace(/[^\w\s]/g, '')
    // Collapse multiple spaces to single
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize an artist name for matching
 * - Lowercase
 * - Trim whitespace
 * - Remove punctuation
 * - Collapse multiple spaces
 */
export function normalizeArtist(artist: string): string {
  return artist
    .toLowerCase()
    .trim()
    // Remove punctuation except spaces
    .replace(/[^\w\s]/g, '')
    // Collapse multiple spaces to single
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate a normalized key for duplicate detection
 * Combines normalized title and artist into a single key
 */
export function generateNormKey(title: string, artist: string): string {
  const normTitle = normalizeTitle(title);
  const normArtist = normalizeArtist(artist);
  return `${normTitle}::${normArtist}`;
}

/**
 * Normalize a label name
 * - Lowercase
 * - Trim whitespace
 * - Remove leading/trailing punctuation
 */
export function normalizeLabelName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove leading/trailing non-alphanumeric (keep internal punctuation)
    .replace(/^[^\w]+|[^\w]+$/g, '');
}

/**
 * Check if two strings are equivalent after normalization
 */
export function areNormalizedEqual(a: string, b: string): boolean {
  return normalizeTitle(a) === normalizeTitle(b);
}

/**
 * Generate a display-safe string (for sorting, searching)
 * Less aggressive than normalization - preserves case sensitivity optionally
 */
export function toSearchableString(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Keep alphanumeric and spaces only
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
