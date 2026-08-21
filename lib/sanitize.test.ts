import { describe, expect, it } from 'vitest';
import { INITIAL_DATA } from '../constants';
import { sanitizePortfolioData } from './sanitize';

describe('sanitizePortfolioData', () => {
  it('returns defaults for null', () => {
    expect(sanitizePortfolioData(null)).toEqual(INITIAL_DATA);
  });

  it('returns defaults for an array', () => {
    expect(sanitizePortfolioData([1, 2, 3])).toEqual(INITIAL_DATA);
  });

  it('keeps a valid name and falls back on a non-string name', () => {
    expect(sanitizePortfolioData({ name: 'Someone' }).name).toBe('Someone');
    expect(sanitizePortfolioData({ name: 42 }).name).toBe(INITIAL_DATA.name);
  });

  it('drops non-object entries from collections', () => {
    const result = sanitizePortfolioData({
      projects: [{ id: '1', title: 'Keep' }, null, 'nope', 7],
    });
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].title).toBe('Keep');
  });

  it('falls back to defaults when a collection is not an array', () => {
    expect(sanitizePortfolioData({ projects: 'nope' }).projects).toEqual(
      INITIAL_DATA.projects,
    );
  });

  it('rejects an unknown availability value', () => {
    expect(sanitizePortfolioData({ availability: 'sleeping' }).availability).toBe(
      INITIAL_DATA.availability,
    );
    expect(sanitizePortfolioData({ availability: 'busy' }).availability).toBe('busy');
  });

  it('keeps only string entries in the vibe philosophy', () => {
    const result = sanitizePortfolioData({
      vibe: { title: 'T', description: 'D', philosophy: ['a', 3, null, 'b'] },
    });
    expect(result.vibe.philosophy).toEqual(['a', 'b']);
  });

  it('coerces social entries and drops unusable ones', () => {
    const result = sanitizePortfolioData({
      social: [
        { id: 'x', label: 'X', url: 'https://x.com/a' },
        { id: 'y', label: 'Y' },
        { label: 'no id', url: 'https://z.com' },
        null,
      ],
    });
    expect(result.social).toEqual([
      { id: 'x', label: 'X', url: 'https://x.com/a' },
      { id: 'y', label: 'Y', url: '' },
    ]);
  });

  it('produces a value that survives a second pass unchanged', () => {
    const once = sanitizePortfolioData({ name: 'Someone', projects: [] });
    expect(sanitizePortfolioData(once)).toEqual(once);
  });
});
