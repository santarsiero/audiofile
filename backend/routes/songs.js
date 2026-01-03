/**
 * Songs Routes
 * 
 * Handles song CRUD operations within a library.
 * Mounted at /api/libraries/:libraryId/songs
 */

import express from 'express';
import {
  createSong,
  getAllSongs,
  getSongById,
  updateSong,
  deleteSong,
} from '../services/SongService.js';

const router = express.Router({ mergeParams: true });

/**
 * POST /api/libraries/:libraryId/songs
 * Create a new song
 */
router.post('/', async (req, res) => {
  try {
    const { libraryId } = req.params;
    const song = await createSong(libraryId, req.body);
    res.status(201).json({ song });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.status === 409) {
      return res.status(409).json({ error: error.message });
    }
    console.error('Create song error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/libraries/:libraryId/songs
 * List all songs in library
 */
router.get('/', async (req, res) => {
  try {
    const { libraryId } = req.params;
    const songs = await getAllSongs(libraryId);
    res.status(200).json({ songs });
  } catch (error) {
    console.error('List songs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/libraries/:libraryId/songs/:songId
 * Get a single song
 */
router.get('/:songId', async (req, res) => {
  try {
    const { libraryId, songId } = req.params;
    const song = await getSongById(libraryId, songId);
    res.status(200).json({ song });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Get song error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/libraries/:libraryId/songs/:songId
 * Update a song (display fields only)
 */
router.put('/:songId', async (req, res) => {
  try {
    const { libraryId, songId } = req.params;
    const song = await updateSong(libraryId, songId, req.body);
    res.status(200).json({ song });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    if (error.status === 409) {
      return res.status(409).json({ error: error.message });
    }
    console.error('Update song error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/libraries/:libraryId/songs/:songId
 * Delete a song and cleanup joins
 */
router.delete('/:songId', async (req, res) => {
  try {
    const { libraryId, songId } = req.params;
    const result = await deleteSong(libraryId, songId);
    res.status(200).json(result);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Delete song error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;