/**
 * Bakes per-route metadata into static HTML after the Vite build, and emits
 * sitemap.xml and robots.txt.
 *
 * Why not server-render the app: the pages drive Lenis and scroll-linked
 * motion that touch `window` at module scope, so rendering them in Node is a
 * source of build failures for no benefit here. Instead each route gets a copy
 * of the built index.html with its own title, description, canonical, Open
 * Graph, Twitter and JSON-LD tags injected, plus the post body as real markup
 * inside #root. Crawlers and link scrapers read that; browsers boot the SPA,
 * which replaces #root on mount.
 *
 * Content comes from the live API so published edits appear in the static HTML
 * on the next deploy. If that fetch fails the build still succeeds using the
 * bundled seed — a failed metadata fetch must not break a deploy.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { build } from 'esbuild';

const DIST = 'dist';
const CONTENT_URL = process.env.PRERENDER_CONTENT_URL ?? 'https://www.ashimkafle.com.np/api/content';

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Minimal Markdown to HTML for the crawler-visible body. */
const markdownToHtml = (markdown = '') =>
  markdown
    .split(/\n{2,}/)
    .map((block) => {
      const text = block.trim();
      if (!text) return '';
      const heading = /^(#{1,6})\s+(.*)$/.exec(text);
      if (heading) {
        const level = Math.min(heading[1].length + 1, 6);
        return `<h${level}>${escapeHtml(heading[2])}</h${level}>`;
      }
      if (/^[-*]\s+/.test(text)) {
        const items = text
          .split('\n')
          .map((line) => line.replace(/^[-*]\s+/, '').trim())
          .filter(Boolean)
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }
      return `<p>${escapeHtml(text)}</p>`;
    })
    .join('\n');

/**
 * Loads the seed *and* the sanitizer from the app itself, so prerendered
 * metadata is built from exactly the shape the running site sees. Without this
 * the script has to defend against every field a stored document might predate.
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

const loadContent = async () => {
  const { INITIAL_DATA, sanitizePortfolioData } = await loadAppModule();

  try {
    const response = await fetch(CONTENT_URL, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`status ${response.status}`);
    // Sanitized, not trusted as-is: a document saved before a field existed
    // arrives without it, and the deployed API may lag this build.
    const data = sanitizePortfolioData(await response.json());
    console.log(`prerender: using live content from ${CONTENT_URL}`);
    return data;
  } catch (cause) {
    console.warn(`prerender: live content unavailable (${cause.message}); using bundled seed`);
    return INITIAL_DATA;
  }
};

const absolute = (siteUrl, value) =>
  /^https?:\/\//.test(value)
    ? value
    : `${siteUrl.replace(/\/$/, '')}${value.startsWith('/') ? '' : '/'}${value}`;

const injectHead = (html, tags) =>
  html.replace('</head>', `${tags.join('\n    ')}\n  </head>`);

const buildTags = ({ seo, title, description, image, path, type, published, author, tags, body }) => {
  const fullTitle = title ? `${title}${seo.titleSuffix}` : seo.siteName;
  const url = absolute(seo.siteUrl, path);
  const ogImage = absolute(seo.siteUrl, image || seo.ogImage);
  const desc = description || seo.description;

  const jsonLd =
    type === 'article'
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: title,
          description: desc,
          image: ogImage,
          url,
          ...(published ? { datePublished: published } : {}),
          ...(author ? { author: { '@type': 'Person', name: author } } : {}),
          ...(tags?.length ? { keywords: tags.join(', ') } : {}),
          publisher: { '@type': 'Person', name: seo.siteName },
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: seo.siteName,
          url: absolute(seo.siteUrl, '/'),
          description: desc,
        };

  return [
    `<meta name="description" content="${escapeHtml(desc)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:title" content="${escapeHtml(fullTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(desc)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(seo.siteName)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(fullTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(desc)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  ];
};

const writeRoute = async (template, routePath, options) => {
  let html = template;

  const fullTitle = options.title ? `${options.title}${options.seo.titleSuffix}` : options.seo.siteName;
  html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`);
  // The template already carries a site-wide canonical and description; drop
  // them so the per-route ones injected below are the only copies.
  html = html
    .replace(/\n\s*<link rel="canonical"[^>]*>/, '')
    .replace(/\n\s*<meta name="description"[^>]*>/, '');
  html = injectHead(html, buildTags({ ...options, path: routePath }));

  if (options.body) {
    html = html.replace('<div id="root"></div>', `<div id="root">${options.body}</div>`);
  }

  const target = routePath === '/' ? join(DIST, 'index.html') : join(DIST, routePath.slice(1), 'index.html');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html, 'utf8');
  return target;
};

const run = async () => {
  const template = await readFile(join(DIST, 'index.html'), 'utf8');
  const data = await loadContent();
  const seo = data.seo;
  const urls = [];

  const staticRoutes = [
    { path: '/', title: '', description: data.tagline, type: 'website' },
    { path: '/works', title: 'Work', description: data.pageIntros.works, type: 'website' },
    { path: '/services', title: 'Services', description: data.pageIntros.services, type: 'website' },
    { path: '/gallery', title: 'Gallery', description: data.pageIntros.gallery, type: 'website' },
    { path: '/vibe', title: 'Vibe', description: data.pageIntros.vibe, type: 'website' },
    { path: '/blog', title: 'Journal', description: data.pageIntros.blog, type: 'website' },
  ];

  for (const route of staticRoutes) {
    await writeRoute(template, route.path, { seo, ...route });
    urls.push({ loc: absolute(seo.siteUrl, route.path), priority: route.path === '/' ? '1.0' : '0.8' });
  }

  for (const project of data.projects ?? []) {
    const path = `/works/${project.slug}`;
    await writeRoute(template, path, {
      seo,
      title: project.title,
      description: project.subtitle || project.description,
      image: project.image,
      type: 'article',
      body: `<article><h1>${escapeHtml(project.title)}</h1><p>${escapeHtml(
        project.subtitle || project.description,
      )}</p>${markdownToHtml(project.caseStudy)}</article>`,
    });
    urls.push({ loc: absolute(seo.siteUrl, path), priority: '0.7' });
  }

  // Drafts are deliberately skipped: no static page, no sitemap entry.
  const posts = (data.blogs ?? []).filter((post) => post.published !== false);
  for (const post of posts) {
    const path = `/blog/${post.slug}`;
    await writeRoute(template, path, {
      seo,
      title: post.seoTitle || post.title,
      description: post.metaDescription || post.excerpt,
      image: post.ogImage || post.image,
      type: 'article',
      published: post.date,
      author: post.author || data.name,
      tags: post.tags,
      body: `<article><h1>${escapeHtml(post.title)}</h1><p>${escapeHtml(
        post.excerpt,
      )}</p>${markdownToHtml(post.content)}</article>`,
    });
    urls.push({ loc: absolute(seo.siteUrl, path), priority: '0.9' });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((entry) => `  <url>\n    <loc>${entry.loc}</loc>\n    <priority>${entry.priority}</priority>\n  </url>`)
  .join('\n')}
</urlset>
`;
  await writeFile(join(DIST, 'sitemap.xml'), sitemap, 'utf8');

  await writeFile(
    join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /dashboard\n\nSitemap: ${absolute(seo.siteUrl, '/sitemap.xml')}\n`,
    'utf8',
  );

  console.log(
    `prerender: ${staticRoutes.length} pages, ${(data.projects ?? []).length} projects, ${posts.length} posts, sitemap with ${urls.length} URLs`,
  );
};

run().catch((cause) => {
  console.error('prerender failed:', cause);
  process.exit(1);
});
