/**
 * Library Routes
 * 
 * Handles library-level operations including bootstrap.
 */
import express from 'express';
import { getBootstrap } from '../services/LibraryBootstrapService.js';
import songsRouter from './songs.js'; 
import labelsRouter from './labels.js'; 
import taggingRouter from './tagging.js';
import filterRouter from './filter.js';
import modesRouter from './modes.js'; 

const router = express.Router();

/**
 * GET /api/libraries/:libraryId/bootstrap
 * 
 * Returns all library-scoped data needed to load the application.
 * This is the primary "Enter Library" endpoint.
 * 
 * Response shape:
 * {
 *   library: {...},
 *   songs: [...],
 *   labels: [...],
 *   songLabels: [...],
 *   superLabelComponents: [...],
 *   labelModes: [...],
 *   labelModeLabels: [...]
 * }
 */
router.get('/:libraryId/bootstrap', async (req, res) => {
  try {
    const { libraryId } = req.params;
    const bootstrapData = await getBootstrap(libraryId);
    res.status(200).json(bootstrapData);
  } catch (error) {
    // Handle 404 (library not found)
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    // Handle all other errors as 500
    console.error('Bootstrap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mount songs router
router.use('/:libraryId/songs', songsRouter);

router.use('/:libraryId/labels', labelsRouter);

router.use('/:libraryId', taggingRouter);

router.use('/:libraryId', filterRouter);

router.use('/:libraryId/modes', modesRouter);

export default router;