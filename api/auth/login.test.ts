import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hashPassword } from '../_lib/password.js';
import { COOKIE_NAME } from '../_lib/session.js';

const SECRET = 'd'.repeat(64);
const PASSWORD = 'a-sufficiently-long-password';

const post = (body: unknown) =>
  new Request('https://example.com/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('/api/auth/login', () => {
  beforeEach(async () => {
    vi.resetModules();
    process.env.SESSION_SECRET = SECRET;
    process.env.ADMIN_PASSWORD_HASH = await hashPassword(PASSWORD);
  });

  it('sets a session cookie for the correct password', async () => {
    const { POST } = await import('./login.js');
    const response = await POST(post({ password: PASSWORD }));

    expect(response.status).toBe(200);
    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toContain(`${COOKIE_NAME}=`);
    expect(cookie).toContain('HttpOnly');
  });

  it('rejects the wrong password without setting a cookie', async () => {
    const { POST } = await import('./login.js');
    const response = await POST(post({ password: 'wrong' }));

    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('rejects a missing password', async () => {
    const { POST } = await import('./login.js');
    expect((await POST(post({}))).status).toBe(400);
  });

  it('returns 500 when the server is not configured', async () => {
    delete process.env.ADMIN_PASSWORD_HASH;
    const { POST } = await import('./login.js');
    expect((await POST(post({ password: PASSWORD }))).status).toBe(500);
  });
});
