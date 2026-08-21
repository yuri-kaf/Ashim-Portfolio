import { describe, expect, it } from 'vitest';
import { INITIAL_DATA } from '../constants.js';
import { DEFAULT_DATA } from './defaults.js';
import { publishedBlogs, sanitizePortfolioData } from './sanitize.js';

describe('sanitizePortfolioData', () => {
  it('returns the default shape for unusable input', () => {
    // DEFAULT_DATA, not the seed: if a document is missing everything, the
    // honest answer is empty collections rather than resurrected seed content.
    expect(sanitizePortfolioData(null)).toEqual(DEFAULT_DATA);
    expect(sanitizePortfolioData([1, 2, 3])).toEqual(DEFAULT_DATA);
    expect(sanitizePortfolioData('nope')).toEqual(DEFAULT_DATA);
  });

  it('keeps a valid name and falls back on a non-string name', () => {
    expect(sanitizePortfolioData({ name: 'Someone' }).name).toBe('Someone');
    expect(sanitizePortfolioData({ name: 42 }).name).toBe(DEFAULT_DATA.name);
  });

  it('drops non-object entries from collections', () => {
    const result = sanitizePortfolioData({
      projects: [{ id: '1', title: 'Keep' }, null, 'nope', 7],
    });
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].title).toBe('Keep');
  });

  it('respects an explicitly empty collection', () => {
    // Deleting the last item in the admin has to stick.
    expect(sanitizePortfolioData({ projects: [] }).projects).toEqual([]);
  });

  it('falls back to defaults when a collection is not an array', () => {
    expect(sanitizePortfolioData({ projects: 'nope' }).projects).toEqual(DEFAULT_DATA.projects);
  });

  it('rejects an unknown availability value', () => {
    expect(sanitizePortfolioData({ availability: 'sleeping' }).availability).toBe(
      DEFAULT_DATA.availability,
    );
    expect(sanitizePortfolioData({ availability: 'busy' }).availability).toBe('busy');
  });

  it('keeps only string entries in the vibe philosophy', () => {
    const result = sanitizePortfolioData({
      vibe: { title: 'T', description: 'D', philosophy: ['a', 3, null, 'b'] },
    });
    expect(result.vibe.philosophy).toEqual(['a', 'b']);
  });

  it('gives every item a complete shape even from sparse input', () => {
    const result = sanitizePortfolioData({ projects: [{ title: 'Bare' }] });
    const [project] = result.projects;

    // The admin binds inputs straight to these, so undefined is not acceptable.
    for (const key of [
      'id',
      'slug',
      'subtitle',
      'category',
      'description',
      'image',
      'images',
      'caseStudy',
      'challenge',
      'approach',
      'outcome',
      'results',
      'year',
      'client',
      'role',
      'timeline',
      'services',
      'liveUrl',
      'featured',
    ]) {
      expect(project, key).toHaveProperty(key);
      expect((project as any)[key]).not.toBeUndefined();
    }
  });

  it('backfills a missing id so React keys and admin targeting stay unique', () => {
    const result = sanitizePortfolioData({
      projects: [{ title: 'A' }, { title: 'B' }],
    });
    const ids = result.projects.map((p) => p.id);
    expect(ids[0]).toBeTruthy();
    expect(ids[1]).toBeTruthy();
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('derives a slug from the title when none is given', () => {
    const result = sanitizePortfolioData({
      projects: [{ id: 'p', title: 'Vortex Crypto: Rebrand!' }],
    });
    expect(result.projects[0].slug).toBe('vortex-crypto-rebrand');
  });

  it('prefers an explicit slug over the title', () => {
    const result = sanitizePortfolioData({
      projects: [{ id: 'p', title: 'Ignored', slug: 'chosen-slug' }],
    });
    expect(result.projects[0].slug).toBe('chosen-slug');
  });

  it('treats a post with no published flag as published', () => {
    // Posts written before the flag existed were already live; defaulting to
    // false would silently unpublish them.
    expect(sanitizePortfolioData({ blogs: [{ id: 'b', title: 'T' }] }).blogs[0].published).toBe(
      true,
    );
    expect(
      sanitizePortfolioData({ blogs: [{ id: 'b', title: 'T', published: false }] }).blogs[0]
        .published,
    ).toBe(false);
  });

  it('clamps an unrecognised gallery size', () => {
    expect(sanitizePortfolioData({ gallery: [{ id: 'g', size: 'enormous' }] }).gallery[0].size).toBe(
      'sm',
    );
    expect(sanitizePortfolioData({ gallery: [{ id: 'g', size: 'lg' }] }).gallery[0].size).toBe('lg');
  });

  it('fills site-level sections that the document omits', () => {
    const result = sanitizePortfolioData({ name: 'X' });
    expect(result.contact.email).toBe(DEFAULT_DATA.contact.email);
    expect(result.seo.siteUrl).toBe(DEFAULT_DATA.seo.siteUrl);
    expect(result.pageIntros.works).toBe(DEFAULT_DATA.pageIntros.works);
    expect(result.stats.length).toBeGreaterThan(0);
    expect(result.ticker.length).toBeGreaterThan(0);
    expect(result.disciplines.length).toBe(2);
  });

  it('produces a value that survives a second pass unchanged', () => {
    const once = sanitizePortfolioData({ name: 'Someone', projects: [{ id: 'p', title: 'T' }] });
    expect(sanitizePortfolioData(once)).toEqual(once);
  });

  it('leaves the seeded content complete and idempotent', () => {
    expect(sanitizePortfolioData(INITIAL_DATA)).toEqual(INITIAL_DATA);
    expect(INITIAL_DATA.projects.length).toBeGreaterThan(0);
    expect(INITIAL_DATA.services.every((s) => s.deliverables.length > 0)).toBe(true);
    expect(INITIAL_DATA.process.every((p) => p.iconName.length > 0)).toBe(true);
  });
});

describe('publishedBlogs', () => {
  it('returns only published posts', () => {
    const data = sanitizePortfolioData({
      blogs: [
        { id: 'a', title: 'Live', published: true },
        { id: 'b', title: 'Draft', published: false },
      ],
    });
    expect(publishedBlogs(data).map((b) => b.title)).toEqual(['Live']);
  });
});
