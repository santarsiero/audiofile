/**
 * Library Routes
 * 
 * Handles library-level operations including bootstrap.
 */
import express from 'express';
import Library from '../models/Library.js';
import { getBootstrap } from '../services/LibraryBootstrapService.js';
import { importSingleTrack } from '../services/ProviderIngestionService.js';
import { bulkImportSongs } from '../services/BulkIngestionService.js';
import { bulkImportLabels } from '../services/BulkLabelService.js';
import { bulkImportSongs as bulkImportCanonicalSongs } from '../services/BulkSongService.js';
import songsRouter from './songs.js'; 
import labelsRouter from './labels.js'; 
import taggingRouter from './tagging.js';
import filterRouter from './filter.js';
import modesRouter from './modes.js'; 
import { ProviderError } from '../providers/contracts/ProviderError.js';

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

router.post('/:libraryId/songs/bulk-import', async (req, res) => {
  try {
    const { libraryId } = req.params;
    const { items, applyLabelIds } = req.body || {};

    const itemsOk = Array.isArray(items) && items.length > 0;
    const applyLabelIdsOk = applyLabelIds === undefined || Array.isArray(applyLabelIds);

    if (!itemsOk || !applyLabelIdsOk) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const result = await bulkImportCanonicalSongs(libraryId, items, applyLabelIds);
    return res.status(200).json(result);
  } catch (error) {
    if (typeof error?.status === 'number') {
      return res.status(error.status).json({ error: error.message });
    }

    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
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

router.post('/:libraryId/providers/import', async (req, res) => {
  try {
    const { libraryId } = req.params;
    const { providerType, providerTrackId, starterLabelIds } = req.body || {};

    const providerTypeOk = typeof providerType === 'string' && providerType.trim().length > 0;
    const providerTrackIdOk = typeof providerTrackId === 'string' && providerTrackId.trim().length > 0;
    const starterLabelIdsOk = starterLabelIds === undefined || Array.isArray(starterLabelIds);

    if (!providerTypeOk || !providerTrackIdOk || !starterLabelIdsOk) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const result = await importSingleTrack({
      libraryId,
      providerType,
      providerTrackId,
      starterLabelIds,
    });

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof ProviderError) {
      return res.status(400).json({ error: error.toJSON() });
    }

    if (typeof error?.status === 'number') {
      return res.status(error.status).json({ error: error.message });
    }

    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

router.post('/:libraryId/providers/bulk-import', async (req, res) => {
  try {
    const { libraryId } = req.params;
    const { providerType, items, applyLabelIds } = req.body || {};

    const providerTypeOk = typeof providerType === 'string' && providerType.trim().length > 0;
    const itemsOk = Array.isArray(items) && items.length > 0;
    const applyLabelIdsOk = applyLabelIds === undefined || Array.isArray(applyLabelIds);

    if (!providerTypeOk || !itemsOk || !applyLabelIdsOk) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const result = await bulkImportSongs({
      libraryId,
      providerType,
      items,
      applyLabelIds,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof ProviderError) {
      return res.status(400).json({ error: error.toJSON() });
    }

    if (typeof error?.status === 'number') {
      return res.status(error.status).json({ error: error.message });
    }

    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

router.post('/:libraryId/labels/bulk-import', async (req, res) => {
  try {
    const { libraryId } = req.params;
    const { items } = req.body || {};

    const itemsOk = Array.isArray(items) && items.length > 0;
    if (!itemsOk) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const result = await bulkImportLabels({
      libraryId,
      items,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (typeof error?.status === 'number') {
      return res.status(error.status).json({ error: error.message });
    }

    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

// Mount songs router
router.use('/:libraryId/songs', songsRouter);

router.use('/:libraryId/labels', labelsRouter);

router.use('/:libraryId', taggingRouter);

router.use('/:libraryId', filterRouter);

router.use('/:libraryId/modes', modesRouter);

export default router;