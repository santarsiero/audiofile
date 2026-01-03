/**
 * Labels Routes
 * 
 * Handles label CRUD operations within a library.
 * Supports both REGULAR and SUPER labels.
 * Mounted at /api/libraries/:libraryId/labels
 */

import express from 'express';
import {
  getAllLabels,
  createRegularLabel,
  createSuperLabel,
  getLabelById,
  replaceSuperComponents,
  deleteLabel,
} from '../services/LabelService.js';

const router = express.Router({ mergeParams: true });

/**
 * GET /api/libraries/:libraryId/labels
 * List all labels (optional ?type=REGULAR or ?type=SUPER)
 */
router.get('/', async (req, res) => {
  try {
    const { libraryId } = req.params;
    const { type } = req.query;
    
    const labels = await getAllLabels(libraryId, { type });
    res.status(200).json({ labels });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error('List labels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/libraries/:libraryId/labels
 * Create a REGULAR label
 */
router.post('/', async (req, res) => {
  try {
    const { libraryId } = req.params;
    const label = await createRegularLabel(libraryId, req.body);
    res.status(201).json({ label });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.status === 409) {
      return res.status(409).json({ error: error.message });
    }
    console.error('Create regular label error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/libraries/:libraryId/labels/super
 * Create a SUPER label with components
 */
router.post('/super', async (req, res) => {
  try {
    const { libraryId } = req.params;
    const result = await createSuperLabel(libraryId, req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.status === 409) {
      return res.status(409).json({ error: error.message });
    }
    console.error('Create super label error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/libraries/:libraryId/labels/:labelId
 * Get a single label with components
 */
router.get('/:labelId', async (req, res) => {
  try {
    const { libraryId, labelId } = req.params;
    const result = await getLabelById(libraryId, labelId);
    res.status(200).json(result);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Get label error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/libraries/:libraryId/labels/:labelId/components
 * Replace SUPER label components
 */
router.put('/:labelId/components', async (req, res) => {
  try {
    const { libraryId, labelId } = req.params;
    const { componentLabelIds } = req.body;
    
    const result = await replaceSuperComponents(libraryId, labelId, componentLabelIds);
    res.status(200).json(result);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Replace components error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/libraries/:libraryId/labels/:labelId
 * Delete a label and cleanup joins
 */
router.delete('/:labelId', async (req, res) => {
  try {
    const { libraryId, labelId } = req.params;
    const result = await deleteLabel(libraryId, labelId);
    res.status(200).json(result);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Delete label error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;