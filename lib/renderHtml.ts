import { Blog, PortfolioData } from '../types.js';
import { isoDate } from './dates.js';
import { escapeHtml, markdownToHtml, text } from './markdownHtml.js';
import { ENGAGEMENTS, VIBE_PRINCIPLES, VIBE_PROMISE } from './pageCopy.js';
import {
  PageMeta,
  ResolvedPage,
  homeEyebrow,
  notFoundMeta,
  resolvePage,
  sitemapEntries,
  summarise,
} from './pageMeta.js';
import { PRIVACY_UPDATED, privacySections } from './privacy.js';
import { indexablePosts, livePosts, liveCategories, postsLinkingTo, relatedPosts } from './posts.js';
import { STATIC_ROUTES, canonicalPath } from './routes.js';
import { absolute, buildGraph } from './seoGraph.js';
import { ownedServices, pointerServices } from './services.js';
import { composeTitle } from './titles.js';

/**
 * Builds the HTML a crawler receives before any JavaScript runs.
 *
 * Every route is rendered here from the live content, at request time, by
 * api/page.ts. It used to be baked into static files at build time, which
 * meant a post published from the dashboard had no file until the next
 * deploy — so it was served the home page's HTML, home-page canonical and
 * all, and Google filed it as a duplicate of `/`. That is what happened to
 * the UI/UX pricing post: live for two weeks, unknown to Google.
 *
 * The body goes inside #root. React replaces that subtree on mount
 * (index.tsx calls createRoot().render, not hydrate), so this markup is what
 * a non-JS crawler or link scraper reads and nothing a browser keeps. It says
 * the same things the SPA renders, in plain elements.
 */

export interface RenderedPage {
  status: 200 | 404;
  title: string;
  headTags: string[];
  body: string;
  noindex: boolean;
}

/** A paragraph, or nothing at all when the field is empty. Never a filler line. */
const para = (value: unknown): string =>
  typeof value === 'string' && value.trim() ? `<p>${text(value.trim())}</p>` : '';

const linkList = (items: Array<{ href?: string; label?: string; note?: string }>): string => {
  const usable = items.filter((item) => item && item.href && item.label);
  if (!usable.length) return '';
  return `<ul>${usable
    .map(
      (item) =>
        `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>${
          item.note ? ` — ${text(item.note)}` : ''
        }</li>`,
    )
    .join('')}</ul>`;
};

const plainList = (items: unknown[]): string => {
  const usable = items.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
  return usable.length ? `<ul>${usable.map((item) => `<li>${text(item)}</li>`).join('')}</ul>` : '';
};

const section = (heading: string, inner: string): string =>
  inner ? `<section><h2>${escapeHtml(heading)}</h2>${inner}</section>` : '';

/** Visible question/answer pairs. FAQPage schema is ignored without them. */
const faqHtml = (faqs: PageMeta['faqs'] = []): string =>
  faqs.length
    ? section(
        'Questions',
        faqs.map((faq) => `<h3>${text(faq.question)}</h3><p>${text(faq.answer)}</p>`).join(''),
      )
    : '';

/** A post with no excerpt (the UI/UX pricing post has none) is summarised from its body. */
const postLinks = (posts: Blog[]) =>
  linkList(
    posts.map((post) => ({
      href: `/blog/${post.slug}`,
      label: post.title,
      note: post.excerpt?.trim() || summarise(post.content),
    })),
  );

/** Term/definition pairs, for the short labelled cards several pages print. */
const definitions = (items: Array<{ term: string; detail: string }>): string => {
  const usable = items.filter((item) => item.term?.trim() && item.detail?.trim());
  return usable.length
    ? `<dl>${usable.map((item) => `<dt>${text(item.term)}</dt><dd>${text(item.detail)}</dd>`).join('')}</dl>`
    : '';
};

/**
 * The site nav, on every page. Crawlers that do not run scripts otherwise
 * find no path from a post back to the hubs.
 */
const siteNav = (): string =>
  `<nav aria-label="Site">${linkList(
    STATIC_ROUTES.map((route) => ({ href: route.path, label: route.label })),
  )}</nav><footer><p><a href="/privacy">Privacy</a></p></footer>`;

/** Profiles with a real URL. The footer greys out the empty ones; here they are left out. */
const socialLinks = (data: PortfolioData) =>
  linkList(
    (data.social ?? [])
      .filter((entry) => entry?.url?.trim())
      .map((entry) => ({ href: entry.url, label: entry.label })),
  );

const serviceLinks = (data: PortfolioData) => [
  ...ownedServices(data).map((service) => ({
    href: `/services/${service.slug}`,
    label: service.title,
    note: service.description,
  })),
  ...pointerServices(data).map((service) => ({
    href: service.externalUrl,
    label: `${service.title} — via ${data.company?.name || 'Limi Creatives'}`,
    note: service.description,
  })),
];

/**
 * The founder sentence. Real visible text with a real link, because
 * lib/seoGraph.ts asserts Person → Organization in schema and Google
 * discounts a schema claim with no matching text on the page.
 */
const founderSentence = (data: PortfolioData): string => {
  const company = data.company;
  if (!company?.name) return '';
  const name = company.url
    ? `<a href="${escapeHtml(company.url)}" rel="noopener">${escapeHtml(company.name)}</a>`
    : `<strong>${escapeHtml(company.name)}</strong>`;
  return `<p>I am ${escapeHtml(company.role || 'part')} of ${name}${
    company.description ? ` — ${text(company.description)}` : '.'
  }</p>`;
};

/** Name, place, phone, email — the NAP a local crawler reads and a human copies. */
const contactBlock = (data: PortfolioData): string => {
  const contact = data.contact ?? { email: '', phone: '', location: '' };
  return [
    `<p>${escapeHtml(data.name)}${data.role ? ` — ${escapeHtml(data.role)}` : ''}</p>`,
    contact.location ? `<p>Location: ${escapeHtml(contact.location)}</p>` : '',
    contact.phone
      ? `<p>Phone / WhatsApp: <a href="tel:${escapeHtml(contact.phone.replace(/[^+\d]/g, ''))}">${escapeHtml(
          contact.phone,
        )}</a></p>`
      : '',
    contact.email
      ? `<p>Email: <a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></p>`
      : '',
  ].join('');
};

const bodyFor = (data: PortfolioData, page: ResolvedPage | null): string => {
  if (!page) {
    return `<h1>Nothing here.</h1><p>That page doesn’t exist — it may have moved, or the link may be wrong.</p><p><a href="/">Back to the site</a></p>`;
  }
  const intros = data.pageIntros;
  const city = data.seo?.geo?.city || data.contact?.location || '';

  switch (page.kind) {
    case 'home': {
      const eyebrow = homeEyebrow(data);
      return [
        eyebrow ? `<p>${escapeHtml(eyebrow)}</p>` : '',
        '<h1>Design that sells. Marketing that scales.</h1>',
        para(data.tagline),
        para(data.heroIntro),
        founderSentence(data),
        section('Services', linkList(serviceLinks(data))),
        section('From the journal', postLinks(indexablePosts(data).slice(0, 3))),
        section(
          'Work',
          linkList((data.projects ?? []).map((project) => ({ href: `/works/${project.slug}`, label: project.title }))),
        ),
        section('Contact', contactBlock(data)),
      ].join('');
    }
    case 'about':
      return [
        `<h1>${escapeHtml(data.name)}${data.role ? ` — ${escapeHtml(data.role)}` : ''}${
          city ? ` in ${escapeHtml(city)}` : ''
        }</h1>`,
        para(data.tagline),
        para(data.heroIntro),
        founderSentence(data),
        data.contact?.location ? `<p>I work from ${escapeHtml(data.contact.location)}.</p>` : '',
        plainList((data.stats ?? []).map((stat) => stat && `${stat.value}${stat.suffix ?? ''} ${stat.label}`)),
        section(
          'Design and marketing, one desk.',
          (data.disciplines ?? [])
            .filter((discipline) => discipline?.key)
            .map(
              (discipline) =>
                `<h3>${text(discipline.key)}</h3>${para(discipline.blurb)}${plainList(discipline.items ?? [])}`,
            )
            .join(''),
        ),
        section('Elsewhere', socialLinks(data)),
        linkList([
          { href: '/works', label: 'See the work' },
          { href: '/services', label: 'What I take on' },
          { href: '/blog', label: 'Read the journal' },
          { href: '/contact', label: 'Get in touch' },
        ]),
      ].join('');
    case 'privacy':
      return `<article><h1>Privacy</h1><p>Last updated ${escapeHtml(PRIVACY_UPDATED)}</p>${privacySections(data)
        .map((entry) => section(entry.heading, entry.paragraphs.map((paragraph) => para(paragraph)).join('')))
        .join('')}</article>`;
    case 'contact':
      return [
        `<h1>Hire a web designer${city ? ` in ${escapeHtml(city)}` : ''}.</h1>`,
        para(data.tagline),
        contactBlock(data),
        section('Services', linkList(serviceLinks(data))),
      ].join('');
    case 'services':
      return [
        '<h1>Design Services in Nepal.</h1>',
        para(intros.services),
        linkList(serviceLinks(data)),
        ...ownedServices(data).map((service) =>
          section(service.title, `${para(service.description)}${plainList(service.deliverables ?? [])}<p><a href="/services/${escapeHtml(service.slug)}">More about ${escapeHtml(service.title)}</a></p>`),
        ),
        section(
          'Three ways to engage.',
          ENGAGEMENTS.map(
            (tier) => `<h3>${text(tier.name)} — ${text(tier.meta)}</h3>${para(tier.desc)}${plainList(tier.points)}`,
          ).join(''),
        ),
        `<p><a href="/contact">Start a project</a></p>`,
      ].join('');
    case 'works':
      return [
        '<h1>Design &amp; Marketing Work from Nepal.</h1>',
        para(intros.works),
        linkList(
          (data.projects ?? []).map((project) => ({
            href: `/works/${project.slug}`,
            label: project.title,
            note: [project.category, project.description].filter((part) => part?.trim()).join(': '),
          })),
        ),
      ].join('');
    case 'blog':
      return [
        '<h1>Design &amp; marketing notes from Nepal.</h1>',
        para(intros.blog),
        section(
          'Topics',
          linkList(
            liveCategories(data).map((category) => ({
              href: `/blog/category/${category.slug}`,
              label: category.title,
              note: category.description,
            })),
          ),
        ),
        section('All posts', postLinks(livePosts(data))),
      ].join('');
    case 'gallery':
      return [
        '<h1>Off the clock</h1>',
        para(intros.gallery),
        plainList((data.gallery ?? []).map((item) => item.caption)),
      ].join('');
    case 'vibe':
      return [
        `<h1>${escapeHtml(data.vibe?.title || 'The crimson vibe.')}</h1>`,
        para(intros.vibe),
        para(data.vibe?.description),
        plainList(data.vibe?.philosophy ?? []),
        section(
          'The process.',
          (data.process ?? [])
            .filter((step) => step?.title)
            .map((step) => `<h3>${text(step.title)}</h3>${para(step.description)}`)
            .join(''),
        ),
        section('Tools', plainList((data.tools ?? []).map((tool) => tool?.name))),
        section(
          'Why work with me',
          `${para(VIBE_PROMISE)}${definitions(VIBE_PRINCIPLES.map((item) => ({ term: item.k, detail: item.v })))}`,
        ),
      ].join('');
    case 'service': {
      const { service } = page;
      const heading = service.seoTitle?.trim() || service.title;
      return `<article><h1>${escapeHtml(heading)}</h1>${para(service.description)}${plainList(
        service.deliverables ?? [],
      )}${markdownToHtml(service.body)}${faqHtml(service.faqs)}${section(
        'Further reading',
        postLinks(postsLinkingTo(data, `/services/${service.slug}`)),
      )}<p><a href="/contact">Enquire about ${escapeHtml(service.title)}</a></p></article>`;
    }
    case 'project': {
      const { project } = page;
      return `<article><h1>${escapeHtml(project.title)}</h1>${para(
        project.subtitle || project.description,
      )}${markdownToHtml(project.caseStudy)}${
        project.challenge ? section('Challenge', para(project.challenge)) : ''
      }${project.approach ? section('Approach', para(project.approach)) : ''}${
        project.outcome ? section('Outcome', para(project.outcome)) : ''
      }</article>`;
    }
    case 'post': {
      const { post } = page;
      const category = (data.blogCategories ?? []).find((entry) => entry && entry.id === post.categoryId);
      const date = isoDate(post.date);
      const byline = [
        post.date ? (date ? `<time datetime="${date}">${escapeHtml(post.date)}</time>` : escapeHtml(post.date)) : '',
        `<a href="/about" rel="author">${escapeHtml(post.author?.trim() || data.name)}</a>`,
        category ? `<a href="/blog/category/${escapeHtml(category.slug)}">${escapeHtml(category.title)}</a>` : '',
      ]
        .filter(Boolean)
        .join(' · ');
      return `<article><h1>${escapeHtml(post.title)}</h1><p>${byline}</p>${para(post.excerpt)}${markdownToHtml(
        post.content,
      )}</article>${section('Keep reading', postLinks(relatedPosts(data, post)))}${section(
        'Work with me',
        linkList([
          ...ownedServices(data).map((service) => ({ href: `/services/${service.slug}`, label: service.title })),
          { href: '/contact', label: 'Get in touch' },
        ]),
      )}`;
    }
    case 'category': {
      const { category } = page;
      const posts = livePosts(data).filter((post) => post.categoryId === category.id);
      return `<h1>${escapeHtml(category.title)}</h1>${para(category.description)}${postLinks(posts)}`;
    }
    case 'dashboard':
      return '';
    default:
      return '';
  }
};

/** JSON inside <script> must not be able to close the tag it sits in. */
const safeJson = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

const headTags = (data: PortfolioData, meta: PageMeta, fullTitle: string): string[] => {
  const seo = data.seo;
  const url = absolute(seo.siteUrl, canonicalPath(meta.path));
  const ogImage = absolute(seo.siteUrl, meta.image || seo.ogImage);
  const desc = meta.description || seo.description;
  const graph = buildGraph({
    seo,
    data,
    path: meta.path,
    title: meta.title || meta.exactTitle || seo.siteName,
    breadcrumbTitle: meta.breadcrumbTitle,
    description: desc,
    faqs: meta.faqs,
    service: meta.service,
    profile: meta.profile,
    article:
      meta.type === 'article'
        ? {
            headline: meta.title || meta.exactTitle || seo.siteName,
            type: meta.schemaType,
            image: ogImage,
            published: meta.publishedTime,
            tags: meta.tags,
          }
        : undefined,
  });

  return [
    `<meta name="description" content="${escapeHtml(desc)}" />`,
    // Only emitted when the page is held back. 'follow' is deliberate: the
    // page stays reachable and its links stay worth crawling. An indexable
    // page gets no robots tag at all, which is what every crawler assumes.
    ...(meta.noindex ? ['<meta name="robots" content="noindex, follow" />'] : []),
    // A page kept out of the index has no business naming a canonical.
    ...(meta.noindex ? [] : [`<link rel="canonical" href="${escapeHtml(url)}" />`]),
    `<meta property="og:title" content="${escapeHtml(fullTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(desc)}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(seo.siteName)}" />`,
    `<meta property="og:locale" content="en_US" />`,
    ...(meta.type === 'article' && meta.publishedTime
      ? [`<meta property="article:published_time" content="${escapeHtml(meta.publishedTime)}" />`]
      : []),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(fullTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(desc)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
    ...(seo.twitterHandle ? [`<meta name="twitter:creator" content="${escapeHtml(seo.twitterHandle)}" />`] : []),
    ...(meta.author ? [`<meta name="author" content="${escapeHtml(meta.author)}" />`] : []),
    `<script type="application/ld+json">${safeJson(graph)}</script>`,
  ];
};

/** Renders one route. Unknown paths get the 404 body with a 404 status. */
export const renderRoute = (data: PortfolioData, path: string): RenderedPage => {
  const page = resolvePage(data, path);
  const meta = page?.meta ?? notFoundMeta(canonicalPath(path || '/'));
  const fullTitle = composeTitle(data.seo, meta.title, meta.exactTitle);
  return {
    status: page ? 200 : 404,
    title: fullTitle,
    headTags: headTags(data, meta, fullTitle),
    body: `${bodyFor(data, page)}${page?.kind === 'dashboard' ? '' : siteNav()}`,
    noindex: Boolean(meta.noindex),
  };
};

/**
 * Pours a rendered page into the Vite-built shell: its own <title>, its head
 * tags, and its body inside #root. The shell carries no canonical or
 * description of its own — see index.html — so these are the only copies.
 */
export const renderDocument = (shell: string, page: RenderedPage): string => {
  let html = shell.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
  // Defensive: a shell built from an older index.html still carries these.
  html = html
    .replace(/\n?\s*<link rel="canonical"[^>]*>/g, '')
    .replace(/\n?\s*<meta name="description"[^>]*>/g, '');
  html = html.replace('</head>', `    ${page.headTags.join('\n    ')}\n  </head>`);
  return html.replace(/<div id="root">\s*<\/div>/, `<div id="root">${page.body}</div>`);
};

/** sitemap.xml for the content as it is right now. */
export const sitemapXml = (data: PortfolioData, buildDate: string): string => {
  const entries = sitemapEntries(data, STATIC_ROUTES, buildDate);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) =>
      `  <url>\n    <loc>${escapeHtml(absolute(data.seo.siteUrl, canonicalPath(entry.path)))}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n    <priority>${entry.priority}</priority>\n  </url>`,
  )
  .join('\n')}
</urlset>
`;
};

export const robotsTxt = (data: PortfolioData): string =>
  `User-agent: *\nAllow: /\nDisallow: /dashboard\n\nSitemap: ${absolute(data.seo.siteUrl, '/sitemap.xml')}\n`;

/**
 * /llms.txt (llmstxt.org): a short Markdown map of the site for AI tools.
 * No engine has said it reads one, so it is built from the same live content
 * as the sitemap and costs nothing to keep current. Only indexable pages are
 * listed — a page held out of search is held out of this too.
 */
export const llmsTxt = (data: PortfolioData): string => {
  const url = (path: string) => absolute(data.seo.siteUrl, canonicalPath(path));
  const line = (label: string, href: string, note?: string) =>
    `- [${label}](${href})${note?.trim() ? `: ${note.replace(/\s+/g, ' ').trim()}` : ''}`;
  const company = data.company;
  const about = [
    data.role && data.contact?.location ? `${data.name} is a ${data.role} in ${data.contact.location}.` : '',
    company?.name ? `${company.role || 'Part'} of ${company.name}${company.url ? ` (${company.url})` : ''}.` : '',
    data.heroIntro,
  ]
    .filter((part) => part?.trim())
    .join(' ');
  const services = [
    ...ownedServices(data).map((service) =>
      line(service.title, url(`/services/${service.slug}`), service.description),
    ),
    ...pointerServices(data).map((service) =>
      line(`${service.title} (via ${company?.name || 'Limi Creatives'})`, service.externalUrl, service.description),
    ),
  ];
  const posts = indexablePosts(data).map((post) =>
    line(post.title, url(`/blog/${post.slug}`), post.excerpt?.trim() || summarise(post.content)),
  );
  return [
    `# ${data.name}`,
    '',
    `> ${data.seo.description}`,
    '',
    about,
    '',
    '## Pages',
    '',
    line('About', url('/about'), `Who ${data.name} is and the work behind the site.`),
    line('Services', url('/services'), data.pageIntros?.services),
    line('Work', url('/works'), data.pageIntros?.works),
    line('Journal', url('/blog'), data.pageIntros?.blog),
    line('Contact', url('/contact'), 'Phone, WhatsApp and email.'),
    '',
    '## Services',
    '',
    ...services,
    ...(posts.length ? ['', '## Writing', '', ...posts] : []),
    '',
    '## Optional',
    '',
    line('Gallery', url('/gallery'), data.pageIntros?.gallery),
    line('Vibe', url('/vibe'), data.pageIntros?.vibe),
    line('Privacy', url('/privacy')),
    '',
  ].join('\n');
};
