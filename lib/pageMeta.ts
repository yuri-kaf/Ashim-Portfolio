import { Blog, BlogCategory, Faq, PortfolioData, Project, Service } from '../types.js';
import { isoDate } from './dates.js';
import { findPost, isLivePost, isSubstantialPost, liveCategories, livePosts, indexablePosts } from './posts.js';
import { isSubstantialProject } from './projects.js';
import { canonicalPath } from './routes.js';
import { ownedServices } from './services.js';
import { aboutTitle, contactTitle, homeTitle, hubTitles } from './titles.js';

/**
 * Everything a page says about itself in <head>, decided in one place.
 *
 * The SPA pages pass this to components/Seo.tsx and api/page.ts renders it
 * into the HTML the server sends, so the head a crawler reads before
 * JavaScript and the head it reads after cannot disagree. They used to be two
 * hand-written copies — /about already had two different descriptions — and
 * Google indexes whichever it happens to see.
 */
export interface PageMeta {
  path: string;
  /** Page title without the site suffix. */
  title?: string;
  /** Complete title, emitted verbatim. See lib/titles.ts. */
  exactTitle?: string;
  /** Label for the last breadcrumb crumb when it differs from the title. */
  breadcrumbTitle?: string;
  description: string;
  image?: string;
  type: 'website' | 'article';
  schemaType?: 'BlogPosting' | 'CreativeWork';
  /** ISO 8601 (YYYY-MM-DD) — what schema.org and the sitemap accept. */
  publishedTime?: string;
  author?: string;
  tags?: string[];
  faqs?: Faq[];
  service?: { name: string; description: string };
  /** Emit ProfilePage — the page is about the person. */
  profile?: boolean;
  noindex?: boolean;
}

/**
 * Google truncates a description past roughly 160 characters, so a long one
 * loses its ending rather than gaining reach. Cut at a word boundary and let
 * the ellipsis show the cut was deliberate.
 */
export const clampDescription = (value = '', limit = 160): string => {
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s—-]+$/, '')}…`;
};

const clean = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** The first non-empty value, clamped for a SERP. */
const describe = (...candidates: unknown[]): string =>
  clampDescription(candidates.map(clean).find(Boolean) ?? '');

/**
 * A description from a Markdown body, for posts written without an excerpt
 * or a meta description — the UI/UX pricing post shipped with neither.
 * Headings, tables and link syntax are dropped so the snippet reads as prose.
 */
export const summarise = (markdown: string): string => {
  const paragraph = (markdown || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find((block) => block && !/^(#|\||[-*]\s|>|```|!\[)/.test(block));
  return clampDescription(
    (paragraph ?? '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`]/g, ''),
  );
};

/**
 * The line above the home page headline. The headline itself is a slogan
 * ("Design that sells. Marketing that scales.") that names no service and no
 * place; this is the sentence that says what and where, for the visitor and
 * the crawler both. pages/LandingPage.tsx and lib/renderHtml.ts both print it.
 */
export const homeEyebrow = (data: PortfolioData): string => {
  const location = clean(data.contact?.location) || clean(data.seo?.geo?.city);
  return [clean(data.role), location].filter(Boolean).join(' — ');
};

export const homeMeta = (data: PortfolioData): PageMeta => ({
  path: '/',
  exactTitle: homeTitle(data),
  // The site-wide description, not the tagline: "Design that looks sharp and
  // marketing that makes it sell." names no service and no place, and it was
  // the snippet under the one page that ranks.
  description: describe(data.seo?.description, data.tagline),
  type: 'website',
});

export const aboutMeta = (data: PortfolioData): PageMeta => {
  const company = data.company ?? { name: '', role: '', description: '' };
  const location = clean(data.contact?.location) || clean(data.seo?.geo?.city);
  const role = clean(data.role);
  let lead = data.name;
  if (role) lead += ` — ${role}${location ? ` in ${location}` : ''}`;
  if (company.role && company.name) lead += `, and ${company.role} of ${company.name}`;
  lead += '.';
  return {
    path: '/about',
    exactTitle: aboutTitle(data),
    breadcrumbTitle: 'About',
    description: describe(`${lead} ${clean(data.heroIntro)}`),
    type: 'website',
    profile: true,
  };
};

export const contactMeta = (data: PortfolioData): PageMeta => {
  const city = clean(data.seo?.geo?.city) || clean(data.contact?.location);
  const phone = clean(data.contact?.phone);
  const location = clean(data.contact?.location);
  // No email address here. A meta description is served to every crawler and
  // scraper that touches the page, which makes it the easiest possible
  // harvest. The phone stays — a local number in the description is normal
  // and useful — and the visible mailto: link is how a person gets in touch.
  return {
    path: '/contact',
    exactTitle: contactTitle(data),
    breadcrumbTitle: 'Contact',
    description: describe(
      `Hire a web designer and digital marketer${city ? ` in ${city}` : ''}.${
        phone ? ` Call ${phone}` : ''
      } — ${data.name}${location ? `, ${location}` : ''}.`,
    ),
    type: 'website',
  };
};

type Hub = 'services' | 'works' | 'blog' | 'gallery' | 'vibe';

const HUB_PATHS: Record<Hub, string> = {
  services: '/services',
  works: '/works',
  blog: '/blog',
  gallery: '/gallery',
  vibe: '/vibe',
};

export const hubMeta = (data: PortfolioData, hub: Hub): PageMeta => {
  const titles = hubTitles(data)[hub];
  const intro = clean(data.pageIntros?.[hub]);
  return {
    path: HUB_PATHS[hub],
    ...titles,
    description: describe(intro, data.seo?.description),
    type: 'website',
  };
};

export const serviceMeta = (service: Service): PageMeta => ({
  path: `/services/${service.slug}`,
  title: clean(service.seoTitle) || service.title,
  // pages/ServiceDetailPage.tsx passes service.title to <Breadcrumbs>; the
  // markup has to say what the trail on the page says.
  breadcrumbTitle: service.title,
  description: describe(service.metaDescription, service.description),
  image: clean(service.image) || undefined,
  type: 'website',
  faqs: service.faqs ?? [],
  service: { name: service.title, description: service.description },
});

export const projectMeta = (project: Project): PageMeta => {
  // `year` is the only date a project carries. January 1st of it is a
  // deliberate approximation; with no year the property is omitted rather
  // than guessed.
  const year = String(project.year ?? '').trim();
  return {
    path: `/works/${project.slug}`,
    title: project.title,
    breadcrumbTitle: project.title,
    description: describe(project.subtitle, project.description),
    image: clean(project.image) || undefined,
    type: 'article',
    schemaType: 'CreativeWork',
    publishedTime: /^\d{4}$/.test(year) ? `${year}-01-01` : undefined,
    // A thin case study stays reachable — /works links it — but out of the
    // index until it carries real copy. See lib/projects.ts.
    noindex: !isSubstantialProject(project),
  };
};

export const postMeta = (post: Blog, data: PortfolioData): PageMeta => ({
  path: `/blog/${post.slug}`,
  title: clean(post.seoTitle) || post.title,
  breadcrumbTitle: post.title,
  description: describe(post.metaDescription, post.excerpt, summarise(post.content)),
  image: clean(post.ogImage) || clean(post.image) || undefined,
  type: 'article',
  schemaType: 'BlogPosting',
  publishedTime: isoDate(post.date) ?? undefined,
  author: clean(post.author) || data.name,
  tags: post.tags,
  // A draft is reachable by direct link so it can be previewed; a placeholder
  // too thin to be worth reading is reachable because the journal lists it.
  // Neither belongs in the index.
  noindex: !isLivePost(post) || !isSubstantialPost(post),
});

export const categoryMeta = (category: BlogCategory, data: PortfolioData): PageMeta => ({
  path: `/blog/category/${category.slug}`,
  title: clean(category.seoTitle) || category.title,
  breadcrumbTitle: category.title,
  description: describe(category.metaDescription, category.description),
  type: 'website',
  // A category holding nothing but placeholders is itself a thin page.
  noindex: !indexablePosts(data).some((post) => post.categoryId === category.id),
});

export const notFoundMeta = (path: string): PageMeta => ({
  path,
  title: 'Page not found',
  description: 'That page does not exist.',
  type: 'website',
  noindex: true,
});

/** What the URL points at, for the server renderer to build a body from. */
export type ResolvedPage =
  | { kind: 'home' | 'about' | 'contact'; meta: PageMeta }
  | { kind: Hub; meta: PageMeta }
  | { kind: 'service'; meta: PageMeta; service: Service }
  | { kind: 'project'; meta: PageMeta; project: Project }
  | { kind: 'post'; meta: PageMeta; post: Blog }
  | { kind: 'category'; meta: PageMeta; category: BlogCategory }
  | { kind: 'dashboard'; meta: PageMeta };

/**
 * Resolves a path to the page the SPA would render there, or null for a 404.
 *
 * Mirrors the route table in App.tsx. A route that exists there but not here
 * would answer 404 to a crawler while rendering fine in a browser — the soft
 * inverse of the soft-404 this replaces.
 */
export const resolvePage = (data: PortfolioData, rawPath: string): ResolvedPage | null => {
  const path = canonicalPath(rawPath || '/');
  switch (path) {
    case '/':
      return { kind: 'home', meta: homeMeta(data) };
    case '/about':
      return { kind: 'about', meta: aboutMeta(data) };
    case '/contact':
      return { kind: 'contact', meta: contactMeta(data) };
    case '/services':
    case '/works':
    case '/blog':
    case '/gallery':
    case '/vibe': {
      const hub = path.slice(1) as Hub;
      return { kind: hub, meta: hubMeta(data, hub) } as ResolvedPage;
    }
    case '/dashboard':
      return {
        kind: 'dashboard',
        meta: { path, title: 'Dashboard', description: '', type: 'website', noindex: true },
      };
    default:
      break;
  }

  const match = /^\/(services|works|blog\/category|blog)\/([^/]+)$/.exec(path);
  if (!match) return null;
  const [, section, rawSlug] = match;
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    return null;
  }

  if (section === 'services') {
    // Pointer services live on limicreatives.com and have no page here.
    const service = ownedServices(data).find((entry) => entry.slug === slug);
    return service ? { kind: 'service', meta: serviceMeta(service), service } : null;
  }
  if (section === 'works') {
    // Slug first, id as the fallback old links used — as WorkDetailPage does.
    const projects = (data.projects ?? []).filter(Boolean);
    const project =
      projects.find((entry) => entry.slug === slug) ?? projects.find((entry) => entry.id === slug);
    return project ? { kind: 'project', meta: projectMeta(project), project } : null;
  }
  if (section === 'blog/category') {
    const category = liveCategories(data).find((entry) => entry.slug === slug);
    return category ? { kind: 'category', meta: categoryMeta(category, data), category } : null;
  }
  const post = findPost(data, slug);
  return post ? { kind: 'post', meta: postMeta(post, data), post } : null;
};

/** Every indexable URL, with the date it last changed where one is known. */
export const sitemapEntries = (
  data: PortfolioData,
  staticRoutes: Array<{ path: string; priority: string }>,
  buildDate: string,
): Array<{ path: string; priority: string; lastmod: string }> => {
  const posts = indexablePosts(data);
  const newestPost = posts.map((post) => isoDate(post.date)).filter(Boolean).sort().pop();

  const entries = staticRoutes.map((route) => ({
    path: route.path,
    priority: route.priority,
    // The journal and the home page list the newest post, so they change when
    // a post goes up after the deploy. The rest change on deploy.
    lastmod:
      (route.path === '/blog' || route.path === '/') && newestPost && newestPost > buildDate
        ? newestPost
        : buildDate,
  }));

  for (const service of ownedServices(data)) {
    entries.push({ path: `/services/${service.slug}`, priority: '0.8', lastmod: buildDate });
  }
  for (const project of (data.projects ?? []).filter(Boolean)) {
    if (isSubstantialProject(project)) {
      entries.push({ path: `/works/${project.slug}`, priority: '0.7', lastmod: buildDate });
    }
  }
  for (const post of posts) {
    entries.push({
      path: `/blog/${post.slug}`,
      priority: '0.8',
      lastmod: isoDate(post.date) ?? buildDate,
    });
  }
  for (const category of liveCategories(data)) {
    const inCategory = posts.filter((post) => post.categoryId === category.id);
    if (!inCategory.length) continue;
    const newest = inCategory.map((post) => isoDate(post.date)).filter(Boolean).sort().pop();
    entries.push({
      path: `/blog/category/${category.slug}`,
      priority: '0.6',
      lastmod: newest ?? buildDate,
    });
  }
  return entries;
};

/** Re-exported so callers resolving pages do not need a second import. */
export { livePosts, indexablePosts };
