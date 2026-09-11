import { describe, expect, it } from 'vitest';
import { INITIAL_DATA } from '../constants';
import { sanitizePortfolioData } from './sanitize';
import { ownedServices, pointerServices } from './services';

const withServices = (services: unknown[]) =>
  sanitizePortfolioData({ ...INITIAL_DATA, services });

describe('ownedServices / pointerServices', () => {
  it('gives the seeded content exactly three owned pages and three pointers', () => {
    expect(ownedServices(INITIAL_DATA).map((s) => s.slug)).toEqual([
      'web-design',
      'branding',
      'motion-animation',
    ]);
    expect(pointerServices(INITIAL_DATA).map((s) => s.externalUrl)).toEqual([
      'https://limicreatives.com/services/seo',
      'https://limicreatives.com/services/content-creation',
      'https://limicreatives.com/services/paid-advertising',
    ]);
  });

  it('puts a page-mode service with an empty body in neither list', () => {
    // No file and no sitemap entry get written for it, so linking it anywhere
    // would be a link to a page that only exists as an SPA 200.
    const data = withServices([
      { id: 'x', slug: 'seo-content', title: 'SEO Content', mode: 'page', body: '   ' },
    ]);
    expect(ownedServices(data)).toEqual([]);
    expect(pointerServices(data)).toEqual([]);
  });

  it('excludes an unpublished page-mode service', () => {
    const data = withServices([
      { id: 'x', slug: 'draft', title: 'Draft', mode: 'page', body: 'Real copy.', published: false },
    ]);
    expect(ownedServices(data)).toEqual([]);
  });

  it('treats a service saved before `published` existed as published', () => {
    const data = withServices([
      { id: 'x', slug: 'legacy', title: 'Legacy', mode: 'page', body: 'Real copy.' },
    ]);
    expect(ownedServices(data).map((s) => s.slug)).toEqual(['legacy']);
  });

  it('excludes a pointer with no externalUrl, end to end', () => {
    // sanitize already demotes it to 'page'; with no body it then falls out of
    // the owned list too, so it renders nowhere rather than as a dead card.
    const data = withServices([
      { id: 'x', slug: 'nowhere', title: 'Nowhere', mode: 'pointer', externalUrl: '  ' },
    ]);
    expect(data.services[0].mode).toBe('page');
    expect(pointerServices(data)).toEqual([]);
    expect(ownedServices(data)).toEqual([]);
  });
});
