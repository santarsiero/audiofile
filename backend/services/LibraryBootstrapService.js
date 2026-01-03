/**
 * LibraryBootstrapService
 * 
 * Handles the "Enter Library" operation - fetches all library-scoped data
 * needed to bootstrap the application frontend.
 * 
 * This is the primary data loading endpoint for the app.
 */

import Library from '../models/Library.js';
import Song from '../models/Song.js';
import Label from '../models/Label.js';
import SongLabel from '../models/SongLabel.js';
import SuperLabelComponent from '../models/SuperLabelComponent.js';
import LabelMode from '../models/LabelMode.js';
import LabelModeLabel from '../models/LabelModeLabel.js';

/**
 * Get all data needed to bootstrap a library
 * 
 * @param {string} libraryId - The library ID to bootstrap
 * @returns {Promise<Object>} Bootstrap data object
 * @throws {Error} If library not found (error.status = 404)
 */
export async function getBootstrap(libraryId) {
  // Step 1: Verify library exists
  const library = await Library.findOne({ libraryId }).lean();
  
  if (!library) {
    const error = new Error('Library not found');
    error.status = 404;
    throw error;
  }

  // Step 2: Fetch all library-scoped data in parallel
  const [
    songs,
    labels,
    songLabels,
    superLabelComponents,
    labelModes,
    labelModeLabels,
  ] = await Promise.all([
    Song.find({ libraryId }).lean(),
    Label.find({ libraryId }).lean(),
    SongLabel.find({ libraryId }).lean(),
    SuperLabelComponent.find({ libraryId }).lean(),
    LabelMode.find({ libraryId }).lean(),
    LabelModeLabel.find({ libraryId }).lean(),
  ]);

  // Step 3: Return bootstrap object
  return {
    library,
    songs,
    labels,
    songLabels,
    superLabelComponents,
    labelModes,
    labelModeLabels,
  };
}

export default {
  getBootstrap,
};