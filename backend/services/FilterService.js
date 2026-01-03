/**
 * FilterService
 * 
 * Implements AND-based song filtering using label selections.
 * SUPER labels are expanded to their REGULAR components.
 * 
 * AND logic: returns songs that have ALL required labels.
 */

import Song from '../models/Song.js';
import Label from '../models/Label.js';
import SongLabel from '../models/SongLabel.js';
import SuperLabelComponent from '../models/SuperLabelComponent.js';

/**
 * Filter songs by labels (AND logic)
 * 
 * @param {string} libraryId - The library ID
 * @param {array} labelIds - Array of label IDs (can be REGULAR or SUPER)
 * @returns {Promise<object>} Filter result with metadata and songs
 * @throws {Error} 404 if label not found, 400 if SUPER has no components
 */
export async function filterSongsByLabels(libraryId, labelIds = []) {
  const inputLabelIds = labelIds || [];

  // If no labels provided, return all songs
  if (inputLabelIds.length === 0) {
    const songs = await Song.find({ libraryId }).lean();
    return {
      inputLabelIds: [],
      requiredRegularLabelIds: [],
      songs,
    };
  }

  // Validate all labels exist in this library
  const labels = await Label.find({
    libraryId,
    labelId: { $in: inputLabelIds },
  }).lean();

  if (labels.length !== inputLabelIds.length) {
    const error = new Error('One or more labels not found in this library');
    error.status = 404;
    throw error;
  }

  // Expand SUPER labels to REGULAR components
  const requiredRegularLabelIds = new Set();

  for (const label of labels) {
    if (label.type === 'REGULAR') {
      // Add REGULAR label directly
      requiredRegularLabelIds.add(label.labelId);
    } else if (label.type === 'SUPER') {
      // Expand SUPER label to its components
      const components = await SuperLabelComponent.find({
        libraryId,
        superLabelId: label.labelId,
      }).lean();

      if (components.length === 0) {
        const error = new Error(`SUPER label "${label.name}" has no components`);
        error.status = 400;
        throw error;
      }

      // Add each component REGULAR label
      for (const component of components) {
        requiredRegularLabelIds.add(component.regularLabelId);
      }
    }
  }

  // Convert Set to Array
  const requiredRegularLabelIdsArray = Array.from(requiredRegularLabelIds);

  // If no REGULAR labels after expansion (shouldn't happen but handle it)
  if (requiredRegularLabelIdsArray.length === 0) {
    const songs = await Song.find({ libraryId }).lean();
    return {
      inputLabelIds,
      requiredRegularLabelIds: [],
      songs,
    };
  }

  // AND filtering: find songs that have ALL required labels
  // Use aggregation on SongLabel to find matching songs
  const matchingSongIds = await SongLabel.aggregate([
    // Match SongLabel rows for this library and required labels
    {
      $match: {
        libraryId,
        labelId: { $in: requiredRegularLabelIdsArray },
      },
    },
    // Group by songId and count unique labels
    {
      $group: {
        _id: '$songId',
        labelCount: { $sum: 1 },
      },
    },
    // Keep only songs that have ALL required labels
    {
      $match: {
        labelCount: requiredRegularLabelIdsArray.length,
      },
    },
    // Project just the songId
    {
      $project: {
        _id: 0,
        songId: '$_id',
      },
    },
  ]);

  // Extract songIds from aggregation result
  const songIds = matchingSongIds.map(doc => doc.songId);

  // Fetch the actual Song documents
  const songs = await Song.find({
    libraryId,
    songId: { $in: songIds },
  }).lean();

  return {
    inputLabelIds,
    requiredRegularLabelIds: requiredRegularLabelIdsArray,
    songs,
  };
}

export default {
  filterSongsByLabels,
};