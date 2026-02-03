import { verifyAccessToken } from '../utils/auth/jwt.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers?.authorization;

  if (typeof authHeader !== 'string') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || typeof token !== 'string' || token.length === 0) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
