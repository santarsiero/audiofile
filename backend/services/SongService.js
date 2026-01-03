/**
 * SongService
 * 
 * Business logic layer for Song CRUD operations.
 * All operations are library-scoped.
 */

import crypto from 'crypto';
import Song from '../models/Song.js';
import SongLabel from '../models/SongLabel.js';
import SongSource from '../models/SongSource.js';

function makeId(prefix) {
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  return `${prefix}_${id}`;
}

/**
 * Create a new song in a library
 * 
 * @param {string} libraryId - The library ID
 * @param {object} payload - Song data (displayTitle, displayArtist required)
 * @returns {Promise<object>} Created song document
 * @throws {Error} 409 if duplicate (normKey conflict)
 */
export async function createSong(libraryId, payload) {
  const { displayTitle, displayArtist, ...metadata } = payload;

  // Validate required fields
  if (!displayTitle || typeof displayTitle !== 'string' || !displayTitle.trim()) {
    const error = new Error('displayTitle is required and must be a non-empty string');
    error.status = 400;
    throw error;
  }

  if (!displayArtist || typeof displayArtist !== 'string' || !displayArtist.trim()) {
    const error = new Error('displayArtist is required and must be a non-empty string');
    error.status = 400;
    throw error;
  }

  const songId = makeId('song');

  const songData = {
    libraryId,
    songId,
    displayTitle: displayTitle.trim(),
    displayArtist: displayArtist.trim(),
    metadata: metadata || {},
  };

  try {
    const song = await Song.create(songData);
    return song.toObject();
  } catch (error) {
    // Detect duplicate key error (E11000)
    if (error.code === 11000) {
      const duplicateError = new Error('A song with this title and artist already exists in this library');
      duplicateError.status = 409;
      throw duplicateError;
    }
    throw error;
  }
}

/**
 * Get all songs in a library
 * 
 * @param {string} libraryId - The library ID
 * @returns {Promise<array>} Array of song documents
 */
export async function getAllSongs(libraryId) {
  const songs = await Song.find({ libraryId }).lean();
  return songs;
}

/**
 * Get a single song by ID within a library
 * 
 * @param {string} libraryId - The library ID
 * @param {string} songId - The song ID
 * @returns {Promise<object>} Song document
 * @throws {Error} 404 if not found in library
 */
export async function getSongById(libraryId, songId) {
  const song = await Song.findOne({ libraryId, songId }).lean();

  if (!song) {
    const error = new Error('Song not found in this library');
    error.status = 404;
    throw error;
  }

  return song;
}

/**
 * Update a song (display fields only)
 * 
 * @param {string} libraryId - The library ID
 * @param {string} songId - The song ID
 * @param {object} patch - Fields to update (allow-list controlled)
 * @returns {Promise<object>} Updated song document
 * @throws {Error} 400 if unknown keys provided
 * @throws {Error} 404 if not found in library
 * @throws {Error} 409 if update causes duplicate
 */
export async function updateSong(libraryId, songId, patch) {
  // Allow-list: only these fields can be updated in this slice
  const allowedKeys = ['displayTitle', 'displayArtist'];
  const providedKeys = Object.keys(patch);

  // Check for unknown keys
  const unknownKeys = providedKeys.filter(key => !allowedKeys.includes(key));
  if (unknownKeys.length > 0) {
    const error = new Error(`Unknown fields: ${unknownKeys.join(', ')}. Allowed: ${allowedKeys.join(', ')}`);
    error.status = 400;
    throw error;
  }

  // Validate non-empty strings if provided
  if ('displayTitle' in patch) {
    if (typeof patch.displayTitle !== 'string' || !patch.displayTitle.trim()) {
      const error = new Error('displayTitle must be a non-empty string');
      error.status = 400;
      throw error;
    }
    patch.displayTitle = patch.displayTitle.trim();
  }

  if ('displayArtist' in patch) {
    if (typeof patch.displayArtist !== 'string' || !patch.displayArtist.trim()) {
      const error = new Error('displayArtist must be a non-empty string');
      error.status = 400;
      throw error;
    }
    patch.displayArtist = patch.displayArtist.trim();
  }

  try {
    const song = await Song.findOne({ libraryId, songId });

    if (!song) {
      const error = new Error('Song not found in this library');
      error.status = 404;
      throw error;
    }

    Object.assign(song, patch);
    await song.save();
    return song.toObject();
  } catch (error) {
    // Detect duplicate key error (E11000)
    if (error.code === 11000) {
      const duplicateError = new Error('Update would create a duplicate song in this library');
      duplicateError.status = 409;
      throw duplicateError;
    }
    throw error;
  }
}

/**
 * Delete a song and cleanup associated data
 * 
 * @param {string} libraryId - The library ID
 * @param {string} songId - The song ID
 * @returns {Promise<object>} Deletion summary with counts
 * @throws {Error} 404 if not found in library
 */
export async function deleteSong(libraryId, songId) {
  // First verify song exists
  const song = await Song.findOne({ libraryId, songId });

  if (!song) {
    const error = new Error('Song not found in this library');
    error.status = 404;
    throw error;
  }

  // Delete associated data
  const [songLabelsResult, songSourcesResult] = await Promise.all([
    SongLabel.deleteMany({ libraryId, songId }),
    SongSource.deleteMany({ libraryId, songId }),
  ]);

  // Delete the song itself
  await Song.deleteOne({ libraryId, songId });

  return {
    deletedSongId: songId,
    deleted: {
      songLabels: songLabelsResult.deletedCount || 0,
      songSources: songSourcesResult.deletedCount || 0,
    },
  };
}

export default {
  createSong,
  getAllSongs,
  getSongById,
  updateSong,
  deleteSong,
};