import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

/**
 * Hashes a plaintext password with a random salt using scrypt.
 *
 * @param {string} password - Plaintext password.
 * @returns {Promise<string>} Encoded "salt:hash" string (hex).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored "salt:hash" string.
 *
 * @param {string} password - Plaintext password to verify.
 * @param {string} storedHash - Previously stored "salt:hash" string.
 * @returns {Promise<boolean>} True if the password matches.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  const hashBuffer = Buffer.from(hash, 'hex');
  if (derivedKey.length !== hashBuffer.length) return false;
  return timingSafeEqual(derivedKey, hashBuffer);
}
