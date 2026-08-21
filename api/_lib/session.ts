import { createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE_NAME = 'portfolio_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

interface SessionPayload {
  exp: number;
}

const sign = (data: string, secret: string): string =>
  createHmac('sha256', secret).update(data).digest('base64url');

/** Token format: `<base64url payload>.<base64url hmac>`. */
export const signToken = (secret: string, ttlSeconds: number): string => {
  const payload: SessionPayload = { exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded, secret)}`;
};

/**
 * Verifies signature first, then expiry — an attacker must not be able to
 * learn anything from a forged token beyond "rejected". Never throws.
 */
export const verifyToken = (token: string, secret: string): boolean => {
  if (!token || !secret) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [encoded, signature] = parts;

  try {
    const expected = Buffer.from(sign(encoded, secret));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length) return false;
    if (!timingSafeEqual(expected, actual)) return false;

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as SessionPayload;
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
};

export const serializeCookie = (token: string, maxAge: number): string =>
  [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ].join('; ');

export const clearCookie = (): string => serializeCookie('', 0);

const readCookie = (request: Request, name: string): string | null => {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
};

/** The single authorisation check every admin route calls. */
export const isAuthenticated = (request: Request, secret: string | undefined): boolean => {
  if (!secret) return false;
  const token = readCookie(request, COOKIE_NAME);
  return token ? verifyToken(token, secret) : false;
};
