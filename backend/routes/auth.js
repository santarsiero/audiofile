import express from 'express';
import crypto from 'crypto';
import argon2 from 'argon2';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { hashPassword, verifyPassword } from '../utils/auth/passwordHash.js';
import { signAccessToken } from '../utils/auth/jwt.js';
import {
  buildRefreshTokenRecord,
  generateRefreshToken,
} from '../utils/auth/refreshTokens.js';
import { createDefaultLibraryForUser } from '../services/library/createDefaultLibrary.js';

const router = express.Router();

async function register(req, res) {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const normEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normEmail }).lean();
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const userId = `user_${crypto.randomUUID()}`;
    const passwordHash = await hashPassword(password);

    const user = await User.create({
      userId,
      email: normEmail,
      passwordHash,
      authProvider: 'local',
    });

    await createDefaultLibraryForUser({ userId: user.userId });

    const accessToken = signAccessToken({ userId: user.userId });

    const refreshToken = generateRefreshToken();
    const tokenId = `rt_${crypto.randomUUID()}`;
    const refreshTokenRecord = await buildRefreshTokenRecord({
      tokenId,
      userId: user.userId,
      token: refreshToken,
    });

    await RefreshToken.create(refreshTokenRecord);

    return res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        userId: user.userId,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const normEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = signAccessToken({ userId: user.userId });

    const refreshToken = generateRefreshToken();
    const tokenId = `rt_${crypto.randomUUID()}`;
    const refreshTokenRecord = await buildRefreshTokenRecord({
      tokenId,
      userId: user.userId,
      token: refreshToken,
    });

    await RefreshToken.create(refreshTokenRecord);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        userId: user.userId,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body || {};

    if (typeof refreshToken !== 'string' || !refreshToken) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const now = new Date();

    const candidates = await RefreshToken.find({
      revokedAt: null,
      expiresAt: { $gt: now },
    });

    let matchedToken = null;

    for (const candidate of candidates) {
      try {
        const ok = await argon2.verify(candidate.tokenHash, refreshToken, {
          type: argon2.argon2id,
        });
        if (ok) {
          matchedToken = candidate;
          break;
        }
      } catch (e) {
        // ignore and continue
      }
    }

    if (!matchedToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (matchedToken.revokedAt) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (matchedToken.expiresAt && matchedToken.expiresAt.getTime() < now.getTime()) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const userId = matchedToken.userId;

    const newRefreshToken = generateRefreshToken();
    const newTokenId = `rt_${crypto.randomUUID()}`;
    const newRecord = await buildRefreshTokenRecord({
      tokenId: newTokenId,
      userId,
      token: newRefreshToken,
    });

    await RefreshToken.create(newRecord);

    matchedToken.revokedAt = now;
    matchedToken.replacedByTokenId = newTokenId;
    await matchedToken.save();

    const accessToken = signAccessToken({ userId });

    return res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body || {};

    if (typeof refreshToken !== 'string' || !refreshToken) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const candidates = await RefreshToken.find({ revokedAt: null });

    let matchedToken = null;

    for (const candidate of candidates) {
      try {
        const ok = await argon2.verify(candidate.tokenHash, refreshToken, {
          type: argon2.argon2id,
        });
        if (ok) {
          matchedToken = candidate;
          break;
        }
      } catch (e) {
        // ignore and continue
      }
    }

    if (!matchedToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    matchedToken.revokedAt = new Date();
    await matchedToken.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function me(req, res) {
  res.sendStatus(501);
}

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', me);

export default router;
export { register, login, refresh, logout, me };
