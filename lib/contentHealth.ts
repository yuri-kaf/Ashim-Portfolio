import { Blog, BlogCategory, PortfolioData, Project, Service, SocialLink } from '../types';
import { PROJECT_CONTENT_MINIMUM, isSubstantialProject, projectContentLength } from './projects';
import { POST_CONTENT_MINIMUM, isSubstantialPost, postContentLength } from './posts';

/**
 * One thing wrong with the content, stated the way the person editing it would
 * state it.
 *
 * Deliberately not a generic "SEO score": a number tells you nothing about what
 * to do next. Every issue names an item and points at the section that fixes
 * it, so the dashboard can list them as work rather than as diagnostics.
 */
export interface Issue {
  id: string;
  /** Which dashboard section fixes it — a COLLECTIONS key, or 'profile'. */
  section: string;
  /** One line, specific, naming the item. */
  message: string;
  severity: 'blocking' | 'warning';
}

/** Longest meta description Google will show before truncating it. */
const META_DESCRIPTION_MAX = 160;

/** Longest title that survives intact in a search result. */
const SEO_TITLE_MAX = 60;

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * The name to put in a message.
 *
 * An untitled item still has to be findable in the list, so it falls back to a
 * word rather than to an empty quote.
 */
const named = (value: unknown, fallback: string): string => text(value) || fallback;

/**
 * Whether an item counts as live.
 *
 * `!== false` rather than truthiness, matching lib/services.ts and the
 * prerenderer: content saved before the `published` field existed has it
 * absent, and all of it was already on the site.
 */
const isLive = (published: unknown): boolean => published !== false;

/**
 * Everything wrong with a content document, blocking issues first.
 *
 * Pure and synchronous — it reads the draft being edited, not the published
 * site, so the list updates as you type. Every rule here mirrors one already
 * enforced downstream by lib/services.ts, lib/projects.ts or the prerenderer;
 * none of them are invented here. When one of those rules changes, this file
 * is wrong and the tests that pin both should say so.
 */
export const contentIssues = (data: PortfolioData): Issue[] => {
  const issues: Issue[] = [];

  const services: Service[] = (data?.services ?? []).filter(Boolean);
  const projects: Project[] = (data?.projects ?? []).filter(Boolean);
  const posts: Blog[] = (data?.blogs ?? []).filter(Boolean);
  const categories: BlogCategory[] = (data?.blogCategories ?? []).filter(Boolean);
  const social: SocialLink[] = (data?.social ?? []).filter(Boolean);

  // ---- Services -------------------------------------------------------

  services.forEach((service, index) => {
    const key = String(service.id ?? index);
    const title = named(service.title, 'An untitled service');

    // `ownedServices` drops a page-mode service with no body, so the build
    // writes no file and no sitemap entry for it — while the SPA still serves
    // it at 200. It looks published and is invisible.
    if (service.mode === 'page' && isLive(service.published) && !text(service.body)) {
      issues.push({
        id: `service-empty-body:${key}`,
        section: 'services',
        severity: 'blocking',
        message: `"${title}" is published but has no page body, so it gets no page and no sitemap entry. Write the body.`,
      });
    }

    // A pointer with nothing to point at renders a dead card and builds no
    // page of its own — the service disappears from the site entirely.
    if (service.mode === 'pointer' && !text(service.externalUrl)) {
      issues.push({
        id: `service-no-target:${key}`,
        section: 'services',
        severity: 'blocking',
        message: `"${title}" points to Limi Creatives but has no destination URL, so it links nowhere.`,
      });
    }

    const seoTitle = text(service.seoTitle);
    if (seoTitle.length > SEO_TITLE_MAX) {
      issues.push({
        id: `service-long-title:${key}`,
        section: 'services',
        severity: 'warning',
        message: `"${title}" has a ${seoTitle.length}-character SEO title; search results cut off after ${SEO_TITLE_MAX}.`,
      });
    }
  });

  // ---- Projects -------------------------------------------------------

  projects.forEach((project, index) => {
    if (isSubstantialProject(project)) return;
    const key = String(project.id ?? index);
    const short = Math.max(0, PROJECT_CONTENT_MINIMUM - projectContentLength(project));
    issues.push({
      id: `project-thin:${key}`,
      section: 'projects',
      severity: 'blocking',
      message: `"${named(project.title, 'An untitled project')}" is not indexed — it needs about ${short} more characters of case-study writing before it goes in the sitemap.`,
    });
  });

  // ---- Posts ----------------------------------------------------------

  const categoryIds = new Set(categories.map((category) => String(category.id)));

  posts.forEach((post, index) => {
    if (!isLive(post.published)) return;
    const key = String(post.id ?? index);
    const title = named(post.title, 'An untitled post');
    const categoryId = text(post.categoryId);

    // The prerenderer files posts under categories by id. Without one the post
    // belongs to no cluster and its category page never gets written.
    if (!categoryId) {
      issues.push({
        id: `post-no-category:${key}`,
        section: 'blogs',
        severity: 'blocking',
        message: `"${title}" is published with no category, so it sits outside every topic cluster.`,
      });
    } else if (!categoryIds.has(categoryId)) {
      issues.push({
        id: `post-dead-category:${key}`,
        section: 'blogs',
        severity: 'blocking',
        message: `"${title}" is filed under a category that no longer exists. Pick a current one.`,
      });
    }

    // lib/posts.ts holds a post this short out of the index and the sitemap.
    // The journal still lists it, so it reads as published and is invisible.
    if (!isSubstantialPost(post)) {
      const short = Math.max(0, POST_CONTENT_MINIMUM - postContentLength(post));
      issues.push({
        id: `post-thin:${key}`,
        section: 'blogs',
        severity: 'blocking',
        message: `"${title}" is not indexed — it needs about ${short} more characters of writing before it goes in the sitemap. Finish it, or unpublish it.`,
      });
    }

    const meta = text(post.metaDescription);
    if (!meta) {
      issues.push({
        id: `post-no-meta:${key}`,
        section: 'blogs',
        severity: 'warning',
        message: `"${title}" has no meta description, so search results fall back to the excerpt.`,
      });
    } else if (meta.length > META_DESCRIPTION_MAX) {
      issues.push({
        id: `post-long-meta:${key}`,
        section: 'blogs',
        severity: 'warning',
        message: `"${title}" has a ${meta.length}-character meta description; Google truncates past ${META_DESCRIPTION_MAX}.`,
      });
    }

    const seoTitle = text(post.seoTitle);
    if (seoTitle.length > SEO_TITLE_MAX) {
      issues.push({
        id: `post-long-title:${key}`,
        section: 'blogs',
        severity: 'warning',
        message: `"${title}" has a ${seoTitle.length}-character SEO title; search results cut off after ${SEO_TITLE_MAX}.`,
      });
    }
  });

  // ---- Categories -----------------------------------------------------

  categories.forEach((category, index) => {
    const live = posts.some(
      (post) => isLive(post.published) && text(post.categoryId) === String(category.id),
    );
    if (live) return;
    issues.push({
      id: `category-empty:${String(category.id ?? index)}`,
      section: 'blogCategories',
      severity: 'warning',
      message: `"${named(category.title, 'An untitled category')}" has no published posts, so no category page is built for it.`,
    });
  });

  // ---- Profile --------------------------------------------------------

  social.forEach((link, index) => {
    if (text(link.url)) return;
    issues.push({
      id: `social-no-url:${String(link.id ?? index)}`,
      section: 'social',
      severity: 'warning',
      // sameAs is how a search engine ties the profiles together into one
      // entity; an empty entry is dropped from the graph, not rendered blank.
      message: `"${named(link.label, 'An unlabelled link')}" has no URL, so it is dropped from the sameAs entity signal.`,
    });
  });

  if (!text(data?.seo?.geo?.city)) {
    issues.push({
      id: 'geo-no-city',
      section: 'profile',
      severity: 'warning',
      message: 'No city is set under SEO, which is the strongest local-search signal the site has.',
    });
  }

  // Blocking first, original order kept within each severity: the list reads
  // as a work queue, and a stable order stops rows jumping while you edit.
  return [
    ...issues.filter((issue) => issue.severity === 'blocking'),
    ...issues.filter((issue) => issue.severity === 'warning'),
  ];
};
