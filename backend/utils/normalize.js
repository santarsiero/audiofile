/**
 * Normalization utilities for AudioFile MVP
 * 
 * Normalization rules (MVP):
 * - Lowercase
 * - Keep only a-z, 0-9, and underscores
 * - Convert spaces to underscores
 * - Remove all other characters (punctuation, diacritics, special chars)
 * - Collapse multiple consecutive underscores into one
 * - Trim leading/trailing underscores
 * 
 * Design: Modular for easy adjustment in future iterations
 */

/**
 * Core normalization: converts a string to normalized form
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
export function normalizeString(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }

  return str
    .toLowerCase()                    // Lowercase
    .replace(/\s+/g, '_')             // Spaces to underscores
    .replace(/[^a-z0-9_]/g, '')       // Remove everything except a-z, 0-9, _
    .replace(/_+/g, '_')              // Collapse multiple underscores
    .replace(/^_+|_+$/g, '');         // Trim underscores from edges
}

/**
 * Normalize a song title
 * @param {string} title - Song title to normalize
 * @returns {string} Normalized title
 */
export function normalizeTitle(title) {
  return normalizeString(title);
}

/**
 * Normalize an artist name
 * @param {string} artist - Artist name to normalize
 * @returns {string} Normalized artist
 */
export function normalizeArtist(artist) {
  return normalizeString(artist);
}

/**
 * Generate a normalized key for a song (normTitle + normArtist)
 * Used for duplicate detection
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @returns {string} Normalized key in format "normtitle_normartist"
 */
export function generateNormKey(title, artist) {
  const normTitle = normalizeTitle(title);
  const normArtist = normalizeArtist(artist);
  
  if (!normTitle && !normArtist) {
    return '';
  }
  
  if (!normTitle) {
    return normArtist;
  }
  
  if (!normArtist) {
    return normTitle;
  }
  
  return `${normTitle}_${normArtist}`;
}

/**
 * Normalize a label name
 * @param {string} name - Label name to normalize
 * @returns {string} Normalized label name
 */
export function normalizeLabelName(name) {
  return normalizeString(name);
}

/**
 * Normalize a mode name
 * @param {string} name - Mode name to normalize
 * @returns {string} Normalized mode name
 */
export function normalizeModeName(name) {
  return normalizeString(name);
}