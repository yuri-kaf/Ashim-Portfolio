import { useEffect, useMemo } from 'react';
import { Faq, PortfolioData, SeoDefaults } from '../types';
import { buildGraph, absolute } from '../lib/seoGraph';
import { canonicalPath } from '../lib/routes';
import { composeTitle } from '../lib/titles';

export interface SeoProps {
  defaults: SeoDefaults;
  /** Feeds lib/seoGraph.ts — the Person, the breadcrumb trail, and more. */
  data: PortfolioData;
  /** Page title without the site suffix. */
  title?: string;
  /**
   * A complete title, emitted verbatim with no suffix. For titles that already
   * carry the name — see lib/titles.ts.
   */
  exactTitle?: string;
  /**
   * Label for this page's last breadcrumb crumb — pass the same string given
   * to <Breadcrumbs>. Defaults to `title`, which is often the SEO title and
   * therefore wrong for a trail.
   */
  breadcrumbTitle?: string;
  description?: string;
  /** Absolute or root-relative image for social previews. */
  image?: string;
  /** Path only, e.g. "/blog/my-post". Combined with the configured site URL. */
  path: string;
  type?: 'website' | 'article';
  /**
   * schema.org type for `type: 'article'` pages. Case studies are CreativeWork
   * (credited with `creator`); blog posts are BlogPosting. og:type stays
   * "article" either way — that is Open Graph's vocabulary, not schema.org's.
   */
  schemaType?: 'BlogPosting' | 'CreativeWork';
  publishedTime?: string;
  tags?: string[];
  /** Set on a page that should emit FAQPage schema. */
  faqs?: Faq[];
  /** Set on /services/:slug to emit Service schema. */
  service?: { name: string; description: string };
  /** Keeps drafts and previews out of search results. */
  noindex?: boolean;
}

const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
  const selector = `meta[${attr}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const upsertLink = (rel: string, href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
};

const upsertJsonLd = (json: string | null) => {
  const id = 'seo-jsonld';
  document.getElementById(id)?.remove();
  if (!json) return;
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = json;
  document.head.appendChild(script);
};

/**
 * Writes per-route metadata into <head>.
 *
 * This is what search crawlers read, since they execute JavaScript. It is not
 * enough on its own for social previews — WhatsApp, LinkedIn and similar
 * scrapers do not run scripts — which is why the build also pre-renders static
 * HTML per post with these same tags baked in (see scripts/prerender.mjs).
 *
 * The JSON-LD graph comes from lib/seoGraph.ts — the same builder the
 * prerenderer uses — so the runtime head and the static HTML never drift
 * apart.
 *
 * Renders nothing; it only manipulates the document head.
 */
const Seo: React.FC<SeoProps> = ({
  defaults,
  data,
  title,
  exactTitle,
  breadcrumbTitle,
  description,
  image,
  path,
  type = 'website',
  schemaType,
  publishedTime,
  tags,
  faqs,
  service,
  noindex = false,
}) => {
  const fullTitle = composeTitle(defaults, title, exactTitle);
  const desc = description?.trim() || defaults.description;
  // Canonicalised to match the URL lib/seoGraph.ts puts in the graph. A
  // canonical tag and an og:url that disagree with the schema about the same
  // page is the kind of inconsistency that costs indexing.
  const url = absolute(defaults.siteUrl, canonicalPath(path));
  const ogImage = absolute(defaults.siteUrl, image?.trim() || defaults.ogImage);

  // faqs, service and (the article shape built below) are objects/arrays a
  // caller may construct inline in JSX, which gives them a fresh identity
  // every render even when their content hasn't changed. Depending on the
  // objects themselves would defeat the memo below — it would recompute (and
  // upsertJsonLd would tear down and rebuild the script tag) on every
  // render. Serialising their content into a primitive key sidesteps that:
  // the memo only recomputes when the actual content changes.
  const tagsKey = tags?.join('|') ?? '';
  const faqsKey = faqs ? JSON.stringify(faqs) : '';
  const serviceKey = service ? JSON.stringify(service) : '';

  const article = type === 'article'
    ? {
        headline: title || exactTitle || defaults.siteName,
        type: schemaType,
        image: ogImage,
        published: publishedTime,
        tags,
      }
    : undefined;

  const graph = useMemo(
    () => JSON.stringify(buildGraph({
      seo: defaults,
      data,
      path,
      title: title || exactTitle || defaults.siteName,
      breadcrumbTitle,
      description: desc,
      faqs,
      service,
      article,
    })),
    // article, faqs and service are intentionally omitted here in favour of
    // the primitive keys derived above — see the comment where they're built.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaults, data, path, title, exactTitle, breadcrumbTitle, desc, type, schemaType, publishedTime, ogImage, tagsKey, faqsKey, serviceKey],
  );

  useEffect(() => {
    document.title = fullTitle;

    upsertMeta('name', 'description', desc);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    upsertLink('canonical', url);

    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('property', 'og:site_name', defaults.siteName);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);
    upsertMeta('name', 'twitter:image', ogImage);
    if (defaults.twitterHandle) {
      upsertMeta('name', 'twitter:creator', defaults.twitterHandle);
    }

    upsertJsonLd(graph);
  }, [
    fullTitle,
    desc,
    url,
    ogImage,
    type,
    noindex,
    defaults.siteName,
    defaults.twitterHandle,
    defaults.siteUrl,
    graph,
  ]);

  return null;
};

export default Seo;
