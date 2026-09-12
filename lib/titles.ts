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

/**
 * "Contact — Web Designer in Kathmandu" (35 chars).
 *
 * `Contact ${name}` plus the " | Ashim Kafle" suffix shipped "Contact Ashim
 * Kafle | Ashim Kafle" — the name twice and not one word of local intent on
 * the page a local search is most likely to land on. The city carries the
 * query instead, and it matches the page's own h1 ("Hire a web designer in
 * Kathmandu."), so the title promises nothing the page does not say.
 *
 * Falls back to the plain "Contact" title when no city is configured — never
 * to a title asserting a location the data does not carry.
 */
export const contactTitle = (data: PortfolioData): string => {
  const city = data.seo?.geo?.city?.trim() || data.contact?.location?.trim();
  return city ? `Contact — Web Designer in ${city}` : 'Contact';
};
