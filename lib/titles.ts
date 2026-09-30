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
  const base = title?.trim();
  if (!base) return seo.siteName;
  // The suffix is branding, the title is the query. When both do not fit,
  // the suffix goes — otherwise Google cuts the words that match the search
  // and keeps the name nobody searched for.
  const suffixed = `${base}${seo.titleSuffix}`;
  return suffixed.length <= TITLE_LIMIT ? suffixed : base;
};

/**
 * The country the practice sits in, spelled out: "NP" is what the schema
 * wants, "Nepal" is what people type.
 */
export const countryName = (data: PortfolioData): string => {
  const code = data.seo?.geo?.country?.trim();
  if (!code) return '';
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
};

/**
 * "Ashim Kafle — Product Designer & Digital Marketer in Nepal" (58 chars).
 *
 * The country is the local intent every query this site targets carries —
 * "ui ux designer in nepal", "digital marketer in nepal" — and the home page
 * is the one most likely to rank for them, so it goes in the title whenever
 * it fits. It is dropped rather than truncated when a longer role would push
 * the title past what a results page shows.
 */
export const homeTitle = (data: PortfolioData): string => {
  const role = data.role?.trim();
  if (!role) return data.name;
  const base = `${data.name} — ${role}`;
  const country = countryName(data);
  const local = country ? `${base} in ${country}` : base;
  return local.length <= TITLE_LIMIT ? local : base;
};

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

/**
 * Titles for the hub pages, each written for the query the hub can win
 * rather than the nav label. "Services | Ashim Kafle" and "Journal | Ashim
 * Kafle" named nothing anyone searches for.
 *
 * `exact` titles carry their own place name and skip the suffix; the rest
 * take " | Ashim Kafle" like any page title.
 */
export const hubTitles = (data: PortfolioData): Record<
  'services' | 'works' | 'blog' | 'gallery' | 'vibe',
  { title?: string; exactTitle?: string }
> => {
  const country = countryName(data);
  return {
    services: country
      ? { exactTitle: `Web Design, UI/UX & Branding Services in ${country}` }
      : { title: 'Web Design, UI/UX & Branding Services' },
    works: { title: 'UI/UX & Brand Design Portfolio' },
    blog: { title: 'Web Design & Digital Marketing Blog' },
    gallery: { title: 'Gallery' },
    vibe: { title: 'Vibe' },
  };
};
