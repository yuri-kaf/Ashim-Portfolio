import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INITIAL_DATA } from '../constants.js';
import { COOKIE_NAME, signToken } from './_lib/session.js';

const readContent = vi.fn();
const writeContent = vi.fn();

vi.mock('./_lib/blob.js', () => ({
  CONTENT_PATH: 'content/portfolio.json',
  readContent: () => readContent(),
  writeContent: (data: unknown) => writeContent(data),
}));

const SECRET = 'c'.repeat(64);

const authedRequest = (body: unknown) =>
  new Request('https://example.com/api/content', {
    method: 'PUT',
    headers: {
      cookie: `${COOKIE_NAME}=${signToken(SECRET, 3600)}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

describe('/api/content', () => {
  beforeEach(() => {
    readContent.mockReset();
    writeContent.mockReset();
    process.env.SESSION_SECRET = SECRET;
  });

  it('GET returns the stored document', async () => {
    readContent.mockResolvedValue({ ...INITIAL_DATA, name: 'Stored Name' });
    const { GET } = await import('./content.js');

    const response = await GET();
    expect(response.status).toBe(200);
    expect((await response.json()).name).toBe('Stored Name');
  });

  it('GET falls back to defaults when nothing is stored', async () => {
    readContent.mockResolvedValue(null);
    const { GET } = await import('./content.js');

    const response = await GET();
    expect(response.status).toBe(200);
    expect((await response.json()).name).toBe(INITIAL_DATA.name);
  });

  it('GET sets a CDN cache header', async () => {
    readContent.mockResolvedValue(null);
    const { GET } = await import('./content.js');

    const response = await GET();
    expect(response.headers.get('cache-control')).toContain('s-maxage=30');
  });

  it('PUT rejects an unauthenticated request and does not write', async () => {
    const { PUT } = await import('./content.js');

    const response = await PUT(
      new Request('https://example.com/api/content', {
        method: 'PUT',
        body: JSON.stringify(INITIAL_DATA),
      }),
    );
    expect(response.status).toBe(401);
    expect(writeContent).not.toHaveBeenCalled();
  });

  it('PUT rejects a malformed body', async () => {
    const { PUT } = await import('./content.js');

    const response = await PUT(
      new Request('https://example.com/api/content', {
        method: 'PUT',
        headers: { cookie: `${COOKIE_NAME}=${signToken(SECRET, 3600)}` },
        body: 'not json',
      }),
    );
    expect(response.status).toBe(400);
    expect(writeContent).not.toHaveBeenCalled();
  });

  it('PUT sanitizes before writing', async () => {
    writeContent.mockResolvedValue(undefined);
    const { PUT } = await import('./content.js');

    const response = await PUT(
      authedRequest({ ...INITIAL_DATA, name: 'New', projects: [null, { id: '1' }] }),
    );

    expect(response.status).toBe(200);
    const written = writeContent.mock.calls[0][0];
    expect(written.name).toBe('New');
    expect(written.projects).toHaveLength(1);
  });

  it('PUT reports a storage failure as a 500', async () => {
    writeContent.mockRejectedValue(new Error('blob unavailable'));
    const { PUT } = await import('./content.js');

    const response = await PUT(authedRequest(INITIAL_DATA));
    expect(response.status).toBe(500);
  });

  it('PUT names a storage misconfiguration so it can be acted on', async () => {
    // These are the two failures actually hit in production. A generic message
    // sends the owner to the logs; naming them points at the fix.
    writeContent.mockRejectedValue(new Error('Vercel Blob: This store does not exist.'));
    const { PUT } = await import('./content.js');

    const missing = await PUT(authedRequest(INITIAL_DATA));
    expect(missing.status).toBe(500);
    expect((await missing.json()).error).toMatch(/no longer exists/i);

    writeContent.mockRejectedValue(
      new Error('Vercel Blob: Cannot use public access on a private store.'),
    );
    const privateStore = await PUT(authedRequest(INITIAL_DATA));
    expect((await privateStore.json()).error).toMatch(/private/i);
  });
});
