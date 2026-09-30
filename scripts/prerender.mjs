/**
 * Post-build step: turns Vite's index.html into the shell api/page.ts renders
 * every route into, writes robots.txt, and renders every route once as a
 * smoke test.
 *
 * Why no file per route any more: those files were written once per deploy
 * from whatever the content said at that moment. A post published from the
 * dashboard afterwards had no file, so Vercel's SPA fallback served it the
 * home page's HTML — home title, home canonical — and Google filed the post
 * as a duplicate of `/`. Pages are now rendered at request time from the live
 * content by api/page.ts, using lib/renderHtml.ts, and the sitemap likewise
 * by api/sitemap.ts.
 *
 * The shell is moved to dist/_shell.html rather than left at dist/index.html:
 * Vercel serves an existing static file before any rewrite, so a file at
 * dist/index.html would answer `/` directly and the home page would never
 * reach the renderer.
 *
 * Content comes from the live API, as before, so the smoke test renders what
 * visitors will actually be served. If that fetch fails the build still
 * succeeds using the bundled seed — a failed fetch must not block a deploy.
 * A renderer that throws, on the other hand, must.
 */
import { readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from 'esbuild';

const DIST = 'dist';
const CONTENT_URL = process.env.PRERENDER_CONTENT_URL ?? 'https://www.ashimkafle.com.np/api/content';

/**
 * Loads the seed, the sanitizer and the renderer from the app itself, so the
 * smoke test exercises exactly the code api/page.ts runs.
 */
const loadAppModule = async () => {
  const bundled = await build({
    entryPoints: ['scripts/_prerender-entry.ts'],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
  });
  const dataUrl =
    'data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64');
  return import(dataUrl);
};

const loadContent = async (app) => {
  try {
    const response = await fetch(CONTENT_URL, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`status ${response.status}`);
    // Sanitized, not trusted as-is: a document saved before a field existed
    // arrives without it, and the deployed API may lag this build.
    const data = app.sanitizePortfolioData(await response.json());
    console.log(`prerender: using live content from ${CONTENT_URL}`);
    return { data, source: 'live' };
  } catch (cause) {
    console.warn(`prerender: live content unavailable (${cause.message}); using bundled seed`);
    return { data: app.INITIAL_DATA, source: 'seed' };
  }
};

const run = async () => {
  const built = await readFile(join(DIST, 'index.html'), 'utf8');
  const buildDate = new Date().toISOString().slice(0, 10);

  // The stamp api/sitemap.ts reads as <lastmod> for pages that only change on
  // deploy. An HTML comment: invisible, and nothing else parses it.
  const shell = built.replace('<head>', `<head>\n    <!-- built ${buildDate} -->`);
  if (!/<div id="root">\s*<\/div>/.test(shell)) {
    throw new Error('dist/index.html has no empty <div id="root"></div> to render into');
  }
  await writeFile(join(DIST, '_shell.html'), shell, 'utf8');
  await rm(join(DIST, 'index.html'));

  const app = await loadAppModule();
  const loaded = await loadContent(app);
  // The deployed API may predate a post added in this build.
  const data = app.withRepoPosts(loaded.data);
  const { source } = loaded;

  await writeFile(join(DIST, 'robots.txt'), app.robotsTxt(data), 'utf8');

  // Render every route the content defines, plus one that must not exist.
  const paths = [
    ...app.STATIC_ROUTES.map((route) => route.path),
    ...app.ownedServices(data).map((service) => `/services/${service.slug}`),
    ...(data.projects ?? []).map((project) => `/works/${project.slug}`),
    ...(data.blogs ?? []).map((post) => `/blog/${post.slug}`),
    ...app.liveCategories(data).map((category) => `/blog/category/${category.slug}`),
  ];
  let noindexed = 0;
  for (const path of paths) {
    const page = app.renderRoute(data, path);
    if (page.status !== 200) throw new Error(`prerender: ${path} rendered ${page.status}`);
    if (page.noindex) noindexed += 1;
    app.renderDocument(shell, page);
  }
  const missing = app.renderRoute(data, '/this-page-does-not-exist');
  if (missing.status !== 404) throw new Error('prerender: an unknown path did not render a 404');

  const sitemap = app.sitemapXml(data, buildDate);
  const urls = (sitemap.match(/<loc>/g) ?? []).length;

  console.log(
    `prerender (${source}): shell written, ${paths.length} routes rendered (${noindexed} noindex), sitemap would list ${urls} URLs`,
  );
};

run().catch((cause) => {
  console.error('prerender failed:', cause);
  process.exit(1);
});
