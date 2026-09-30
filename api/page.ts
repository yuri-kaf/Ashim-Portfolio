import { INITIAL_DATA } from '../constants.js';
import { canonicalPath } from '../lib/routes.js';
import { renderDocument, renderRoute } from '../lib/renderHtml.js';
import { withRepoPosts } from '../lib/repoPosts.js';
import { readContentStrict } from './_lib/blob.js';
import { loadShell } from './_lib/shell.js';

/**
 * Every HTML page on the site.
 *
 * vercel.json rewrites any path that is not a static file or an API route
 * here, as `/api/page?path=/the/path`. The page is rendered from the content
 * as it is now — see lib/renderHtml.ts for why that is no longer done once
 * per deploy — and cached at the edge for two minutes, then served stale
 * while it refreshes, so a dashboard save reaches crawlers within minutes
 * without a rebuild.
 *
 * An unknown path answers 404 with the 404 page. It used to answer 200 with
 * the home page's HTML, canonical and all, which is a soft 404 that also
 * claims to be the home page.
 */

const HTML = 'text/html; charset=utf-8';

/** Browsers always revalidate; the edge holds a copy and refreshes it quietly. */
const CACHED = {
  'cache-control': 'public, max-age=0, must-revalidate',
  'vercel-cdn-cache-control': 'max-age=120, stale-while-revalidate=86400, stale-if-error=86400',
};

/** `/api/page?path=…` → the path the visitor asked for. */
export const requestedPath = (request: Request): string => {
  const url = new URL(request.url);
  const raw = url.searchParams.get('path') ?? '/';
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  // Collapse `//` so a malformed link cannot mint a second URL for a page.
  return path.replace(/\/{2,}/g, '/');
};

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = requestedPath(request);

  // One page, one URL: `/about/` answers with a permanent redirect to
  // `/about` rather than a second copy of the page.
  const canonical = canonicalPath(path);
  if (canonical !== path) {
    return new Response(null, {
      status: 308,
      headers: { location: canonical, ...CACHED },
    });
  }

  let shell: string;
  let stored;
  try {
    [shell, stored] = await Promise.all([loadShell(url.origin), readContentStrict()]);
  } catch (cause) {
    // Storage or the shell failed. A 503 tells a crawler to come back later
    // rather than to drop the URL, and stale-if-error above means the edge
    // serves the last good copy to visitors in the meantime.
    console.error('page: could not render', path, cause);
    return new Response('Temporarily unavailable', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'retry-after': '120', 'cache-control': 'no-store' },
    });
  }

  const data = withRepoPosts(stored ?? INITIAL_DATA);
  const page = renderRoute(data, path);
  return new Response(renderDocument(shell, page), {
    status: page.status,
    headers: {
      'content-type': HTML,
      ...(page.noindex ? { 'x-robots-tag': 'noindex, follow' } : {}),
      ...CACHED,
    },
  });
}

export async function HEAD(request: Request): Promise<Response> {
  const response = await GET(request);
  return new Response(null, { status: response.status, headers: response.headers });
}
