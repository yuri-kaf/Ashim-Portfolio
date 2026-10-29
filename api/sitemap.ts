import { INITIAL_DATA } from '../constants.js';
import { llmsTxt, sitemapXml } from '../lib/renderHtml.js';
import { withRepoPosts } from '../lib/repoPosts.js';
import { readContentStrict } from './_lib/blob.js';
import { buildDateOf, loadShell } from './_lib/shell.js';

/**
 * /sitemap.xml, built from the content as it is now.
 *
 * It used to be written once per deploy, so a post published from the
 * dashboard stayed out of the sitemap until the next build — and with no
 * sitemap entry and no link from any crawled page, Google never heard of it.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // /llms.txt is rewritten here too (vercel.json): the same live content,
  // and no extra serverless function for a file nobody is known to read.
  const llms = url.searchParams.get('format') === 'llms';
  try {
    const [shell, stored] = await Promise.all([loadShell(url.origin), readContentStrict()]);
    const data = withRepoPosts(stored ?? INITIAL_DATA);
    return new Response(llms ? llmsTxt(data) : sitemapXml(data, buildDateOf(shell)), {
      status: 200,
      headers: {
        'content-type': llms ? 'text/markdown; charset=utf-8' : 'application/xml; charset=utf-8',
        'cache-control': 'public, max-age=0, must-revalidate',
        'vercel-cdn-cache-control': 'max-age=300, stale-while-revalidate=86400, stale-if-error=86400',
      },
    });
  } catch (cause) {
    console.error('sitemap: could not render', cause);
    return new Response('Temporarily unavailable', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'retry-after': '300', 'cache-control': 'no-store' },
    });
  }
}
