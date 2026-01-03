/**
 * LabelService
 * 
 * Business logic for Label CRUD operations.
 * Handles both REGULAR and SUPER labels.
 * 
 * Critical rule: SUPER labels NEVER appear in SongLabel.
 * SUPER labels are composite/macro labels that expand to their REGULAR components.
 */

import crypto from 'crypto';
import Label from '../models/Label.js';
import SongLabel from '../models/SongLabel.js';
import SuperLabelComponent from '../models/SuperLabelComponent.js';
import LabelModeLabel from '../models/LabelModeLabel.js';

/**
 * Get all labels in a library
 * 
 * @param {string} libraryId - The library ID
 * @param {object} options - Optional filters
 * @param {string} options.type - Optional type filter (REGULAR or SUPER)
 * @returns {Promise<array>} Array of label documents
 */
export async function getAllLabels(libraryId, options = {}) {
  const filter = { libraryId };
  
  if (options.type) {
    if (options.type !== 'REGULAR' && options.type !== 'SUPER') {
      const error = new Error('Invalid type filter. Must be REGULAR or SUPER');
      error.status = 400;
      throw error;
    }
    filter.type = options.type;
  }

  const labels = await Label.find(filter).lean();
  return labels;
}

/**
 * Create a REGULAR label
 * 
 * @param {string} libraryId - The library ID
 * @param {object} payload - Label data
 * @param {string} payload.name - Label name (required)
 * @returns {Promise<object>} Created label document
 * @throws {Error} 400 if name invalid, 409 if duplicate
 */
export async function createRegularLabel(libraryId, payload) {
  const { name } = payload;

  // Validate name
  if (!name || typeof name !== 'string' || !name.trim()) {
    const error = new Error('name is required and must be a non-empty string');
    error.status = 400;
    throw error;
  }

  const labelId = `label_${crypto.randomUUID()}`;

  const labelData = {
    libraryId,
    labelId,
    name: name.trim(),
    type: 'REGULAR',
  };

  try {
    const label = await Label.create(labelData);
    return label.toObject();
  } catch (error) {
    // Detect duplicate (libraryId, normName) unique constraint
    if (error.code === 11000) {
      const duplicateError = new Error('A label with this name already exists in this library');
      duplicateError.status = 409;
      throw duplicateError;
    }
    throw error;
  }
}

/**
 * Create a SUPER label with components
 * 
 * @param {string} libraryId - The library ID
 * @param {object} payload - Super label data
 * @param {string} payload.name - Label name (required)
 * @param {array} payload.componentLabelIds - Array of REGULAR label IDs (required, non-empty)
 * @returns {Promise<object>} Created super label and components
 * @throws {Error} 400 if validation fails, 409 if duplicate
 */
export async function createSuperLabel(libraryId, payload) {
  const { name, componentLabelIds } = payload;

  // Validate name
  if (!name || typeof name !== 'string' || !name.trim()) {
    const error = new Error('name is required and must be a non-empty string');
    error.status = 400;
    throw error;
  }

  // Validate componentLabelIds
  if (!Array.isArray(componentLabelIds) || componentLabelIds.length === 0) {
    const error = new Error('componentLabelIds must be a non-empty array');
    error.status = 400;
    throw error;
  }

  // Dedupe component IDs
  const uniqueComponentIds = [...new Set(componentLabelIds)];

  // Verify all components exist and are REGULAR labels in this library
  const components = await Label.find({
    libraryId,
    labelId: { $in: uniqueComponentIds },
  }).lean();

  if (components.length !== uniqueComponentIds.length) {
    const error = new Error('One or more component labels not found in this library');
    error.status = 400;
    throw error;
  }

  // Verify ALL are REGULAR (none are SUPER)
  const superComponents = components.filter(c => c.type === 'SUPER');
  if (superComponents.length > 0) {
    const error = new Error('Cannot use SUPER labels as components. Only REGULAR labels allowed.');
    error.status = 400;
    throw error;
  }

  const labelId = `label_${crypto.randomUUID()}`;

  const labelData = {
    libraryId,
    labelId,
    name: name.trim(),
    type: 'SUPER',
  };

  try {
    // Create the SUPER label
    const label = await Label.create(labelData);

    // Create component mappings
    const componentDocs = uniqueComponentIds.map(regularLabelId => ({
      libraryId,
      superLabelId: label.labelId,
      regularLabelId,
    }));

    const createdComponents = await SuperLabelComponent.insertMany(componentDocs);

    return {
      label: label.toObject(),
      components: createdComponents.map(c => c.toObject()),
    };
  } catch (error) {
    // Detect duplicate (libraryId, normName) unique constraint
    if (error.code === 11000) {
      const duplicateError = new Error('A label with this name already exists in this library');
      duplicateError.status = 409;
      throw duplicateError;
    }
    throw error;
  }
}

/**
 * Get a label by ID with its components (if SUPER)
 * 
 * @param {string} libraryId - The library ID
 * @param {string} labelId - The label ID
 * @returns {Promise<object>} Label document with components array
 * @throws {Error} 404 if not found
 */
export async function getLabelById(libraryId, labelId) {
  const label = await Label.findOne({ libraryId, labelId }).lean();

  if (!label) {
    const error = new Error('Label not found in this library');
    error.status = 404;
    throw error;
  }

  // If REGULAR, components is empty
  if (label.type === 'REGULAR') {
    return {
      label,
      components: [],
    };
  }

  // If SUPER, fetch components
  const components = await SuperLabelComponent.find({
    libraryId,
    superLabelId: labelId,
  }).lean();

  return {
    label,
    components,
  };
}

/**
 * Replace SUPER label components
 * 
 * @param {string} libraryId - The library ID
 * @param {string} superLabelId - The SUPER label ID
 * @param {array} componentLabelIds - New array of REGULAR label IDs
 * @returns {Promise<object>} Updated components
 * @throws {Error} 400 if label is not SUPER or validation fails, 404 if not found
 */
export async function replaceSuperComponents(libraryId, superLabelId, componentLabelIds) {
  // Verify label exists and is SUPER
  const label = await Label.findOne({ libraryId, labelId: superLabelId }).lean();

  if (!label) {
    const error = new Error('Label not found in this library');
    error.status = 404;
    throw error;
  }

  if (label.type !== 'SUPER') {
    const error = new Error('Can only update components for SUPER labels');
    error.status = 400;
    throw error;
  }

  // Validate componentLabelIds
  if (!Array.isArray(componentLabelIds) || componentLabelIds.length === 0) {
    const error = new Error('componentLabelIds must be a non-empty array');
    error.status = 400;
    throw error;
  }

  // Dedupe component IDs
  const uniqueComponentIds = [...new Set(componentLabelIds)];

  // Verify all components exist and are REGULAR labels in this library
  const components = await Label.find({
    libraryId,
    labelId: { $in: uniqueComponentIds },
  }).lean();

  if (components.length !== uniqueComponentIds.length) {
    const error = new Error('One or more component labels not found in this library');
    error.status = 400;
    throw error;
  }

  // Verify ALL are REGULAR (none are SUPER)
  const superComponents = components.filter(c => c.type === 'SUPER');
  if (superComponents.length > 0) {
    const error = new Error('Cannot use SUPER labels as components. Only REGULAR labels allowed.');
    error.status = 400;
    throw error;
  }

  // Delete existing components
  await SuperLabelComponent.deleteMany({
    libraryId,
    superLabelId,
  });

  // Create new component mappings
  const componentDocs = uniqueComponentIds.map(regularLabelId => ({
    libraryId,
    superLabelId,
    regularLabelId,
  }));

  const createdComponents = await SuperLabelComponent.insertMany(componentDocs);

  return {
    labelId: superLabelId,
    components: createdComponents.map(c => c.toObject()),
  };
}

/**
 * Delete a label and cleanup associated data
 * 
 * @param {string} libraryId - The library ID
 * @param {string} labelId - The label ID
 * @returns {Promise<object>} Deletion summary with counts
 * @throws {Error} 404 if not found
 */
export async function deleteLabel(libraryId, labelId) {
  // Verify label exists
  const label = await Label.findOne({ libraryId, labelId }).lean();

  if (!label) {
    const error = new Error('Label not found in this library');
    error.status = 404;
    throw error;
  }

  let songLabelsCount = 0;
  let superLabelComponentsCount = 0;

  if (label.type === 'REGULAR') {
    // Delete SongLabel rows where this label is used
    const songLabelsResult = await SongLabel.deleteMany({
      libraryId,
      labelId,
    });
    songLabelsCount = songLabelsResult.deletedCount || 0;

    // Delete SuperLabelComponent rows where this appears as a component
    const componentsResult = await SuperLabelComponent.deleteMany({
      libraryId,
      regularLabelId: labelId,
    });
    superLabelComponentsCount = componentsResult.deletedCount || 0;
  } else {
    // SUPER label: delete its component mappings
    const componentsResult = await SuperLabelComponent.deleteMany({
      libraryId,
      superLabelId: labelId,
    });
    superLabelComponentsCount = componentsResult.deletedCount || 0;
  }

  // Delete LabelModeLabel rows
  const labelModeLabelsResult = await LabelModeLabel.deleteMany({
    libraryId,
    labelId,
  });
  const labelModeLabelsCount = labelModeLabelsResult.deletedCount || 0;

  // Delete the label itself
  await Label.deleteOne({ libraryId, labelId });

  return {
    deletedLabelId: labelId,
    deleted: {
      songLabels: songLabelsCount,
      superLabelComponents: superLabelComponentsCount,
      labelModeLabels: labelModeLabelsCount,
    },
  };
}

export default {
  getAllLabels,
  createRegularLabel,
  createSuperLabel,
  getLabelById,
  replaceSuperComponents,
  deleteLabel,
};