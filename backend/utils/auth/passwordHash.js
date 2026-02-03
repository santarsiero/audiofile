import argon2 from 'argon2';

const argon2Options = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
};

export async function hashPassword(plainPassword) {
  return argon2.hash(plainPassword, argon2Options);
}

export async function verifyPassword(plainPassword, passwordHash) {
  return argon2.verify(passwordHash, plainPassword, {
    type: argon2.argon2id,
  });
}
