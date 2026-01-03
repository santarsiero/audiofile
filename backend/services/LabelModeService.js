/**
 * LabelModeService
 * 
 * Manages Label Modes and their label associations.
 * Label Modes are display configuration only - they control which labels
 * are shown in the UI for a given mode, but don't mutate songs or labels.
 */

import crypto from 'crypto';
import LabelMode from '../models/LabelMode.js';
import LabelModeLabel from '../models/LabelModeLabel.js';
import Label from '../models/Label.js';

/**
 * List all modes and their label joins for a library
 * 
 * @param {string} libraryId - The library ID
 * @returns {Promise<object>} Modes and mode labels
 */
export async function listModes(libraryId) {
  const [modes, modeLabels] = await Promise.all([
    LabelMode.find({ libraryId }).lean(),
    LabelModeLabel.find({ libraryId }).lean(),
  ]);

  return {
    modes,
    modeLabels,
  };
}

/**
 * Create a new label mode
 * 
 * @param {string} libraryId - The library ID
 * @param {object} payload - Mode data
 * @param {string} payload.name - Mode name (required)
 * @returns {Promise<object>} Created mode document
 * @throws {Error} 400 if name invalid, 409 if duplicate
 */
export async function createMode(libraryId, payload) {
  const { name } = payload;

  // Validate name
  if (!name || typeof name !== 'string' || !name.trim()) {
    const error = new Error('name is required and must be a non-empty string');
    error.status = 400;
    throw error;
  }

  const modeId = `mode_${crypto.randomUUID()}`;

  const modeData = {
    libraryId,
    modeId,
    name: name.trim(),
  };

  try {
    const mode = await LabelMode.create(modeData);
    return mode.toObject();
  } catch (error) {
    // Detect duplicate (libraryId, normName) unique constraint
    if (error.code === 11000) {
      const duplicateError = new Error('A mode with this name already exists in this library');
      duplicateError.status = 409;
      throw duplicateError;
    }
    throw error;
  }
}

/**
 * Get a mode by ID with its label joins
 * 
 * @param {string} libraryId - The library ID
 * @param {string} modeId - The mode ID
 * @returns {Promise<object>} Mode document with mode labels
 * @throws {Error} 404 if not found
 */
export async function getMode(libraryId, modeId) {
  const mode = await LabelMode.findOne({ libraryId, modeId }).lean();

  if (!mode) {
    const error = new Error('Mode not found in this library');
    error.status = 404;
    throw error;
  }

  const modeLabels = await LabelModeLabel.find({
    libraryId,
    modeId,
  }).lean();

  return {
    mode,
    modeLabels,
  };
}

/**
 * Attach a label to a mode (idempotent)
 * 
 * @param {string} libraryId - The library ID
 * @param {string} modeId - The mode ID
 * @param {string} labelId - The label ID (can be REGULAR or SUPER)
 * @returns {Promise<object>} Mode label join with created flag
 * @throws {Error} 404 if mode or label not found
 */
export async function attachLabel(libraryId, modeId, labelId) {
  // Validate mode exists
  const mode = await LabelMode.findOne({ libraryId, modeId }).lean();
  if (!mode) {
    const error = new Error('Mode not found in this library');
    error.status = 404;
    throw error;
  }

  // Validate label exists (can be REGULAR or SUPER)
  const label = await Label.findOne({ libraryId, labelId }).lean();
  if (!label) {
    const error = new Error('Label not found in this library');
    error.status = 404;
    throw error;
  }

  // Try to create the join
  try {
    const modeLabel = await LabelModeLabel.create({
      libraryId,
      modeId,
      labelId,
    });

    return {
      modeLabel: modeLabel.toObject(),
      created: true,
    };
  } catch (error) {
    // If duplicate (E11000), fetch and return existing join (idempotent)
    if (error.code === 11000) {
      const existingJoin = await LabelModeLabel.findOne({
        libraryId,
        modeId,
        labelId,
      }).lean();

      return {
        modeLabel: existingJoin,
        created: false,
      };
    }
    throw error;
  }
}

/**
 * Detach a label from a mode (idempotent)
 * 
 * @param {string} libraryId - The library ID
 * @param {string} modeId - The mode ID
 * @param {string} labelId - The label ID
 * @returns {Promise<object>} Deletion count
 */
export async function detachLabel(libraryId, modeId, labelId) {
  const result = await LabelModeLabel.deleteOne({
    libraryId,
    modeId,
    labelId,
  });

  return {
    deletedJoinCount: result.deletedCount || 0,
  };
}

/**
 * Delete a mode and cleanup its label joins
 * 
 * @param {string} libraryId - The library ID
 * @param {string} modeId - The mode ID
 * @returns {Promise<object>} Deletion summary with counts
 * @throws {Error} 404 if not found
 */
export async function deleteMode(libraryId, modeId) {
  // Verify mode exists
  const mode = await LabelMode.findOne({ libraryId, modeId }).lean();

  if (!mode) {
    const error = new Error('Mode not found in this library');
    error.status = 404;
    throw error;
  }

  // Delete associated label joins
  const modeLabelsResult = await LabelModeLabel.deleteMany({
    libraryId,
    modeId,
  });

  // Delete the mode itself
  await LabelMode.deleteOne({ libraryId, modeId });

  return {
    deletedModeId: modeId,
    deleted: {
      modeLabels: modeLabelsResult.deletedCount || 0,
    },
  };
}

export default {
  listModes,
  createMode,
  getMode,
  attachLabel,
  detachLabel,
  deleteMode,
};