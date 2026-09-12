import { describe, expect, it } from 'vitest';
import { INITIAL_DATA } from '../constants';
import { PortfolioData } from '../types';
import { PROJECT_CONTENT_MINIMUM } from './projects';
import { contentIssues } from './contentHealth';

/** Enough prose to clear the indexing threshold, so a fixture project is not
 *  flagged as thin unless the test means it to be. */
const SUBSTANTIAL = 'x'.repeat(PROJECT_CONTENT_MINIMUM);

/**
 * A document with nothing wrong with it.
 *
 * Built from empty collections rather than from INITIAL_DATA: the seeded
 * content is deliberately imperfect (five placeholder case studies), so using
 * it as the clean baseline would bake today's seed bugs into the expectation.
 */
const clean = (overrides: Partial<PortfolioData> = {}): PortfolioData =>
  ({
    ...INITIAL_DATA,
    projects: [],
    services: [],
    blogs: [],
    blogCategories: [],
    social: [{ id: 's1', label: 'Instagram', url: 'https://instagram.com/ashim' }],
    seo: { ...INITIAL_DATA.seo, geo: { ...INITIAL_DATA.seo.geo, city: 'Kathmandu' } },
    ...overrides,
  }) as PortfolioData;

const ids = (data: PortfolioData) => contentIssues(data).map((issue) => issue.id);

describe('contentIssues', () => {
  it('finds nothing wrong with a clean document', () => {
    expect(contentIssues(clean())).toEqual([]);
  });

  it('lists every blocking issue before any warning', () => {
    const data = clean({
      services: [{ id: 'sv1', title: 'Web Design', mode: 'page', published: true, body: '' }],
      social: [{ id: 's1', label: 'Dribbble', url: '' }],
    } as Partial<PortfolioData>);
    const severities = contentIssues(data).map((issue) => issue.severity);
    expect(severities).toEqual([...severities].sort((a, b) => (a === b ? 0 : a === 'blocking' ? -1 : 1)));
    expect(severities[0]).toBe('blocking');
  });

  describe('services', () => {
    it('blocks a published page-mode service with an empty body', () => {
      const data = clean({
        services: [{ id: 'sv1', title: 'Web Design', mode: 'page', published: true, body: '   ' }],
      } as Partial<PortfolioData>);
      const [issue] = contentIssues(data);
      expect(issue.severity).toBe('blocking');
      expect(issue.section).toBe('services');
      expect(issue.message).toContain('Web Design');
    });

    it('leaves an unpublished page-mode service alone', () => {
      const data = clean({
        services: [{ id: 'sv1', title: 'Web Design', mode: 'page', published: false, body: '' }],
      } as Partial<PortfolioData>);
      expect(contentIssues(data)).toEqual([]);
    });

    it('blocks a pointer service with nowhere to point', () => {
      const data = clean({
        services: [{ id: 'sv1', title: 'SEO', mode: 'pointer', published: true, externalUrl: '' }],
      } as Partial<PortfolioData>);
      const [issue] = contentIssues(data);
      expect(issue.severity).toBe('blocking');
      expect(issue.section).toBe('services');
      expect(issue.message).toContain('SEO');
    });

    it('warns on a service SEO title over 60 characters', () => {
      const data = clean({
        services: [
          {
            id: 'sv1',
            title: 'Branding',
            mode: 'page',
            published: true,
            body: 'Real copy.',
            seoTitle: 'B'.repeat(61),
          },
        ],
      } as Partial<PortfolioData>);
      const [issue] = contentIssues(data);
      expect(issue.severity).toBe('warning');
      expect(issue.section).toBe('services');
      expect(issue.message).toContain('61');
    });
  });

  describe('posts', () => {
    const category = { id: 'c1', slug: 'nepal', title: 'The Nepal Market', description: '' };
    const post = (extra: Record<string, unknown>) => ({
      id: 'p1',
      slug: 'a-post',
      title: 'A Post',
      published: true,
      categoryId: 'c1',
      metaDescription: 'A perfectly ordinary description of the post.',
      ...extra,
    });

    it('blocks a published post with no category', () => {
      const data = clean({
        blogCategories: [category],
        blogs: [post({ categoryId: '' })],
        // The category itself would otherwise warn about having no posts.
      } as unknown as Partial<PortfolioData>);
      const blocking = contentIssues(data).filter((i) => i.severity === 'blocking');
      expect(blocking).toHaveLength(1);
      expect(blocking[0].section).toBe('blogs');
      expect(blocking[0].message).toContain('A Post');
    });

    it('blocks a published post filed under a category that no longer exists', () => {
      const data = clean({
        blogCategories: [],
        blogs: [post({ categoryId: 'gone' })],
      } as unknown as Partial<PortfolioData>);
      const blocking = contentIssues(data).filter((i) => i.severity === 'blocking');
      expect(blocking).toHaveLength(1);
      expect(blocking[0].message).toContain('A Post');
    });

    it('ignores a draft post', () => {
      const data = clean({
        blogCategories: [],
        blogs: [post({ published: false, categoryId: '', metaDescription: '' })],
      } as unknown as Partial<PortfolioData>);
      expect(contentIssues(data)).toEqual([]);
    });

    it('warns on a published post with no meta description', () => {
      const data = clean({
        blogCategories: [category],
        blogs: [post({ metaDescription: '' })],
      } as unknown as Partial<PortfolioData>);
      const warnings = contentIssues(data).filter((i) => i.severity === 'warning');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].section).toBe('blogs');
      expect(warnings[0].message).toContain('A Post');
    });

    it('warns on a meta description over 160 characters', () => {
      const data = clean({
        blogCategories: [category],
        blogs: [post({ metaDescription: 'd'.repeat(161) })],
      } as unknown as Partial<PortfolioData>);
      const warnings = contentIssues(data).filter((i) => i.severity === 'warning');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('161');
    });

    it('warns on a post SEO title over 60 characters', () => {
      const data = clean({
        blogCategories: [category],
        blogs: [post({ seoTitle: 'T'.repeat(61) })],
      } as unknown as Partial<PortfolioData>);
      const warnings = contentIssues(data).filter((i) => i.severity === 'warning');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('61');
    });
  });

  describe('categories', () => {
    it('warns on a category with no published posts', () => {
      const data = clean({
        blogCategories: [{ id: 'c1', slug: 'nepal', title: 'The Nepal Market', description: '' }],
        blogs: [],
      } as unknown as Partial<PortfolioData>);
      const [issue] = contentIssues(data);
      expect(issue.severity).toBe('warning');
      expect(issue.section).toBe('blogCategories');
      expect(issue.message).toContain('The Nepal Market');
    });

    it('does not count a draft post towards a category', () => {
      const data = clean({
        blogCategories: [{ id: 'c1', slug: 'nepal', title: 'The Nepal Market', description: '' }],
        blogs: [{ id: 'p1', title: 'Draft', published: false, categoryId: 'c1' }],
      } as unknown as Partial<PortfolioData>);
      const warnings = contentIssues(data).filter((i) => i.section === 'blogCategories');
      expect(warnings).toHaveLength(1);
    });
  });

  describe('projects', () => {
    it('blocks a project below the indexing threshold and says how much is missing', () => {
      const data = clean({
        projects: [{ id: 'pr1', title: 'Thin Study', description: 'Short.' }],
      } as unknown as Partial<PortfolioData>);
      const [issue] = contentIssues(data);
      expect(issue.severity).toBe('blocking');
      expect(issue.section).toBe('projects');
      expect(issue.message).toContain('Thin Study');
      expect(issue.message).toContain('not indexed');
      expect(issue.message).toMatch(/\d+ more characters/);
    });

    it('leaves a substantial project alone', () => {
      const data = clean({
        projects: [{ id: 'pr1', title: 'Real Study', caseStudy: SUBSTANTIAL }],
      } as unknown as Partial<PortfolioData>);
      expect(contentIssues(data)).toEqual([]);
    });
  });

  describe('profile', () => {
    it('warns on a social link with an empty URL', () => {
      const data = clean({ social: [{ id: 's1', label: 'Dribbble', url: '  ' }] } as Partial<PortfolioData>);
      const [issue] = contentIssues(data);
      expect(issue.severity).toBe('warning');
      expect(issue.section).toBe('social');
      expect(issue.message).toContain('Dribbble');
    });

    it('warns when the geo city is empty', () => {
      const data = clean();
      data.seo = { ...data.seo, geo: { ...data.seo.geo, city: '' } };
      const [issue] = contentIssues(data);
      expect(issue.severity).toBe('warning');
      expect(issue.section).toBe('profile');
      expect(issue.message.toLowerCase()).toContain('city');
    });
  });

  it('gives every issue a unique id', () => {
    const data = clean({
      projects: [
        { id: 'pr1', title: 'One', description: '' },
        { id: 'pr2', title: 'Two', description: '' },
      ],
      social: [
        { id: 's1', label: 'A', url: '' },
        { id: 's2', label: 'B', url: '' },
      ],
    } as unknown as Partial<PortfolioData>);
    const all = ids(data);
    expect(new Set(all).size).toBe(all.length);
  });

  it('survives a document with collections missing entirely', () => {
    expect(() => contentIssues({} as PortfolioData)).not.toThrow();
  });
});
