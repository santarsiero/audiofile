import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRES_IN = '7d';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }
  return secret;
}

export function signAccessToken({ userId }) {
  const secret = getJwtSecret();
  return jwt.sign({ userId }, secret, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function verifyAccessToken(token) {
  const secret = getJwtSecret();
  const payload = jwt.verify(token, secret);
  return { userId: payload.userId };
}
