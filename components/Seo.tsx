import { useEffect } from 'react';
import { SeoDefaults } from '../types';

export interface SeoProps {
  defaults: SeoDefaults;
  /** Page title without the site suffix. Omit for the home page. */
  title?: string;
  description?: string;
  /** Absolute or root-relative image for social previews. */
  image?: string;
  /** Path only, e.g. "/blog/my-post". Combined with the configured site URL. */
  path: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  author?: string;
  tags?: string[];
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

const upsertJsonLd = (payload: object | null) => {
  const id = 'seo-jsonld';
  document.getElementById(id)?.remove();
  if (!payload) return;
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(payload);
  document.head.appendChild(script);
};

const absolute = (siteUrl: string, value: string): string =>
  /^https?:\/\//.test(value) ? value : `${siteUrl.replace(/\/$/, '')}${value.startsWith('/') ? '' : '/'}${value}`;

/**
 * Writes per-route metadata into <head>.
 *
 * This is what search crawlers read, since they execute JavaScript. It is not
 * enough on its own for social previews — WhatsApp, LinkedIn and similar
 * scrapers do not run scripts — which is why the build also pre-renders static
 * HTML per post with these same tags baked in (see scripts/prerender.mjs).
 *
 * Renders nothing; it only manipulates the document head.
 */
const Seo: React.FC<SeoProps> = ({
  defaults,
  title,
  description,
  image,
  path,
  type = 'website',
  publishedTime,
  author,
  tags,
  noindex = false,
}) => {
  const fullTitle = title ? `${title}${defaults.titleSuffix}` : defaults.siteName;
  const desc = description?.trim() || defaults.description;
  const url = absolute(defaults.siteUrl, path);
  const ogImage = absolute(defaults.siteUrl, image?.trim() || defaults.ogImage);

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

    upsertJsonLd(
      type === 'article'
        ? {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: title,
            description: desc,
            image: ogImage,
            url,
            ...(publishedTime ? { datePublished: publishedTime } : {}),
            ...(author ? { author: { '@type': 'Person', name: author } } : {}),
            ...(tags?.length ? { keywords: tags.join(', ') } : {}),
            publisher: { '@type': 'Person', name: defaults.siteName },
          }
        : {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: defaults.siteName,
            url: absolute(defaults.siteUrl, '/'),
            description: desc,
          },
    );
  }, [
    fullTitle,
    desc,
    url,
    ogImage,
    type,
    noindex,
    title,
    publishedTime,
    author,
    tags,
    defaults.siteName,
    defaults.twitterHandle,
    defaults.siteUrl,
  ]);

  return null;
};

export default Seo;
