/**
 * Label Modes Routes
 * 
 * Handles label mode CRUD and label associations.
 * Mounted at /api/libraries/:libraryId/modes
 */

import express from 'express';
import {
  listModes,
  createMode,
  getMode,
  attachLabel,
  detachLabel,
  deleteMode,
} from '../services/LabelModeService.js';

const router = express.Router({ mergeParams: true });

/**
 * GET /api/libraries/:libraryId/modes
 * List all modes and their label joins
 */
router.get('/', async (req, res) => {
  try {
    const { libraryId } = req.params;
    const result = await listModes(libraryId);
    res.status(200).json(result);
  } catch (error) {
    console.error('List modes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/libraries/:libraryId/modes
 * Create a new mode
 */
router.post('/', async (req, res) => {
  try {
    const { libraryId } = req.params;
    const mode = await createMode(libraryId, req.body);
    res.status(201).json({ mode });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.status === 409) {
      return res.status(409).json({ error: error.message });
    }
    console.error('Create mode error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/libraries/:libraryId/modes/:modeId
 * Get a single mode with its label joins
 */
router.get('/:modeId', async (req, res) => {
  try {
    const { libraryId, modeId } = req.params;
    const result = await getMode(libraryId, modeId);
    res.status(200).json(result);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Get mode error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/libraries/:libraryId/modes/:modeId/labels/:labelId
 * Attach a label to a mode (idempotent)
 */
router.post('/:modeId/labels/:labelId', async (req, res) => {
  try {
    const { libraryId, modeId, labelId } = req.params;
    const result = await attachLabel(libraryId, modeId, labelId);
    
    // Return 201 if created, 200 if already existed
    const statusCode = result.created ? 201 : 200;
    res.status(statusCode).json(result);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Attach label to mode error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/libraries/:libraryId/modes/:modeId/labels/:labelId
 * Detach a label from a mode (idempotent)
 */
router.delete('/:modeId/labels/:labelId', async (req, res) => {
  try {
    const { libraryId, modeId, labelId } = req.params;
    const result = await detachLabel(libraryId, modeId, labelId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Detach label from mode error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/libraries/:libraryId/modes/:modeId
 * Delete a mode and cleanup its joins
 */
router.delete('/:modeId', async (req, res) => {
  try {
    const { libraryId, modeId } = req.params;
    const result = await deleteMode(libraryId, modeId);
    res.status(200).json(result);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Delete mode error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;