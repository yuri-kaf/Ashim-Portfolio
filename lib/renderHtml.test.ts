import { describe, expect, it } from 'vitest';
import { INITIAL_DATA } from '../constants';
import { PortfolioData } from '../types';
import { isoDate, byNewest } from './dates';
import { markdownToHtml } from './markdownHtml';
import { resolvePage, summarise } from './pageMeta';
import { POST_CONTENT_MINIMUM, indexablePosts, postsLinkingTo } from './posts';
import { renderDocument, renderRoute, sitemapXml } from './renderHtml';

const SHELL = `<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- built 2026-10-01 -->
    <title>Ashim Kafle</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

const LONG = `# The heading

${'A real paragraph of writing about websites in Nepal. '.repeat(40)}

See [the web design service](/services/web-design) for more.`;

/** The live document on 2026-10-01, reduced: one real post and the two seed placeholders. */
const withPosts = (): PortfolioData => ({
  ...INITIAL_DATA,
  blogs: [
    {
      ...INITIAL_DATA.blogs[0],
      id: 'real',
      slug: 'ui-ux-in-nepal-what-it-actually-costs',
      title: 'UI/UX in Nepal: What It Actually Costs',
      excerpt: '',
      content: LONG,
      date: 'Sept 14, 2026',
      published: true,
      seoTitle: 'UI/UX Design Cost in Nepal',
      metaDescription: '',
      categoryId: 'design',
    },
    ...INITIAL_DATA.blogs,
    {
      ...INITIAL_DATA.blogs[0],
      id: 'draft',
      slug: 'a-draft',
      title: 'A draft',
      content: LONG,
      published: false,
    },
  ],
});

const canonicalOf = (tags: string[]) =>
  tags.find((tag) => tag.startsWith('<link rel="canonical"'))?.match(/href="([^"]+)"/)?.[1];

describe('dates', () => {
  it('turns hand-typed dates into ISO without shifting the day', () => {
    expect(isoDate('Sept 14, 2026')).toBe('2026-09-14');
    expect(isoDate('Oct 12, 2024')).toBe('2024-10-12');
    expect(isoDate('2026-09-14')).toBe('2026-09-14');
    expect(isoDate('soon')).toBeNull();
    expect(isoDate('')).toBeNull();
  });

  it('sorts newest first and undated last', () => {
    const sorted = byNewest([{ date: 'Oct 12, 2024' }, { date: '' }, { date: 'Sept 14, 2026' }]);
    expect(sorted.map((entry) => entry.date)).toEqual(['Sept 14, 2026', 'Oct 12, 2024', '']);
  });
});

describe('renderRoute', () => {
  it('gives a post published after the deploy its own title and canonical', () => {
    // The bug: this URL was served the home page's HTML and canonical.
    const page = renderRoute(withPosts(), '/blog/ui-ux-in-nepal-what-it-actually-costs');
    expect(page.status).toBe(200);
    expect(page.title).toBe('UI/UX Design Cost in Nepal | Ashim Kafle');
    expect(canonicalOf(page.headTags)).toBe(
      'https://www.ashimkafle.com.np/blog/ui-ux-in-nepal-what-it-actually-costs',
    );
    expect(page.noindex).toBe(false);
    expect(page.body).toContain('<h1>UI/UX in Nepal: What It Actually Costs</h1>');
    // The body's own "# heading" is demoted, never a second h1.
    expect(page.body.match(/<h1>/g)).toHaveLength(1);
  });

  it('answers 404 for a path that does not exist, instead of the home page', () => {
    const page = renderRoute(withPosts(), '/nonexistent-page');
    expect(page.status).toBe(404);
    expect(page.noindex).toBe(true);
    expect(canonicalOf(page.headTags)).toBeUndefined();
  });

  it('keeps the seed placeholders reachable but out of the index', () => {
    const page = renderRoute(withPosts(), '/blog/the-future-of-minimalist-design');
    expect(page.status).toBe(200);
    expect(page.noindex).toBe(true);
    expect(page.headTags).toContain('<meta name="robots" content="noindex, follow" />');
  });

  it('keeps drafts previewable and out of the index', () => {
    const page = renderRoute(withPosts(), '/blog/a-draft');
    expect(page.status).toBe(200);
    expect(page.noindex).toBe(true);
  });

  it('gives a pointer service no page on this domain', () => {
    expect(renderRoute(INITIAL_DATA, '/services/seo').status).toBe(404);
    expect(renderRoute(INITIAL_DATA, '/services/web-design').status).toBe(200);
  });

  it('writes ISO dates into the schema, whatever was typed', () => {
    const page = renderRoute(withPosts(), '/blog/ui-ux-in-nepal-what-it-actually-costs');
    const json = page.headTags.find((tag) => tag.includes('application/ld+json'))!;
    expect(json).toContain('"datePublished":"2026-09-14"');
    expect(json).not.toContain('Sept 14');
  });

  it('describes a post with no excerpt or meta from its first paragraph', () => {
    const page = renderRoute(withPosts(), '/blog/ui-ux-in-nepal-what-it-actually-costs');
    const description = page.headTags.find((tag) => tag.startsWith('<meta name="description"'))!;
    expect(description).toContain('A real paragraph of writing');
    expect(description.length).toBeLessThan(220);
  });

  it('cannot be broken out of by a post body', () => {
    const data = withPosts();
    data.blogs[0].content = `${LONG}\n\n</script><script>alert(1)</script>`;
    data.blogs[0].title = 'Title </script><img src=x onerror=alert(1)>';
    const page = renderRoute(data, '/blog/ui-ux-in-nepal-what-it-actually-costs');
    const html = renderDocument(SHELL, page);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<img src=x');
  });

  it('puts the what-and-where line and the newest real posts on the home page', () => {
    const page = renderRoute(withPosts(), '/');
    expect(page.title).toBe('Ashim Kafle — Product Designer & Digital Marketer in Nepal');
    expect(page.body).toContain('Product Designer &amp; Digital Marketer — Kathmandu, Nepal');
    expect(page.body).toContain('/blog/ui-ux-in-nepal-what-it-actually-costs');
    expect(page.body).not.toContain('/blog/the-future-of-minimalist-design');
    expect(page.body).toContain('href="/services/web-design"');
  });

  it('links a service page back to the posts that link to it', () => {
    const page = renderRoute(withPosts(), '/services/web-design');
    expect(page.body).toContain('Further reading');
    expect(page.body).toContain('/blog/ui-ux-in-nepal-what-it-actually-costs');
  });

  it('marks /about up as the profile of the person', () => {
    const page = renderRoute(INITIAL_DATA, '/about');
    const json = page.headTags.find((tag) => tag.includes('application/ld+json'))!;
    expect(json).toContain('"@type":"ProfilePage"');
    expect(json).toContain('"@type":"WebSite"');
  });

  it('resolves every route App.tsx declares', () => {
    for (const path of ['/', '/about', '/contact', '/services', '/works', '/blog', '/gallery', '/vibe', '/dashboard']) {
      expect(resolvePage(INITIAL_DATA, path), path).not.toBeNull();
    }
    expect(resolvePage(INITIAL_DATA, '/blog/category/design')).not.toBeNull();
    expect(resolvePage(INITIAL_DATA, '/blog/category/nope')).toBeNull();
    expect(resolvePage(INITIAL_DATA, '/works/vortex-crypto')).not.toBeNull();
  });
});

describe('renderDocument', () => {
  it('replaces the title, adds the head tags and fills #root', () => {
    const html = renderDocument(SHELL, renderRoute(INITIAL_DATA, '/about'));
    expect(html).toContain('<title>Ashim Kafle — Co-founder &amp; CMO of Limi Creatives</title>');
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain('<link rel="canonical" href="https://www.ashimkafle.com.np/about" />');
    expect(html).toMatch(/<div id="root"><h1>/);
  });

  it('strips a canonical an older shell still carries', () => {
    const old = SHELL.replace('</head>', '<link rel="canonical" href="https://www.ashimkafle.com.np/" />\n</head>');
    const html = renderDocument(old, renderRoute(INITIAL_DATA, '/contact'));
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
    expect(html).toContain('href="https://www.ashimkafle.com.np/contact"');
  });
});

describe('sitemapXml', () => {
  it('lists a post published after the deploy and leaves placeholders and drafts out', () => {
    const xml = sitemapXml(withPosts(), '2026-10-01');
    expect(xml).toContain('<loc>https://www.ashimkafle.com.np/blog/ui-ux-in-nepal-what-it-actually-costs</loc>');
    expect(xml).toContain('<lastmod>2026-09-14</lastmod>');
    expect(xml).not.toContain('the-future-of-minimalist-design');
    expect(xml).not.toContain('a-draft');
    // Five thin seed case studies stay out too.
    expect(xml).not.toContain('/works/');
  });

  it('lists a category only once it holds a post worth indexing', () => {
    const xml = sitemapXml(withPosts(), '2026-10-01');
    expect(xml).toContain('/blog/category/design');
    expect(xml).not.toContain('/blog/category/branding');
  });
});

describe('posts', () => {
  it('indexes a post only past the writing floor', () => {
    const data = withPosts();
    expect(indexablePosts(data).map((post) => post.id)).toEqual(['real']);
    expect(LONG.length).toBeGreaterThan(POST_CONTENT_MINIMUM);
  });

  it('finds the posts that link to a path, and only that path', () => {
    const data = withPosts();
    expect(postsLinkingTo(data, '/services/web-design').map((post) => post.id)).toEqual(['real']);
    expect(postsLinkingTo(data, '/services/web')).toEqual([]);
  });

  it('summarises a body from its first real paragraph', () => {
    expect(summarise('# Title\n\n| a | b |\n|---|---|\n\nFirst [real](/x) **paragraph**.')).toBe(
      'First real paragraph.',
    );
  });
});

describe('markdownToHtml', () => {
  it('renders tables, ordered lists and demoted headings', () => {
    const html = markdownToHtml('# One\n\n| Type | Price |\n|---|---|\n| Site | NPR 1 |\n\n1. First\n2. Second');
    expect(html).toContain('<h2>One</h2>');
    expect(html).toContain('<table><thead><tr><th>Type</th><th>Price</th></tr></thead><tbody><tr><td>Site</td><td>NPR 1</td></tr></tbody></table>');
    expect(html).toContain('<ol><li>First</li><li>Second</li></ol>');
  });

  it('marks the Nepali paragraphs of a bilingual post, and only those', () => {
    const html = markdownToHtml('Facebook मा post boost गर्नु मात्र डिजिटल मार्केटिङ होइन।\n\nBoosting a post is one small tool.');
    expect(html).toContain('<p lang="ne">Facebook मा post boost');
    expect(html).toContain('<p>Boosting a post');
  });

  it('drops a javascript: link but keeps its text', () => {
    expect(markdownToHtml('[click](javascript:alert(1))')).not.toContain('href');
  });
});
