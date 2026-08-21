import { INITIAL_DATA } from '../constants';
import { sanitizePortfolioData } from '../lib/sanitize';
import { readContent, writeContent } from './_lib/blob';
import { error, json, readJson } from './_lib/http';
import { isAuthenticated } from './_lib/session';

/**
 * Public read.
 *
 * Falls back to the bundled defaults when the Blob store is empty or
 * unreachable, so the site renders even before the store is provisioned.
 * `s-maxage` lets the Vercel CDN absorb visitor traffic; a save becomes
 * visible within that window.
 */
export async function GET(): Promise<Response> {
  const stored = await readContent();
  return json(stored ?? INITIAL_DATA, 200, {
    'cache-control': 'public, s-maxage=30, stale-while-revalidate=300',
  });
}

/** Admin write. Sanitizes before storing so the document cannot go malformed. */
export async function PUT(request: Request): Promise<Response> {
  if (!isAuthenticated(request, process.env.SESSION_SECRET)) {
    return error('Unauthorized', 401);
  }

  const body = await readJson(request);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return error('Expected a JSON object body', 400);
  }

  try {
    const sanitized = sanitizePortfolioData(body);
    await writeContent(sanitized);
    return json({ ok: true, data: sanitized });
  } catch (cause) {
    console.error('Failed to write content:', cause);
    return error('Could not save content', 500);
  }
}
