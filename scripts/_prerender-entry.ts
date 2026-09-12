/**
 * Entry point bundled by scripts/prerender.mjs so the build step can use the
 * app's own seed, sanitizer, route table and JSON-LD builder. Not imported by
 * the site itself.
 *
 * Everything the prerenderer needs about URLs and structured data is re-exported
 * here rather than reimplemented in the .mjs. A second copy of the graph builder
 * is how the runtime <head> and the static HTML drift apart.
 */
export { INITIAL_DATA } from '../constants.js';
export { sanitizePortfolioData } from '../lib/sanitize.js';
export { buildGraph, absolute } from '../lib/seoGraph.js';
export { breadcrumbTrail, canonicalPath, routeByPath, STATIC_ROUTES } from '../lib/routes.js';
export { ownedServices, pointerServices } from '../lib/services.js';
export { isSubstantialProject } from '../lib/projects.js';
export { composeTitle, homeTitle, aboutTitle } from '../lib/titles.js';
