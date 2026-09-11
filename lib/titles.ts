import { PortfolioData, SeoDefaults } from '../types';

/**
 * The one place a page's <title> is composed.
 *
 * Two rules, and both used to be broken on the pages that matter most:
 *
 * 1. An empty title fell through to `seo.siteName`, which shipped the bare
 *    "Ashim Kafle" on the priority-1.0 home page — no keyword in it at all.
 * 2. Every non-empty title got `seo.titleSuffix` (" | Ashim Kafle") appended
 *    unconditionally, which turned "About Ashim Kafle" into "About Ashim
 *    Kafle | Ashim Kafle" on the one page this restructure exists to rank for
 *    his name.
 *
 * A title that already carries the name is *exact*: it takes no suffix. The
 * prerenderer and components/Seo.tsx both read this file, so the static HTML
 * and the runtime head cannot disagree.
 */

/** Google truncates a title past roughly 60 characters. */
export const TITLE_LIMIT = 60;

/**
 * Appends the site suffix to a page title. `exact` wins outright and is
 * emitted verbatim — use it for any title that already names the person.
 */
export const composeTitle = (
  seo: SeoDefaults,
  title?: string,
  exact?: string,
): string => {
  if (exact?.trim()) return exact.trim();
  return title?.trim() ? `${title.trim()}${seo.titleSuffix}` : seo.siteName;
};

/** "Ashim Kafle — Product Designer & Digital Marketer" (48 chars). */
export const homeTitle = (data: PortfolioData): string =>
  data.role?.trim() ? `${data.name} — ${data.role}` : data.name;

/**
 * "Ashim Kafle — Co-founder & CMO of Limi Creatives" (48 chars).
 *
 * The founder claim is the whole point of /about, so it belongs in the title
 * rather than the name twice. Falls back to the home shape when the company
 * fields are blank — never to a title asserting a role that isn't in the data.
 */
export const aboutTitle = (data: PortfolioData): string => {
  const role = data.company?.role?.trim();
  const company = data.company?.name?.trim();
  return role && company ? `${data.name} — ${role} of ${company}` : homeTitle(data);
};
