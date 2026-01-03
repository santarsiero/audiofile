/**
 * Tagging Routes
 *
 * Handles SongLabel join operations within a library.
 * Mounted under /api/libraries/:libraryId
 */

import express from 'express';
import {
  addLabelToSong,
  removeLabelFromSong,
  getSongLabels,
} from '../services/TaggingService.js';

import SongLabel from '../models/SongLabel.js';

const router = express.Router({ mergeParams: true });

/**
 * POST /api/libraries/:libraryId/songs/:songId/labels/:labelId
 * Add a label to a song (REGULAR only).
 *
 * - 201 if created
 * - 200 if already existed (idempotent)
 */
router.post('/songs/:songId/labels/:labelId', async (req, res) => {
  try {
    const { libraryId, songId, labelId } = req.params;

    const existing = await SongLabel.findOne({ libraryId, songId, labelId }).lean();
    if (existing) {
      return res.status(200).json({ songLabel: existing });
    }

    const songLabel = await addLabelToSong(libraryId, songId, labelId);
    return res.status(201).json({ songLabel });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Add label to song error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/libraries/:libraryId/songs/:songId/labels/:labelId
 * Remove a label from a song (idempotent).
 */
router.delete('/songs/:songId/labels/:labelId', async (req, res) => {
  try {
    const { libraryId, songId, labelId } = req.params;
    const result = await removeLabelFromSong(libraryId, songId, labelId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Remove label from song error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/libraries/:libraryId/songs/:songId/labels
 * Get SongLabel join rows for a song.
 */
router.get('/songs/:songId/labels', async (req, res) => {
  try {
    const { libraryId, songId } = req.params;
    const songLabels = await getSongLabels(libraryId, songId);
    return res.status(200).json({ songLabels });
  } catch (error) {
    console.error('Get song labels error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
