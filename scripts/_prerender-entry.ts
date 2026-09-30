/**
 * Entry point bundled by scripts/prerender.mjs so the build step can use the
 * app's own seed, sanitizer and page renderer. Not imported by the site
 * itself.
 *
 * The build no longer writes a file per route — api/page.ts renders every
 * route at request time — but it still renders all of them once, so a
 * renderer that throws on the live content fails the deploy instead of
 * answering 500 to every visitor after it.
 */
export { INITIAL_DATA } from '../constants.js';
export { sanitizePortfolioData } from '../lib/sanitize.js';
export { STATIC_ROUTES } from '../lib/routes.js';
export { renderDocument, renderRoute, robotsTxt, sitemapXml } from '../lib/renderHtml.js';
export { sitemapEntries } from '../lib/pageMeta.js';
export { ownedServices } from '../lib/services.js';
export { livePosts, liveCategories } from '../lib/posts.js';
