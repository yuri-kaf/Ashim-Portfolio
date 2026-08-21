import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIE_NAME, signToken } from './_lib/session.js';

const SECRET = 'e'.repeat(64);

describe('/api/upload', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SESSION_SECRET = SECRET;
  });

  it('rejects an unauthenticated request', async () => {
    const { POST } = await import('./upload.js');
    const response = await POST(
      new Request('https://example.com/api/upload', { method: 'POST', body: '{}' }),
    );
    expect(response.status).toBe(401);
  });

  it('rejects a request whose cookie does not verify', async () => {
    const { POST } = await import('./upload.js');
    const response = await POST(
      new Request('https://example.com/api/upload', {
        method: 'POST',
        headers: { cookie: `${COOKIE_NAME}=forged` },
        body: '{}',
      }),
    );
    expect(response.status).toBe(401);
  });

  it('returns 400 rather than throwing on a malformed body', async () => {
    const { POST } = await import('./upload.js');
    const response = await POST(
      new Request('https://example.com/api/upload', {
        method: 'POST',
        headers: { cookie: `${COOKIE_NAME}=${signToken(SECRET, 3600)}` },
        body: 'not json',
      }),
    );
    expect(response.status).toBe(400);
  });
});
