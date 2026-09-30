import { Blog, BlogCategory, PortfolioData } from '../types';
import { byNewest } from './dates';

/**
 * The one place that decides which posts are live and which of those are
 * worth a place in the index. The sibling of lib/projects.ts, for the same
 * reason: a gate on the writing, not a list of slugs.
 *
 * Two placeholder posts shipped with the seed — 91 and 61 characters of body
 * each — and Google indexed one of them. A page that is a title and a single
 * sentence is exactly the thin content that drags down the pages meant to
 * rank, so a post below this floor stays reachable but carries
 * `noindex, follow` and stays out of the sitemap until it is written.
 */

/**
 * Minimum characters of body a post needs before it is indexable.
 *
 * 1,200 characters is roughly 200 words — a short post, but past the point
 * where the page is only a headline. The floor is for "someone wrote this",
 * not a target; the posts meant to rank run to several thousand.
 */
export const POST_CONTENT_MINIMUM = 1200;

/** Characters of written body, ignoring surrounding whitespace. */
export const postContentLength = (post: Partial<Blog> | null | undefined): number =>
  typeof post?.content === 'string' ? post.content.trim().length : 0;

/**
 * `!== false` rather than truthiness, matching lib/services.ts: a post saved
 * before `published` existed has it absent, and those were already live.
 */
export const isLivePost = (post: Partial<Blog> | null | undefined): boolean =>
  Boolean(post) && post!.published !== false;

export const isSubstantialPost = (post: Partial<Blog> | null | undefined): boolean =>
  Boolean(post) && postContentLength(post) >= POST_CONTENT_MINIMUM;

/** Published posts, newest first — what the journal lists. */
export const livePosts = (data: Partial<PortfolioData> | null | undefined): Blog[] =>
  byNewest((data?.blogs ?? []).filter((post): post is Blog => isLivePost(post)));

/** Published posts with enough writing to be indexed — what the sitemap lists. */
export const indexablePosts = (data: Partial<PortfolioData> | null | undefined): Blog[] =>
  livePosts(data).filter(isSubstantialPost);

/**
 * Finds a post by slug, falling back to id so links shared before slugs
 * existed still resolve. Drafts included: a draft is previewable by direct
 * link, it is just never listed or indexed.
 */
export const findPost = (
  data: Partial<PortfolioData> | null | undefined,
  slug: string | undefined,
): Blog | undefined => {
  const posts = (data?.blogs ?? []).filter(Boolean);
  return posts.find((post) => post.slug === slug) ?? posts.find((post) => post.id === slug);
};

/** Categories with at least one published post — the ones that get a page. */
export const liveCategories = (data: Partial<PortfolioData> | null | undefined): BlogCategory[] => {
  const posts = livePosts(data);
  return (data?.blogCategories ?? []).filter(
    (category): category is BlogCategory =>
      Boolean(category) && posts.some((post) => post.categoryId === category.id),
  );
};

/**
 * Other posts worth reading after this one: same category first, then the
 * rest, newest first within each, thin placeholders left out.
 */
export const relatedPosts = (
  data: Partial<PortfolioData> | null | undefined,
  post: Blog,
  limit = 3,
): Blog[] => {
  const others = indexablePosts(data).filter((entry) => entry.id !== post.id);
  const sameCategory = others.filter(
    (entry) => post.categoryId && entry.categoryId === post.categoryId,
  );
  const rest = others.filter((entry) => !sameCategory.includes(entry));
  return [...sameCategory, ...rest].slice(0, limit);
};

/**
 * Posts that link to a given path in their body, e.g. `/services/web-design`.
 *
 * Service pages list these as further reading, so every post that sends a
 * reader to a service page gets a link back from it — the internal links
 * follow the writing, with nothing to configure.
 */
export const postsLinkingTo = (
  data: Partial<PortfolioData> | null | undefined,
  path: string,
  limit = 3,
): Blog[] => {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`\\]\\((?:https?://[^/)]+)?${escaped}(?:[/?#][^)]*)?\\)`);
  return indexablePosts(data)
    .filter((post) => pattern.test(post.content))
    .slice(0, limit);
};
