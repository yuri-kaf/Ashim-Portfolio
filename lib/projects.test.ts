import { describe, expect, it } from 'vitest';
import { INITIAL_DATA } from '../constants';
import { Project } from '../types';
import { PROJECT_CONTENT_MINIMUM, isSubstantialProject, projectContentLength } from './projects';

/** Prose of a given length that reads like prose, not like a repeated letter. */
const words = (length: number) =>
  'The brief was a redesign of the booking flow for a Kathmandu operator. '
    .repeat(Math.ceil(length / 70) + 1)
    .slice(0, length)
    // Keeps the *trimmed* length exactly `length`, which the boundary cases
    // below depend on.
    .replace(/\s$/, '.');

const project = (fields: Partial<Project>): Partial<Project> => ({
  id: 'p',
  slug: 'p',
  title: 'A project',
  ...fields,
});

describe('isSubstantialProject', () => {
  it('passes a project with a real case study', () => {
    const real = project({ caseStudy: words(1400), description: 'A booking flow rebuilt.' });
    expect(projectContentLength(real)).toBeGreaterThan(PROJECT_CONTENT_MINIMUM);
    expect(isSubstantialProject(real)).toBe(true);
  });

  it('fails a project whose case study is one sentence', () => {
    const thin = project({
      caseStudy: 'Simplifying blockchain data for the average user using contrast.',
      description: 'Secure digital asset management with high-speed feedback.',
    });
    expect(thin.caseStudy).toHaveLength(64);
    expect(isSubstantialProject(thin)).toBe(false);
  });

  it('passes a project written with challenge/approach/outcome and no caseStudy', () => {
    // The split fields are the newer shape. A project using them leaves
    // caseStudy empty and is no thinner for it, so the gate sums the lot.
    const split = project({
      caseStudy: '',
      challenge: words(250),
      approach: words(250),
      outcome: words(150),
    });
    expect(isSubstantialProject(split)).toBe(true);
  });

  it('does not let a single long field be undercut by empty siblings', () => {
    expect(isSubstantialProject(project({ challenge: words(PROJECT_CONTENT_MINIMUM) }))).toBe(true);
    expect(isSubstantialProject(project({ challenge: words(PROJECT_CONTENT_MINIMUM - 1) }))).toBe(
      false,
    );
  });

  it('counts whitespace-only fields as nothing', () => {
    expect(projectContentLength(project({ caseStudy: '   \n  ', approach: '' }))).toBe(0);
    expect(isSubstantialProject(project({}))).toBe(false);
    expect(isSubstantialProject(null)).toBe(false);
  });

  it('rejects every seeded placeholder project', () => {
    // All five seeds are fictional clients with a one-line case study. None of
    // them belongs in the index until real copy is written; if this ever goes
    // green it is because someone wrote that copy, and the page can be indexed.
    expect(INITIAL_DATA.projects.filter(isSubstantialProject)).toEqual([]);
  });
});
