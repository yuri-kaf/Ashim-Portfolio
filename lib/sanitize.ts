import { DEFAULT_DATA } from './defaults.js';
import {
  Blog,
  Contact,
  Discipline,
  GalleryItem,
  PageIntros,
  PortfolioData,
  ProcessStep,
  Project,
  ProjectResult,
  SeoDefaults,
  Service,
  SocialLink,
  Stat,
  Tool,
} from '../types.js';
import { resolveSlug } from './slug.js';

type Dirty = Record<string, any>;

const str = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const bool = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

/** Plain objects only, so a null in an array cannot reach a normaliser. */
const objects = (value: unknown): Dirty[] =>
  Array.isArray(value)
    ? value.filter((item): item is Dirty => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : [];

/**
 * Every id is filled in rather than left blank: ids are React keys and the
 * handle the admin uses to target a row, so a missing one causes duplicate-key
 * bugs and edits landing on the wrong item.
 */
let fallbackCounter = 0;
const id = (value: unknown, prefix: string): string => {
  const existing = str(value).trim();
  if (existing) return existing;
  fallbackCounter += 1;
  return `${prefix}-${fallbackCounter}`;
};

/**
 * Normalises a list, guaranteeing each item has every field of its type.
 *
 * An empty incoming array is respected — only a missing or non-array value
 * falls back to defaults. Deleting the last item in the admin has to stick.
 */
const list = <T>(value: unknown, normalise: (item: Dirty) => T, fallback: T[]): T[] =>
  Array.isArray(value) ? objects(value).map(normalise) : fallback;

const project = (item: Dirty): Project => {
  const projectId = id(item.id, 'project');
  const title = str(item.title);
  return {
    id: projectId,
    slug: resolveSlug(str(item.slug), title, projectId),
    title,
    subtitle: str(item.subtitle),
    category: str(item.category),
    description: str(item.description),
    image: str(item.image),
    images: strings(item.images),
    caseStudy: str(item.caseStudy),
    challenge: str(item.challenge),
    approach: str(item.approach),
    outcome: str(item.outcome),
    results: list<ProjectResult>(
      item.results,
      (result) => ({
        id: id(result.id, 'result'),
        value: str(result.value),
        label: str(result.label),
      }),
      [],
    ),
    year: str(item.year),
    client: str(item.client),
    role: str(item.role),
    timeline: str(item.timeline),
    services: strings(item.services),
    liveUrl: str(item.liveUrl),
    featured: bool(item.featured),
  };
};

const service = (item: Dirty): Service => ({
  id: id(item.id, 'service'),
  title: str(item.title),
  description: str(item.description),
  image: str(item.image),
  icon: str(item.icon),
  deliverables: strings(item.deliverables),
  startingAt: str(item.startingAt),
  ...(item.lottieData ? { lottieData: item.lottieData } : {}),
});

const blog = (item: Dirty): Blog => {
  const blogId = id(item.id, 'post');
  const title = str(item.title);
  return {
    id: blogId,
    slug: resolveSlug(str(item.slug), title, blogId),
    title,
    excerpt: str(item.excerpt),
    content: str(item.content),
    date: str(item.date),
    readTime: str(item.readTime),
    image: str(item.image),
    author: str(item.author),
    tags: strings(item.tags),
    // Absent means published: posts written before this field existed were
    // already live, and silently unpublishing them would be a regression.
    published: bool(item.published, true),
    seoTitle: str(item.seoTitle),
    metaDescription: str(item.metaDescription),
    ogImage: str(item.ogImage),
  };
};

const processStep = (item: Dirty): ProcessStep => ({
  id: id(item.id, 'step'),
  title: str(item.title),
  description: str(item.description),
  iconName: str(item.iconName, 'Circle'),
});

const tool = (item: Dirty): Tool => ({
  id: id(item.id, 'tool'),
  name: str(item.name),
  iconName: str(item.iconName, 'Circle'),
});

const galleryItem = (item: Dirty): GalleryItem => ({
  id: id(item.id, 'gallery'),
  image: str(item.image),
  caption: str(item.caption),
  size: ['sm', 'md', 'lg'].includes(item.size) ? item.size : 'sm',
});

const socialLink = (item: Dirty): SocialLink => ({
  id: id(item.id, 'social'),
  label: str(item.label),
  url: str(item.url),
});

const stat = (item: Dirty): Stat => ({
  id: id(item.id, 'stat'),
  value: str(item.value),
  suffix: str(item.suffix),
  label: str(item.label),
});

const discipline = (item: Dirty): Discipline => ({
  id: id(item.id, 'discipline'),
  key: str(item.key),
  blurb: str(item.blurb),
  items: strings(item.items),
});

const contact = (value: unknown): Contact => {
  const dirty = (value && typeof value === 'object' ? value : {}) as Dirty;
  return {
    email: str(dirty.email, DEFAULT_DATA.contact.email),
    phone: str(dirty.phone, DEFAULT_DATA.contact.phone),
    location: str(dirty.location, DEFAULT_DATA.contact.location),
  };
};

const pageIntros = (value: unknown): PageIntros => {
  const dirty = (value && typeof value === 'object' ? value : {}) as Dirty;
  const base = DEFAULT_DATA.pageIntros;
  return {
    works: str(dirty.works, base.works),
    services: str(dirty.services, base.services),
    gallery: str(dirty.gallery, base.gallery),
    blog: str(dirty.blog, base.blog),
    vibe: str(dirty.vibe, base.vibe),
  };
};

const seo = (value: unknown): SeoDefaults => {
  const dirty = (value && typeof value === 'object' ? value : {}) as Dirty;
  const base = DEFAULT_DATA.seo;
  return {
    siteName: str(dirty.siteName, base.siteName),
    titleSuffix: str(dirty.titleSuffix, base.titleSuffix),
    description: str(dirty.description, base.description),
    ogImage: str(dirty.ogImage, base.ogImage),
    twitterHandle: str(dirty.twitterHandle, base.twitterHandle),
    siteUrl: str(dirty.siteUrl, base.siteUrl),
  };
};

/**
 * Normalises an unknown value into a complete `PortfolioData`.
 *
 * Runs on both sides: the client applies it to whatever the API returns, and
 * `PUT /api/content` applies it before writing. Sharing one implementation is
 * what stops the stored document drifting out of shape with `types.ts`.
 *
 * Every nested item is rebuilt field by field, so content saved before a field
 * existed still arrives complete — which matters because the admin binds
 * inputs directly to these values.
 *
 * Idempotent by construction.
 */
export const sanitizePortfolioData = (input: unknown): PortfolioData => {
  const base = DEFAULT_DATA;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return base;
  }

  const dirty = input as Dirty;
  const dirtyCompany = (dirty.company && typeof dirty.company === 'object' ? dirty.company : {}) as Dirty;
  const dirtyVibe = (dirty.vibe && typeof dirty.vibe === 'object' ? dirty.vibe : {}) as Dirty;

  return {
    name: str(dirty.name, base.name),
    role: str(dirty.role, base.role),
    tagline: str(dirty.tagline, base.tagline),
    heroIntro: str(dirty.heroIntro, base.heroIntro),
    company: {
      name: str(dirtyCompany.name, base.company.name),
      role: str(dirtyCompany.role, base.company.role),
      description: str(dirtyCompany.description, base.company.description),
      url: str(dirtyCompany.url, base.company.url ?? ''),
    },
    availability: ['available', 'busy', 'vacation'].includes(dirty.availability)
      ? dirty.availability
      : base.availability,
    contact: contact(dirty.contact),
    stats: list<Stat>(dirty.stats, stat, base.stats),
    ticker: Array.isArray(dirty.ticker) ? strings(dirty.ticker) : base.ticker,
    disciplines: list<Discipline>(dirty.disciplines, discipline, base.disciplines),
    pageIntros: pageIntros(dirty.pageIntros),
    seo: seo(dirty.seo),
    projects: list<Project>(dirty.projects, project, base.projects),
    services: list<Service>(dirty.services, service, base.services),
    blogs: list<Blog>(dirty.blogs, blog, base.blogs),
    process: list<ProcessStep>(dirty.process, processStep, base.process),
    tools: list<Tool>(dirty.tools, tool, base.tools),
    gallery: list<GalleryItem>(dirty.gallery, galleryItem, base.gallery),
    social: list<SocialLink>(dirty.social, socialLink, base.social),
    vibe: {
      title: str(dirtyVibe.title, base.vibe.title),
      description: str(dirtyVibe.description, base.vibe.description),
      philosophy: Array.isArray(dirtyVibe.philosophy)
        ? strings(dirtyVibe.philosophy)
        : base.vibe.philosophy,
    },
  };
};

/** Published posts only, newest-looking order preserved from the document. */
export const publishedBlogs = (data: PortfolioData): Blog[] =>
  (data.blogs ?? []).filter((entry) => entry.published);
