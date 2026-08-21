/**
 * Generates the two auth environment variables locally, so the plaintext
 * password never leaves this machine.
 *
 * Usage: node scripts/hash-password.mjs "your chosen password"
 */
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your chosen password"');
  process.exit(1);
}
if (password.length < 16) {
  console.error('Refusing: use a password of at least 16 characters.');
  process.exit(1);
}

const salt = randomBytes(16);
const key = await scryptAsync(password, salt, 64);

console.log('\nAdd these to Vercel -> Project -> Settings -> Environment Variables');
console.log('(all environments), then redeploy:\n');
console.log(`ADMIN_PASSWORD_HASH=scrypt$${salt.toString('hex')}$${key.toString('hex')}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString('hex')}`);
console.log('\nStore the password itself in your password manager. It is not recoverable.\n');
