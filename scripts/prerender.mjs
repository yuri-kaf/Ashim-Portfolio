/**
 * Bakes per-route metadata *and real body markup* into static HTML after the
 * Vite build, and emits sitemap.xml and robots.txt.
 *
 * Why not server-render the app: the pages drive Lenis and scroll-linked
 * motion that touch `window` at module scope, so rendering them in Node is a
 * source of build failures for no benefit here. Instead each route gets a copy
 * of the built index.html with its own title, description, canonical, Open
 * Graph, Twitter and JSON-LD tags injected, plus a hand-built body — heading,
 * intro, links — as real markup inside #root. Crawlers and link scrapers read
 * that; browsers boot the SPA, which replaces #root on mount.
 *
 * The JSON-LD comes from lib/seoGraph.ts, the same builder components/Seo.tsx
 * uses at runtime, and the URL structure from lib/routes.ts. Neither is
 * reimplemented here: a second copy is exactly how the runtime <head> and the
 * static HTML drift apart.
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

/**
 * Google truncates a description past roughly 160 characters, so a long one
 * loses its ending rather than gaining reach. Cut at a word boundary and let
 * the ellipsis show the cut was deliberate.
 */
const clampDescription = (value = '', limit = 160) => {
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, '')}…`;
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Inline Markdown, applied to already-escaped text. Escaping first means a
 * body containing `<script>` or a bare `&` can never produce markup here; the
 * patterns below only ever add tags this function wrote itself.
 */
const inline = (escaped) =>
  escaped
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

const text = (value) => inline(escapeHtml(value));

/** Minimal Markdown to HTML for the crawler-visible body. */
const markdownToHtml = (markdown = '') =>
  markdown
    .split(/\n{2,}/)
    .map((block) => {
      const body = block.trim();
      if (!body) return '';
      const heading = /^(#{1,6})\s+(.*)$/.exec(body);
      if (heading) {
        // Demoted one level: the page's own <h1> is written by the caller, and
        // a body heading must never become a second one.
        const level = Math.min(heading[1].length + 1, 6);
        return `<h${level}>${text(heading[2])}</h${level}>`;
      }
      if (/^[-*]\s+/.test(body)) {
        const items = body
          .split('\n')
          .map((line) => line.replace(/^[-*]\s+/, '').trim())
          .filter(Boolean)
          .map((line) => `<li>${text(line)}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }
      return `<p>${text(body)}</p>`;
    })
    .filter(Boolean)
    .join('\n');

/** A paragraph, or nothing at all when the field is empty. Never a filler line. */
const para = (value) => (value && String(value).trim() ? `<p>${text(value)}</p>` : '');

const linkList = (items) => {
  const usable = items.filter((item) => item && item.href && item.label);
  if (!usable.length) return '';
  return `<ul>${usable
    .map((item) => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`)
    .join('')}</ul>`;
};

const plainList = (items) => {
  const usable = items.filter((item) => item && String(item).trim());
  if (!usable.length) return '';
  return `<ul>${usable.map((item) => `<li>${text(item)}</li>`).join('')}</ul>`;
};

/** Visible question/answer pairs. FAQPage schema is ignored without them. */
const faqHtml = (faqs = []) =>
  faqs.length
    ? `<section><h2>Questions</h2>${faqs
        .map((faq) => `<h3>${text(faq.question)}</h3><p>${text(faq.answer)}</p>`)
        .join('')}</section>`
    : '';

/** YYYY-MM-DD, or null when the value is not a date we can trust. */
const isoDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

/**
 * Loads the seed, the sanitizer, the route table and the JSON-LD builder from
 * the app itself, so prerendered metadata is built from exactly the shape —
 * and by exactly the code — the running site uses.
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

const injectHead = (html, tags) => html.replace('</head>', `${tags.join('\n    ')}\n  </head>`);

const run = async () => {
  const template = await readFile(join(DIST, 'index.html'), 'utf8');
  const app = await loadAppModule();
  const { buildGraph, absolute, canonicalPath, STATIC_ROUTES, ownedServices, pointerServices, composeTitle, homeTitle, aboutTitle } = app;
  const { data, source } = await loadContent(app);
  const seo = data.seo;
  const urls = [];
  const buildDate = new Date().toISOString().slice(0, 10);

  const buildTags = ({
    title, exactTitle, breadcrumbTitle, description, image, path, type, schemaType,
    published, author, tags, faqs, service,
  }) => {
    // composeTitle is lib/titles.ts — the same helper components/Seo.tsx uses,
    // so the baked <title> and the one React writes on mount cannot disagree.
    const fullTitle = composeTitle(seo, title, exactTitle);
    const url = absolute(seo.siteUrl, canonicalPath(path));
    const ogImage = absolute(seo.siteUrl, image || seo.ogImage);
    const desc = clampDescription(description || seo.description);

    const graph = buildGraph({
      seo,
      data,
      path,
      title: title || exactTitle || seo.siteName,
      // The visible trail's label, which is not the SEO title — see
      // GraphInput.breadcrumbTitle in lib/seoGraph.ts.
      breadcrumbTitle,
      description: desc,
      faqs,
      service,
      article:
        type === 'article'
          ? {
              headline: title || exactTitle || seo.siteName,
              type: schemaType,
              image: ogImage,
              published,
              tags,
            }
          : undefined,
    });

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
      // The author is carried by the Person node in the graph; this tag is for
      // readers that only look at meta.
      ...(author ? [`<meta name="author" content="${escapeHtml(author)}" />`] : []),
      `<script type="application/ld+json">${JSON.stringify(graph)}</script>`,
    ];
  };

  const writeRoute = async (routePath, options) => {
    const path = canonicalPath(routePath);
    let html = template;

    const fullTitle = composeTitle(seo, options.title, options.exactTitle);
    html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`);
    // The template already carries a site-wide canonical and description; drop
    // them so the per-route ones injected below are the only copies.
    html = html
      .replace(/\n\s*<link rel="canonical"[^>]*>/, '')
      .replace(/\n\s*<meta name="description"[^>]*>/, '');
    html = injectHead(html, buildTags({ ...options, path }));

    if (options.body) {
      // Inside #root on purpose: React replaces the whole subtree on mount, so
      // this markup is what a non-JS crawler sees and nothing a browser keeps.
      html = html.replace('<div id="root"></div>', `<div id="root">${options.body}</div>`);
    }

    const target = path === '/' ? join(DIST, 'index.html') : join(DIST, path.slice(1), 'index.html');
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html, 'utf8');
  };

  const priorityFor = (path) =>
    STATIC_ROUTES.find((route) => route.path === canonicalPath(path))?.priority ?? '0.5';

  const addUrl = (path, priority, lastmod) =>
    urls.push({
      loc: absolute(seo.siteUrl, canonicalPath(path)),
      priority,
      lastmod: lastmod || buildDate,
    });

  // ---------------------------------------------------------------- content

  const company = data.company ?? {};
  const contact = data.contact ?? {};
  const city = seo.geo?.city || contact.location || '';
  const posts = (data.blogs ?? []).filter((post) => post.published !== false);
  const projects = data.projects ?? [];
  const categories = data.blogCategories ?? [];

  // One predicate, shared with the SPA — see lib/services.ts for why the body
  // guard is load-bearing. A pointer service's page lives on limicreatives.com
  // and gets no file and no sitemap entry here.
  const owned = ownedServices(data);
  const pointers = pointerServices(data);

  const serviceLinks = [
    ...owned.map((s) => ({ href: `/services/${s.slug}`, label: s.title })),
    ...pointers.map((s) => ({ href: s.externalUrl, label: `${s.title} — via Limi Creatives` })),
  ];

  // The founder sentence. Real visible text with a real link, because
  // lib/seoGraph.ts asserts Person → Organization in schema and Google
  // discounts a schema claim with no matching text on the page.
  const founderSentence = company.name
    ? `<p>I am ${escapeHtml(company.role || '')} of ${
        company.url
          ? `<a href="${escapeHtml(company.url)}" rel="noopener">${escapeHtml(company.name)}</a>`
          : `<strong>${escapeHtml(company.name)}</strong>`
      }${company.description ? ` — ${text(company.description)}` : '.'}</p>`
    : '';

  const staticRoutes = [
    {
      path: '/',
      // An exact title: it already carries the name, so no suffix. Leaving it
      // blank used to fall through to seo.siteName and ship a bare
      // "Ashim Kafle" on the priority-1.0 page.
      exactTitle: homeTitle(data),
      description: data.tagline,
      body: `<h1>Design that sells. Marketing that scales.</h1>${para(data.tagline)}${para(
        data.heroIntro,
      )}${linkList(
        STATIC_ROUTES.filter((route) => route.path !== '/').map((route) => ({
          href: route.path,
          label: route.label,
        })),
      )}`,
    },
    {
      path: '/about',
      // "About Ashim Kafle" + " | Ashim Kafle" put the name twice in the title
      // of the page this restructure exists to rank for that name. The founder
      // claim earns the space instead.
      exactTitle: aboutTitle(data),
      breadcrumbTitle: 'About',
      description: `${data.name} — ${company.role} at ${company.name}. ${data.role} in ${contact.location}.`,
      body: `<h1>${escapeHtml(data.name)}${data.role ? ` — ${escapeHtml(data.role)}` : ''}${
        city ? ` in ${escapeHtml(city)}` : ''
      }</h1>${para(data.tagline)}${para(data.heroIntro)}${founderSentence}${
        contact.location ? `<p>I work from ${escapeHtml(contact.location)}.</p>` : ''
      }${linkList([
        { href: '/works', label: 'See the work' },
        { href: '/services', label: 'What I take on' },
        { href: '/contact', label: 'Get in touch' },
      ])}`,
    },
    {
      path: '/contact',
      title: `Contact ${data.name}`,
      breadcrumbTitle: 'Contact',
      // No email address here. A meta description is served to every crawler
      // and scraper that touches the page, which makes it the easiest possible
      // harvest. The phone stays — a local business number in the description
      // is normal and useful — and the visible mailto: link below is still the
      // way a human gets in touch.
      description: `Hire a web designer and digital marketer in ${city}. Call ${contact.phone} — ${data.name}, ${contact.location}.`,
      // NAP as plain visible text: that is what a local search crawler reads
      // and what a human copies.
      body: `<h1>Hire a web designer in ${escapeHtml(city)}.</h1>${para(
        data.tagline,
      )}<p>${escapeHtml(data.name)}${data.role ? ` — ${escapeHtml(data.role)}` : ''}</p>${
        contact.location ? `<p>Location: ${escapeHtml(contact.location)}</p>` : ''
      }${
        contact.phone
          ? `<p>Phone: <a href="tel:${escapeHtml(
              contact.phone.replace(/[^+\d]/g, ''),
            )}">${escapeHtml(contact.phone)}</a></p>`
          : ''
      }${
        contact.email
          ? `<p>Email: <a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(
              contact.email,
            )}</a></p>`
          : ''
      }${linkList(serviceLinks)}`,
    },
    {
      path: '/services',
      title: 'Services',
      description: data.pageIntros.services,
      body: `<h1>Design Services in Nepal.</h1>${para(data.pageIntros.services)}${linkList(
        serviceLinks,
      )}`,
    },
    {
      path: '/works',
      title: 'Work',
      description: data.pageIntros.works,
      body: `<h1>Design &amp; Marketing Work from Nepal.</h1>${para(
        data.pageIntros.works,
      )}${linkList(
        projects.map((project) => ({
          href: `/works/${project.slug}`,
          label: project.title,
        })),
      )}`,
    },
    {
      path: '/blog',
      title: 'Journal',
      description: data.pageIntros.blog,
      body: `<h1>Latest insights.</h1>${para(data.pageIntros.blog)}${linkList([
        ...categories
          .filter((category) => posts.some((post) => post.categoryId === category.id))
          .map((category) => ({
            href: `/blog/category/${category.slug}`,
            label: category.title,
          })),
        ...posts.map((post) => ({ href: `/blog/${post.slug}`, label: post.title })),
      ])}`,
    },
    {
      path: '/gallery',
      title: 'Gallery',
      description: data.pageIntros.gallery,
      body: `<h1>Off the clock</h1>${para(data.pageIntros.gallery)}${plainList(
        (data.gallery ?? []).map((item) => item.caption),
      )}`,
    },
    {
      path: '/vibe',
      title: 'Vibe',
      description: data.pageIntros.vibe,
      body: `<h1>${escapeHtml(data.vibe?.title || 'The crimson vibe.')}</h1>${para(
        data.pageIntros.vibe,
      )}${para(data.vibe?.description)}${plainList(data.vibe?.philosophy ?? [])}`,
    },
  ];

  for (const route of staticRoutes) {
    await writeRoute(route.path, { ...route, type: 'website' });
    addUrl(route.path, priorityFor(route.path));
  }

  for (const service of owned) {
    const path = `/services/${service.slug}`;
    const heading = service.seoTitle?.trim() || service.title;
    const faqs = service.faqs ?? [];
    await writeRoute(path, {
      title: heading,
      // pages/ServiceDetailPage.tsx passes service.title to <Breadcrumbs>; the
      // markup has to say the same thing the trail on the page says.
      breadcrumbTitle: service.title,
      description: service.metaDescription?.trim() || service.description,
      image: service.image,
      type: 'website',
      faqs,
      service: { name: service.title, description: service.description },
      body: `<article><h1>${escapeHtml(heading)}</h1>${para(service.description)}${plainList(
        service.deliverables ?? [],
      )}${markdownToHtml(service.body)}${faqHtml(faqs)}</article>`,
    });
    addUrl(path, '0.8');
  }

  for (const project of projects) {
    const path = `/works/${project.slug}`;
    // A case study is a CreativeWork, not a BlogPosting. og:type stays
    // "article" — that is Open Graph's vocabulary for any long-form page and
    // has nothing to do with schema.org.
    // `year` is the only date a project carries. January 1st of it is a
    // deliberate approximation; with no year the property is omitted rather
    // than guessed.
    const published = /^\d{4}$/.test(String(project.year ?? '').trim())
      ? `${String(project.year).trim()}-01-01`
      : undefined;
    await writeRoute(path, {
      title: project.title,
      breadcrumbTitle: project.title,
      description: project.subtitle || project.description,
      image: project.image,
      type: 'article',
      schemaType: 'CreativeWork',
      published,
      body: `<article><h1>${escapeHtml(project.title)}</h1>${para(
        project.subtitle || project.description,
      )}${markdownToHtml(project.caseStudy)}</article>`,
    });
    addUrl(path, '0.7');
  }

  // Drafts are deliberately skipped: no static page, no sitemap entry.
  for (const post of posts) {
    const path = `/blog/${post.slug}`;
    await writeRoute(path, {
      title: post.seoTitle?.trim() || post.title,
      breadcrumbTitle: post.title,
      description: post.metaDescription?.trim() || post.excerpt,
      image: post.ogImage || post.image,
      type: 'article',
      schemaType: 'BlogPosting',
      published: post.date,
      author: post.author || data.name,
      tags: post.tags,
      body: `<article><h1>${escapeHtml(post.title)}</h1>${para(post.excerpt)}${markdownToHtml(
        post.content,
      )}</article>`,
    });
    addUrl(path, '0.9', isoDate(post.date));
  }

  // A category with nothing in it is a thin page. No file, no sitemap entry.
  const liveCategories = categories.filter((category) =>
    posts.some((post) => post.categoryId === category.id),
  );
  for (const category of liveCategories) {
    const path = `/blog/category/${category.slug}`;
    const inCategory = posts.filter((post) => post.categoryId === category.id);
    await writeRoute(path, {
      title: category.seoTitle?.trim() || category.title,
      breadcrumbTitle: category.title,
      description: category.metaDescription?.trim() || category.description,
      type: 'website',
      body: `<h1>${escapeHtml(category.title)}</h1>${para(category.description)}${linkList(
        inCategory.map((post) => ({ href: `/blog/${post.slug}`, label: post.title })),
      )}`,
    });
    const newest = inCategory
      .map((post) => isoDate(post.date))
      .filter(Boolean)
      .sort()
      .pop();
    addUrl(path, '0.6', newest);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) =>
      `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n    <priority>${entry.priority}</priority>\n  </url>`,
  )
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
    `prerender (${source}): ${staticRoutes.length} static, ${owned.length} services (${pointers.length} pointers skipped), ${projects.length} projects, ${posts.length} posts, ${liveCategories.length} categories, sitemap with ${urls.length} URLs`,
  );
};

run().catch((cause) => {
  console.error('prerender failed:', cause);
  process.exit(1);
});
