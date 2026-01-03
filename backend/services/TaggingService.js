/**
 * TaggingService
 * 
 * Handles attaching and detaching labels to/from songs via SongLabel join table.
 * 
 * Critical rule: Only REGULAR labels can be attached to songs.
 * SUPER labels are rejected with 400 error.
 */

import Song from '../models/Song.js';
import Label from '../models/Label.js';
import SongLabel from '../models/SongLabel.js';

/**
 * Add a REGULAR label to a song
 * 
 * @param {string} libraryId - The library ID
 * @param {string} songId - The song ID
 * @param {string} labelId - The label ID (must be REGULAR)
 * @returns {Promise<object>} Created or existing SongLabel document
 * @throws {Error} 404 if song or label not found, 400 if label is SUPER
 */
export async function addLabelToSong(libraryId, songId, labelId) {
  // Validate song exists
  const song = await Song.findOne({ libraryId, songId }).lean();
  if (!song) {
    const error = new Error('Song not found in this library');
    error.status = 404;
    throw error;
  }

  // Validate label exists
  const label = await Label.findOne({ libraryId, labelId }).lean();
  if (!label) {
    const error = new Error('Label not found in this library');
    error.status = 404;
    throw error;
  }

  // Enforce REGULAR-only rule
  if (label.type !== 'REGULAR') {
    const error = new Error('Cannot attach SUPER labels to songs. Only REGULAR labels are allowed.');
    error.status = 400;
    throw error;
  }

  // Try to create the join
  try {
    const songLabel = await SongLabel.create({
      libraryId,
      songId,
      labelId,
    });

    return songLabel.toObject();
  } catch (error) {
    // If duplicate (E11000), fetch and return existing join (idempotent)
    if (error.code === 11000) {
      const existingJoin = await SongLabel.findOne({
        libraryId,
        songId,
        labelId,
      }).lean();

      return existingJoin;
    }
    throw error;
  }
}

/**
 * Remove a label from a song
 * 
 * @param {string} libraryId - The library ID
 * @param {string} songId - The song ID
 * @param {string} labelId - The label ID
 * @returns {Promise<object>} Deletion result with count
 */
export async function removeLabelFromSong(libraryId, songId, labelId) {
  const result = await SongLabel.deleteOne({
    libraryId,
    songId,
    labelId,
  });

  return {
    deleted: true,
    deletedJoinCount: result.deletedCount || 0,
  };
}

/**
 * Get all labels attached to a song (raw join rows)
 * 
 * @param {string} libraryId - The library ID
 * @param {string} songId - The song ID
 * @returns {Promise<array>} Array of SongLabel documents
 */
export async function getSongLabels(libraryId, songId) {
  const songLabels = await SongLabel.find({
    libraryId,
    songId,
  }).lean();

  return songLabels;
}

export default {
  addLabelToSong,
  removeLabelFromSong,
  getSongLabels,
};