/**
 * Entry point bundled by scripts/prerender.mjs so the build step can use the
 * app's own seed and sanitizer. Not imported by the site itself.
 */
export { INITIAL_DATA } from '../constants.js';
export { sanitizePortfolioData } from '../lib/sanitize.js';
