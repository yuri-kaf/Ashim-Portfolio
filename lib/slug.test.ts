import { describe, expect, it } from 'vitest';
import { resolveSlug, slugify } from './slug.js';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('The Future of Design')).toBe('the-future-of-design');
  });

  it('drops punctuation rather than encoding it', () => {
    expect(slugify('Why Red is the Colour of 2025!')).toBe('why-red-is-the-colour-of-2025');
    expect(slugify('Design: a study (part 2)')).toBe('design-a-study-part-2');
  });

  it('removes apostrophes without leaving a gap', () => {
    expect(slugify("Designer's notes")).toBe('designers-notes');
    expect(slugify('Designer’s notes')).toBe('designers-notes');
  });

  it('strips accents', () => {
    expect(slugify('Café Motión')).toBe('cafe-motion');
  });

  it('never starts or ends with a hyphen', () => {
    expect(slugify('  — hello —  ')).toBe('hello');
    expect(slugify('!!!')).toBe('');
  });

  it('caps length so slugs stay usable in a URL', () => {
    expect(slugify('a'.repeat(200)).length).toBe(80);
  });
});

describe('resolveSlug', () => {
  it('prefers an explicit slug', () => {
    expect(resolveSlug('chosen', 'A Title', 'id-1')).toBe('chosen');
  });

  it('falls back to the title', () => {
    expect(resolveSlug('', 'A Title', 'id-1')).toBe('a-title');
  });

  it('falls back to the id when the title yields nothing', () => {
    // Otherwise a record whose title is only punctuation becomes unreachable.
    expect(resolveSlug('', '!!!', 'id-1')).toBe('id-1');
    expect(resolveSlug('', '', 'id-1')).toBe('id-1');
  });

  it('normalises a messy explicit slug', () => {
    expect(resolveSlug('My Slug!', 'Title', 'id')).toBe('my-slug');
  });
});
