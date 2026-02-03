import crypto from 'crypto';
import Library from '../../models/Library.js';

export async function createDefaultLibraryForUser({ userId, name }) {
  const libraryId = `lib_${crypto.randomUUID()}`;

  const library = await Library.create({
    libraryId,
    ownerUserId: userId,
    name: name || 'My Library',
  });

  return library;
}
