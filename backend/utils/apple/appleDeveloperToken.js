import jwt from 'jsonwebtoken';

/**
 * Apple Music Developer Token (ES256)
 *
 * In-memory cached per process. Cache resets on server restart (expected).
 */

let cached = null;

function requireEnv(name) {
  const value = process.env[name];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`[apple.token] Missing required env var: ${name}`);
  }
  return value;
}

function getTtlSeconds() {
  const raw = requireEnv('APPLE_MUSIC_DEVELOPER_TOKEN_TTL_SECONDS');
  const ttl = Number.parseInt(raw, 10);
  if (!Number.isFinite(ttl) || ttl <= 0) {
    throw new Error('[apple.token] Invalid APPLE_MUSIC_DEVELOPER_TOKEN_TTL_SECONDS (must be positive integer seconds)');
  }
  return ttl;
}

function getPrivateKeyPem() {
  const raw = requireEnv('APPLE_MUSIC_PRIVATE_KEY');
  const pem = raw.replace(/\\n/g, '\n');

  if (!pem.includes('BEGIN PRIVATE KEY') || !pem.includes('END PRIVATE KEY')) {
    throw new Error('[apple.token] Invalid APPLE_MUSIC_PRIVATE_KEY (expected PEM with BEGIN/END PRIVATE KEY)');
  }

  return pem;
}

/**
 * Returns a cached ES256 Apple Music developer token until expiry.
 *
 * Logging rules:
 * - Allowed: lifecycle logs (created vs reused)
 * - Forbidden: private key, token contents, JWT payload details
 */
export function getAppleDeveloperToken() {
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (cached && typeof cached.expiresAt === 'number' && cached.expiresAt > nowSeconds) {
    console.log('[apple.token] reused');
    return cached.token;
  }

  const teamId = requireEnv('APPLE_TEAM_ID');
  const keyId = requireEnv('APPLE_KEY_ID');
  const privateKey = getPrivateKeyPem();
  const ttlSeconds = getTtlSeconds();

  const iat = nowSeconds;
  const exp = iat + ttlSeconds;

  const token = jwt.sign(
    {
      iss: teamId,
      iat,
      exp,
    },
    privateKey,
    {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: keyId,
      },
    }
  );

  const segments = token.split('.');
  if (segments.length !== 3) {
    throw new Error('[apple.token] Generated token is not a valid JWT (expected 3 segments)');
  }

  cached = {
    token,
    expiresAt: exp,
  };

  console.log('[apple.token] created', { exp });
  return token;
}
