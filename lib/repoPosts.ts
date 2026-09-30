import { REPO_POSTS } from '../content/posts.generated.js';
import { Blog, PortfolioData } from '../types.js';

/**
 * Posts written as Markdown in content/posts/, merged into the content the
 * dashboard edits.
 *
 * The dashboard is still the source of truth. A repo post is a seed: it
 * shows up everywhere a stored post does — the journal, the sitemap, the
 * dashboard's post list — until the first dashboard save writes it into the
 * stored document, and from then on the stored copy wins. A post with the
 * same id or slug in the stored document always wins over the file.
 *
 * So a post can be written and reviewed in a pull request, ship with the
 * deploy, and then be edited, published or unpublished from the dashboard
 * like any other. To retire one, unpublish it there; deleting it in the
 * dashboard while its file still exists would bring the file's copy back.
 */
export const withRepoPosts = (data: PortfolioData, posts: Blog[] = REPO_POSTS): PortfolioData => {
  const stored = data.blogs ?? [];
  const taken = new Set(stored.flatMap((post) => [post.id, post.slug]));
  const extra = posts.filter((post) => !taken.has(post.id) && !taken.has(post.slug));
  return extra.length ? { ...data, blogs: [...stored, ...extra] } : data;
};
