import { Project } from '../types.js';

/**
 * The one place that decides which case studies are substantial enough to be
 * indexed.
 *
 * This is a sibling of lib/services.ts rather than another export inside it:
 * that file answers "which services does this domain own a page for", a
 * question about `mode` and the two-site split. This one answers "does this
 * case study carry enough writing to deserve a place in the index", which is
 * a content-quality question about a different type. One file, one question.
 *
 * Deliberately not a list of slugs. Naming the five seeded placeholders would
 * rot the moment one is renamed or a sixth is added; a gate on the prose is
 * true for whatever the projects happen to be called.
 */

/**
 * Minimum characters of written case-study prose a project needs before it is
 * indexable.
 *
 * 600 characters is roughly two full paragraphs — short for a case study, but
 * unambiguously past the point where a page is only a title, a stock photo and
 * a single sentence. The seeded placeholders carry 60–80 characters each and
 * produce pages with under 200 characters of visible text; five of those in
 * the index is a site-quality signal that drags down the pages meant to rank.
 * The threshold is a floor for "someone actually wrote this", not a target.
 */
export const PROJECT_CONTENT_MINIMUM = 600;

/** Every long-form field a project can carry prose in. */
const contentFields: Array<keyof Project> = [
  'caseStudy',
  'challenge',
  'approach',
  'outcome',
  'description',
];

/**
 * Total characters of written content across a project's long-form fields.
 *
 * Summed rather than taken from `caseStudy` alone: a project written with the
 * split fields (challenge / approach / outcome) leaves `caseStudy` empty and
 * is no thinner for it.
 */
export const projectContentLength = (project: Partial<Project> | null | undefined): number =>
  contentFields.reduce((total, field) => {
    const value = project?.[field];
    return total + (typeof value === 'string' ? value.trim().length : 0);
  }, 0);

/**
 * Whether a project has enough written content to be worth indexing.
 *
 * A project failing this still gets its page and its links — it is reachable,
 * and it is linked from /works — it just carries `noindex, follow` and stays
 * out of sitemap.xml until real copy is written. `follow` is the point: the
 * links out of a thin page are still worth crawling.
 */
export const isSubstantialProject = (project: Partial<Project> | null | undefined): boolean =>
  Boolean(project) && projectContentLength(project) >= PROJECT_CONTENT_MINIMUM;
