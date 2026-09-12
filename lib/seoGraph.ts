import { breadcrumbTrail, canonicalPath } from './routes';
import { Faq, PortfolioData, SeoDefaults } from '../types';

/**
 * The @id limicreatives.com already publishes on its own Organization node,
 * verified live on 2026-09-12. Referencing it byte-for-byte is what lets
 * Google merge "this person founded that org" with the agency's own schema
 * into a single entity relationship. A trailing slash, a www prefix or an
 * http scheme here silently produces a second, unrelated node instead.
 */
export const LIMI_ORG_ID = 'https://limicreatives.com/#organization';
export const PERSON_ID = 'https://www.ashimkafle.com.np/#person';

export const absolute = (siteUrl: string, value: string): string =>
  /^(https?:)?\/\//.test(value)
    ? value
    : `${siteUrl.replace(/\/$/, '')}${value.startsWith('/') ? '' : '/'}${value}`;

export interface GraphInput {
  seo: SeoDefaults;
  data: PortfolioData;
  path: string;
  title: string;
  /**
   * Label for this page's last breadcrumb crumb. Defaults to `title`.
   *
   * These legitimately differ: /services/web-design is titled "Web Design &
   * UI/UX in Nepal" for the SERP but its visible trail reads "Web Design &
   * UI/UX", and /about is titled with the founder claim but breadcrumbs as
   * "About". Google expects the markup to reflect the trail on the page, so
   * the short human label is what belongs here — never the SEO title.
   */
  breadcrumbTitle?: string;
  description?: string;
  faqs?: Faq[];
  /**
   * Set for blog posts and case studies.
   *
   * `type` decides which they are. A portfolio case study is not a blog post:
   * BlogPosting asserts membership in a Blog that does not exist on this
   * domain, so projects emit CreativeWork instead — and are credited with
   * `creator`, which is what CreativeWork takes, rather than `author`.
   */
  article?: {
    headline: string;
    type?: 'BlogPosting' | 'CreativeWork';
    image?: string;
    published?: string;
    tags?: string[];
  };
  /** Set for /services/:slug. */
  service?: { name: string; description: string };
}

/**
 * Builds one @graph per page rather than several loose JSON-LD blocks.
 *
 * Two entity nodes and no more: the Person (defined authoritatively here) and
 * the agency Organization (referenced, not redefined — limicreatives.com owns
 * that definition). Deliberately no LocalBusiness or ProfessionalService: the
 * agency's schema publishes the same phone number this site would use, and two
 * local businesses at one number degrades local trust signals for both.
 */
export const buildGraph = ({
  seo, data, path, title, breadcrumbTitle, description, faqs, article, service,
}: GraphInput) => {
  const origin = seo.siteUrl.replace(/\/$/, '');
  // Canonicalised so this page's self-URL cannot disagree with the URL the
  // BreadcrumbList gives it — one graph must not name a page two ways.
  const url = absolute(origin, canonicalPath(path));
  const desc = description || seo.description;

  const nodes: Array<Record<string, unknown>> = [
    {
      '@type': 'Person',
      '@id': PERSON_ID,
      name: data.name,
      jobTitle: data.company.role || data.role,
      url: `${origin}/about`,
      image: absolute(origin, seo.ogImage),
      description: data.heroIntro,
      email: data.contact.email ? `mailto:${data.contact.email}` : undefined,
      telephone: data.contact.phone || undefined,
      homeLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: seo.geo.city,
          addressRegion: seo.geo.region,
          addressCountry: seo.geo.country,
        },
      },
      knowsAbout: data.ticker,
      worksFor: { '@id': LIMI_ORG_ID },
      sameAs: data.social.map((link) => link.url).filter(Boolean),
    },
    {
      // A reference, not a redefinition. Only what is needed to assert the
      // relationship — limicreatives.com owns the full definition.
      '@type': 'Organization',
      '@id': LIMI_ORG_ID,
      name: data.company.name,
      url: data.company.url || undefined,
      founder: { '@id': PERSON_ID },
    },
  ];

  const trail = breadcrumbTrail(path, breadcrumbTitle?.trim() || title);
  if (trail.length > 1) {
    nodes.push({
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: absolute(origin, crumb.path),
      })),
    });
  }

  if (service) {
    nodes.push({
      '@type': 'Service',
      name: service.name,
      description: service.description,
      url,
      provider: { '@id': PERSON_ID },
      areaServed: seo.geo.areaServed,
    });
  }

  if (article) {
    const isPost = (article.type ?? 'BlogPosting') === 'BlogPosting';
    nodes.push({
      '@type': isPost ? 'BlogPosting' : 'CreativeWork',
      headline: article.headline,
      description: desc,
      image: absolute(origin, article.image || seo.ogImage),
      url,
      // Omitted rather than invented when the source carries no date.
      datePublished: article.published || undefined,
      ...(isPost
        ? {
            author: { '@id': PERSON_ID },
            // Deliberately NOT the agency. This is the person's own domain;
            // naming Limi Creatives as the publisher would tell Google the
            // agency publishes this site's content, which contradicts the
            // two-site boundary and hands the agency entity the credit for the
            // person's portfolio. The founder relationship lives on
            // Person.worksFor / Organization.founder, and nowhere else.
            publisher: { '@id': PERSON_ID },
          }
        : { creator: { '@id': PERSON_ID } }),
      keywords: article.tags?.length ? article.tags.join(', ') : undefined,
    });
  }

  if (faqs?.length) {
    nodes.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }

  // Stripping undefined keeps the emitted JSON small and the Rich Results
  // Test output clean.
  const prune = (node: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(node).filter(([, value]) => value !== undefined));

  return { '@context': 'https://schema.org', '@graph': nodes.map(prune) };
};
