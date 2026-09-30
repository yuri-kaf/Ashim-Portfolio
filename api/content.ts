import { INITIAL_DATA } from '../constants.js';
import { sanitizePortfolioData } from '../lib/sanitize.js';
import { withRepoPosts } from '../lib/repoPosts.js';
import { readContent, writeContent } from './_lib/blob.js';
import { error, json, readJson } from './_lib/http.js';
import { isAuthenticated } from './_lib/session.js';

/**
 * Public read.
 *
 * Falls back to the bundled defaults when the Blob store is empty or
 * unreachable, so the site renders even before the store is provisioned.
 * `s-maxage` lets the Vercel CDN absorb visitor traffic; a save becomes
 * visible within that window.
 *
 * Posts written in content/posts/ are merged in — see lib/repoPosts.ts — so
 * the dashboard lists them and its next save stores them.
 */
export async function GET(): Promise<Response> {
  const stored = await readContent();
  return json(withRepoPosts(stored ?? INITIAL_DATA), 200, {
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

    // Storage misconfiguration is the likeliest cause of a failed save and is
    // entirely fixable by the owner, so name it instead of reporting a generic
    // failure the dashboard cannot act on.
    const detail = cause instanceof Error ? cause.message : '';
    if (/store does not exist/i.test(detail)) {
      return error(
        'Storage is not reachable: the Blob store this deployment points at no longer exists. Create a Blob store and redeploy.',
        500,
      );
    }
    if (/private store|public access/i.test(detail)) {
      return error(
        'Storage rejected the write: the Blob store is private, and this site needs a public one. Recreate it with public access and redeploy.',
        500,
      );
    }
    if (/BLOB_READ_WRITE_TOKEN|No token found/i.test(detail)) {
      return error('Storage is not configured: BLOB_READ_WRITE_TOKEN is missing.', 500);
    }

    return error('Could not save content', 500);
  }
}
