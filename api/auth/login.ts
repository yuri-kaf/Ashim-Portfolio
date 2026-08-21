import { error, json, readJson } from '../_lib/http.js';
import { verifyPassword } from '../_lib/password.js';
import { SESSION_TTL_SECONDS, serializeCookie, signToken } from '../_lib/session.js';

/** Delay applied to every failure, to blunt trivial online guessing. */
const FAILURE_DELAY_MS = 400;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.SESSION_SECRET;
  const storedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!secret || !storedHash) {
    console.error('SESSION_SECRET or ADMIN_PASSWORD_HASH is not configured.');
    return error('Server is not configured for sign-in', 500);
  }

  const body = await readJson(request);
  const password =
    body && typeof body === 'object' ? (body as Record<string, unknown>).password : undefined;

  if (typeof password !== 'string' || password.length === 0) {
    return error('Password is required', 400);
  }

  if (!(await verifyPassword(password, storedHash))) {
    await delay(FAILURE_DELAY_MS);
    return error('Incorrect password', 401);
  }

  return json({ ok: true }, 200, {
    'set-cookie': serializeCookie(signToken(secret, SESSION_TTL_SECONDS), SESSION_TTL_SECONDS),
  });
}
