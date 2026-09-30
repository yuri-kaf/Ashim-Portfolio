import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INITIAL_DATA } from '../constants.js';

const readContentStrict = vi.fn();
const loadShell = vi.fn();

vi.mock('./_lib/blob.js', () => ({
  readContentStrict: () => readContentStrict(),
}));

vi.mock('./_lib/shell.js', () => ({
  loadShell: (origin: string) => loadShell(origin),
  buildDateOf: () => '2026-10-01',
}));

const SHELL =
  '<!DOCTYPE html><html><head><!-- built 2026-10-01 --><title>Ashim Kafle</title></head><body><div id="root"></div></body></html>';

const get = async (path: string) => {
  const { GET } = await import('./page.js');
  return GET(new Request(`https://www.ashimkafle.com.np/api/page?path=${encodeURIComponent(path)}`));
};

describe('/api/page', () => {
  beforeEach(() => {
    readContentStrict.mockReset();
    loadShell.mockReset();
    loadShell.mockResolvedValue(SHELL);
    readContentStrict.mockResolvedValue(INITIAL_DATA);
  });

  it('renders a known page with its own head and an edge cache', async () => {
    const response = await get('/services/web-design');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.headers.get('vercel-cdn-cache-control')).toContain('stale-while-revalidate');
    const html = await response.text();
    expect(html).toContain('<title>Web Design &amp; UI/UX in Nepal | Ashim Kafle</title>');
    expect(html).toContain('href="https://www.ashimkafle.com.np/services/web-design"');
  });

  it('answers a real 404 for an unknown path', async () => {
    const response = await get('/no-such-page');
    expect(response.status).toBe(404);
    expect(response.headers.get('x-robots-tag')).toBe('noindex, follow');
    expect(await response.text()).toContain('Nothing here.');
  });

  it('redirects a trailing slash to the one canonical URL', async () => {
    const response = await get('/about/');
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('/about');
  });

  it('renders the seed when nothing has been stored yet', async () => {
    readContentStrict.mockResolvedValue(null);
    const response = await get('/');
    expect(response.status).toBe(200);
  });

  it('answers 503 rather than a false 404 when storage is failing', async () => {
    readContentStrict.mockRejectedValue(new Error('Blob service unavailable'));
    const response = await get('/blog/ui-ux-in-nepal-what-it-actually-costs');
    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBeTruthy();
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});

describe('/api/sitemap', () => {
  beforeEach(() => {
    readContentStrict.mockReset();
    loadShell.mockReset();
    loadShell.mockResolvedValue(SHELL);
    readContentStrict.mockResolvedValue(INITIAL_DATA);
  });

  it('serves XML built from the stored content', async () => {
    const { GET } = await import('./sitemap.js');
    const response = await GET(new Request('https://www.ashimkafle.com.np/api/sitemap'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/xml');
    const xml = await response.text();
    expect(xml).toContain('<loc>https://www.ashimkafle.com.np/services/web-design</loc>');
    expect(xml).toContain('<lastmod>2026-10-01</lastmod>');
  });
});
