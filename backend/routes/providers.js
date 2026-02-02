import express from 'express';
import { ProviderError } from '../providers/contracts/ProviderError.js';
import { resolveProvider } from '../providers/ProviderRegistry.js';

const router = express.Router();

router.get('/search', async (req, res) => {
  const providerType = req.query.providerType;
  const q = req.query.q;

  if (typeof providerType !== 'string' || providerType.trim().length === 0) {
    const err = new ProviderError({
      providerType,
      stage: 'resolve',
      reason: 'Missing required query param: providerType',
      raw: { providerType, q },
    });
    console.error('[routes.providers.search]', err.toJSON());
    return res.status(400).json({ error: err.toJSON() });
  }

  if (typeof q !== 'string' || q.trim().length === 0) {
    const err = new ProviderError({
      providerType,
      stage: 'search',
      reason: 'Missing required query param: q',
      raw: { providerType, q },
    });
    console.error('[routes.providers.search]', err.toJSON());
    return res.status(400).json({ error: err.toJSON() });
  }

  try {
    const provider = await resolveProvider(providerType);
    const results = await provider.search(q, {});
    return res.status(200).json({ results });
  } catch (err) {
    if (err instanceof ProviderError) {
      const payload = err.toJSON();
      console.error('[routes.providers.search]', payload);

      const status = err.stage === 'resolve' ? 400 : 502;
      return res.status(status).json({ error: payload });
    }

    console.error('[routes.providers.search]', {
      name: err?.name,
      reason: err?.message,
    });
    return res.status(500).json({
      error: {
        name: 'Error',
        stage: 'route',
        reason: 'Unexpected error',
      },
    });
  }
});

export default router;
