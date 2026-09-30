import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { INITIAL_DATA } from '../constants';
import { REPO_POSTS } from '../content/posts.generated';
import { Blog } from '../types';
import { POST_CONTENT_MINIMUM } from './posts';
import { resolvePage } from './pageMeta';
import { withRepoPosts } from './repoPosts';
import { TITLE_LIMIT, composeTitle } from './titles';

const post = (extra: Partial<Blog>): Blog => ({ ...REPO_POSTS[0], ...extra });

describe('withRepoPosts', () => {
  it('adds the repo posts a stored document does not have', () => {
    const merged = withRepoPosts({ ...INITIAL_DATA, blogs: [] });
    expect(merged.blogs.map((entry) => entry.slug).sort()).toEqual(REPO_POSTS.map((entry) => entry.slug).sort());
  });

  it('lets the stored copy win, matched by id or by slug', () => {
    const edited = post({ title: 'Edited in the dashboard', published: false });
    const bySlug = post({ id: 'dashboard-id', title: 'Same slug, new id' });
    expect(withRepoPosts({ ...INITIAL_DATA, blogs: [edited] }, [REPO_POSTS[0]]).blogs).toEqual([edited]);
    expect(withRepoPosts({ ...INITIAL_DATA, blogs: [bySlug] }, [REPO_POSTS[0]]).blogs).toEqual([bySlug]);
  });

  it('returns the document untouched when there is nothing to add', () => {
    const data = { ...INITIAL_DATA, blogs: REPO_POSTS };
    expect(withRepoPosts(data)).toBe(data);
  });
});

describe('content/posts.generated.ts', () => {
  it('is up to date with content/posts/*.md', async () => {
    const { compile } = await import('../scripts/compile-posts.mjs');
    const committed = readFileSync('content/posts.generated.ts', 'utf8').replace(/\r\n/g, '\n');
    expect(committed, 'run `npm run posts`').toBe(await compile());
  });
});

describe('each repo post', () => {
  const categories = new Set(INITIAL_DATA.blogCategories.map((category) => category.id));
  // The UI/UX pricing post was written in the dashboard, so it lives in the
  // stored document and not in the seed. Stand it in here so links to it
  // resolve the way they do on the live site.
  const livePost = post({
    id: 'live-ui-ux-cost',
    slug: 'ui-ux-in-nepal-what-it-actually-costs',
    published: true,
    categoryId: 'design',
  });
  const data = withRepoPosts({ ...INITIAL_DATA, blogs: [...INITIAL_DATA.blogs, livePost] });

  for (const entry of REPO_POSTS) {
    describe(entry.slug, () => {
      it('fits a results page', () => {
        expect(composeTitle(INITIAL_DATA.seo, entry.seoTitle).length).toBeLessThanOrEqual(TITLE_LIMIT);
        expect(entry.metaDescription.length).toBeGreaterThan(100);
        expect(entry.metaDescription.length).toBeLessThanOrEqual(160);
        expect(entry.excerpt.trim()).not.toBe('');
      });

      it('is long enough to be indexed and files under a real category', () => {
        expect(entry.content.length).toBeGreaterThan(POST_CONTENT_MINIMUM);
        expect(categories.has(entry.categoryId)).toBe(true);
      });

      it('does not repeat its title as a heading in the body', () => {
        expect(entry.content.startsWith('# ')).toBe(false);
      });

      it('links to a service page and to /contact', () => {
        expect(entry.content).toMatch(/\]\(\/services\/(web-design|branding|motion-animation)\)/);
        expect(entry.content).toMatch(/\]\(\/contact\)/);
      });

      it('only links to pages that exist here', () => {
        const internal = [...entry.content.matchAll(/\]\((\/[^)\s#?]*)/g)].map((match) => match[1]);
        for (const path of internal) {
          expect(resolvePage(data, path), `${entry.slug} → ${path}`).not.toBeNull();
        }
      });

      if (entry.published) {
        it('links only to posts that are published too', () => {
          const posts = [...entry.content.matchAll(/\]\(\/blog\/([^)/\s#?]+)\)/g)].map((match) => match[1]);
          for (const slug of posts) {
            const target = data.blogs.find((candidate) => candidate.slug === slug);
            expect(target?.published, `${entry.slug} links to draft ${slug}`).not.toBe(false);
          }
        });
      }
    });
  }
});
