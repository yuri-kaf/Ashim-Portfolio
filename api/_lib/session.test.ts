import { describe, expect, it } from 'vitest';
import {
  COOKIE_NAME,
  clearCookie,
  isAuthenticated,
  serializeCookie,
  signToken,
  verifyToken,
} from './session';

const SECRET = 'a'.repeat(64);

describe('signToken / verifyToken', () => {
  it('round-trips a valid token', () => {
    expect(verifyToken(signToken(SECRET, 3600), SECRET)).toBe(true);
  });

  it('rejects a token signed with a different secret', () => {
    expect(verifyToken(signToken(SECRET, 3600), 'b'.repeat(64))).toBe(false);
  });

  it('rejects an expired token', () => {
    expect(verifyToken(signToken(SECRET, -10), SECRET)).toBe(false);
  });

  it('rejects a tampered payload', () => {
    const [, signature] = signToken(SECRET, 3600).split('.');
    const forged = Buffer.from(JSON.stringify({ exp: 9999999999 })).toString('base64url');
    expect(verifyToken(`${forged}.${signature}`, SECRET)).toBe(false);
  });

  it('rejects malformed input without throwing', () => {
    expect(verifyToken('', SECRET)).toBe(false);
    expect(verifyToken('nodot', SECRET)).toBe(false);
    expect(verifyToken('a.b.c', SECRET)).toBe(false);
    expect(verifyToken('!!!.!!!', SECRET)).toBe(false);
  });
});

describe('cookies', () => {
  it('marks the cookie httpOnly, Secure and SameSite=Lax', () => {
    const cookie = serializeCookie('token-value', 3600);
    expect(cookie).toContain(`${COOKIE_NAME}=token-value`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=3600');
  });

  it('expires the cookie when clearing', () => {
    expect(clearCookie()).toContain('Max-Age=0');
  });

  it('authenticates a request carrying a valid cookie', () => {
    const request = new Request('https://example.com', {
      headers: { cookie: `other=1; ${COOKIE_NAME}=${signToken(SECRET, 3600)}; more=2` },
    });
    expect(isAuthenticated(request, SECRET)).toBe(true);
  });

  it('rejects a request with no cookie header', () => {
    expect(isAuthenticated(new Request('https://example.com'), SECRET)).toBe(false);
  });

  it('rejects a request whose cookie is a different session', () => {
    const request = new Request('https://example.com', {
      headers: { cookie: `${COOKIE_NAME}=garbage` },
    });
    expect(isAuthenticated(request, SECRET)).toBe(false);
  });
});
