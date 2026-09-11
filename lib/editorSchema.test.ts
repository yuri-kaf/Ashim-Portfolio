import { describe, expect, it } from 'vitest';
import { INITIAL_DATA } from '../constants.js';
import { COLLECTIONS } from './editorSchema.js';

describe('collection specs', () => {
  it('covers every editable collection', () => {
    expect(COLLECTIONS.map((c) => c.key).sort()).toEqual(
      [
        'blogCategories',
        'blogs',
        'disciplines',
        'gallery',
        'process',
        'projects',
        'services',
        'social',
        'stats',
        'tools',
      ].sort(),
    );
  });

  it('names only fields that exist on the seeded data', () => {
    for (const spec of COLLECTIONS) {
      const sample = (INITIAL_DATA as any)[spec.key][0];
      if (!sample) continue;
      for (const field of spec.fields) {
        expect(Object.keys(sample), `${spec.key}.${field.key}`).toContain(field.key);
      }
    }
  });

  it('gives every collection a label and a title field', () => {
    for (const spec of COLLECTIONS) {
      expect(spec.label.length).toBeGreaterThan(0);
      expect(spec.fields.some((f) => f.key === spec.titleField)).toBe(true);
    }
  });
});

describe('service pages are rankable', () => {
  const pages = INITIAL_DATA.services.filter((service) => service.mode === 'page');

  it('owns exactly the three services Limi Creatives has no page for', () => {
    expect(pages.map((service) => service.slug).sort()).toEqual([
      'branding', 'motion-animation', 'web-design',
    ]);
  });

  it('gives every owned page a substantial body and FAQs', () => {
    for (const service of pages) {
      expect(service.slug, `${service.title} slug`).toMatch(/^[a-z0-9-]+$/);
      expect(service.body.split(/\s+/).length, `${service.title} body`).toBeGreaterThan(400);
      expect(service.faqs.length, `${service.title} faqs`).toBeGreaterThanOrEqual(3);
      expect(service.seoTitle.length, `${service.title} seoTitle`).toBeLessThanOrEqual(60);
      expect(service.metaDescription.length, `${service.title} meta`).toBeLessThanOrEqual(160);
    }
  });

  it('points the other three at Limi Creatives', () => {
    const pointers = INITIAL_DATA.services.filter((service) => service.mode === 'pointer');
    expect(pointers).toHaveLength(3);
    for (const service of pointers) {
      expect(service.externalUrl, `${service.title} destination`)
        .toMatch(/^https:\/\/limicreatives\.com\/services\//);
    }
  });

  it('gives every seeded post a category that exists', () => {
    const ids = new Set(INITIAL_DATA.blogCategories.map((category) => category.id));
    for (const post of INITIAL_DATA.blogs) {
      expect(ids.has(post.categoryId), `${post.title} category`).toBe(true);
    }
  });
});
