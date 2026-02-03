import crypto from 'crypto';
import User from '../../models/User.js';
import { createDefaultLibraryForUser } from '../../services/library/createDefaultLibrary.js';

export async function createTestUserWithLibrary({ email, passwordHash, userId } = {}) {
  const resolvedUserId = userId || `user_${crypto.randomUUID()}`;
  const resolvedEmail = email || `test_${crypto.randomUUID()}@audiofile.dev`;
  const resolvedPasswordHash = passwordHash || '__dev_only__placeholder__';

  const user = await User.create({
    userId: resolvedUserId,
    email: resolvedEmail,
    passwordHash: resolvedPasswordHash,
    authProvider: 'local',
  });

  const library = await createDefaultLibraryForUser({ userId: user.userId });

  return { user, library };
}
