/**
 * Library Routes
 * 
 * Handles library-level operations including bootstrap.
 */
import express from 'express';
import Library from '../models/Library.js';
import { getBootstrap } from '../services/LibraryBootstrapService.js';
import songsRouter from './songs.js'; 
import labelsRouter from './labels.js'; 
import taggingRouter from './tagging.js';
import filterRouter from './filter.js';
import modesRouter from './modes.js'; 

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId;

    const libraries = await Library.find({ ownerUserId: userId })
      .select('libraryId name createdAt updatedAt')
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      libraries: (libraries ?? []).map((lib) => ({
        libraryId: lib.libraryId,
        name: lib.name,
        createdAt: lib.createdAt,
        updatedAt: lib.updatedAt,
      })),
    });
  } catch (error) {
    console.error('List libraries error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.use('/:libraryId', async (req, res, next) => {
  const { libraryId } = req.params;
  const userId = req.user?.userId;

  const library = await Library.findOne({ libraryId }).lean();

  if (!library) {
    return res.status(404).json({ error: 'Library not found' });
  }

  if (library.ownerUserId !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return next();
});

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
      return res.status(404).json({ error: 'Library not found' });
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