import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/** Format: `scrypt$<salt-hex>$<key-hex>`. Salt travels with the hash. */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
};

/**
 * Constant-time comparison. Returns false on any malformed stored hash rather
 * than throwing, so a misconfigured env var denies access instead of turning
 * every login attempt into a 500.
 */
export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const parts = (stored ?? '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

  const [, saltHex, keyHex] = parts;
  if (!/^[0-9a-f]+$/i.test(saltHex) || !/^[0-9a-f]+$/i.test(keyHex)) return false;

  const expected = Buffer.from(keyHex, 'hex');
  if (expected.length !== KEY_LENGTH) return false;

  try {
    const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), KEY_LENGTH);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
};
