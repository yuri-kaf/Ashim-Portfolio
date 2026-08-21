/**
 * Turns a title into a URL segment.
 *
 * Deliberately conservative: strips accents, keeps only a-z0-9 and hyphens.
 * Slugs end up in canonical URLs and the sitemap, so they must stay stable and
 * safe rather than clever.
 */
export const slugify = (input: string): string =>
  input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/**
 * A slug that is guaranteed usable: falls back to the title, then the id, so a
 * record can never end up unreachable because its slug field was left blank.
 */
export const resolveSlug = (slug: string, title: string, id: string): string =>
  slugify(slug) || slugify(title) || id;
