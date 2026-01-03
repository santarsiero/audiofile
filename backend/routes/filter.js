/**
 * Filter Routes
 * 
 * Handles AND-based song filtering by labels.
 * Mounted under /api/libraries/:libraryId
 */

import express from 'express';
import { filterSongsByLabels } from '../services/FilterService.js';

const router = express.Router({ mergeParams: true });

/**
 * POST /api/libraries/:libraryId/songs/filter
 * Filter songs by labels (AND logic)
 */
router.post('/songs/filter', async (req, res) => {
  try {
    const { libraryId } = req.params;
    const { labelIds } = req.body;

    const result = await filterSongsByLabels(libraryId, labelIds);
    res.status(200).json(result);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Filter songs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;