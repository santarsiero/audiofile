import crypto from 'crypto';
import argon2 from 'argon2';

const argon2Options = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
};

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString('base64url');
}

export async function hashRefreshToken(token) {
  return argon2.hash(token, argon2Options);
}

export async function buildRefreshTokenRecord({ tokenId, userId, token }) {
  const tokenHash = await hashRefreshToken(token);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    tokenId,
    userId,
    tokenHash,
    expiresAt,
    createdAt: now,
    lastUsedAt: null,
    revokedAt: null,
    replacedByTokenId: null,
  };
}
