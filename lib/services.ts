import { PortfolioData, Service } from '../types';

/**
 * The one place that decides which services this site owns a page for.
 *
 * Four layers used to answer this question separately — the prerenderer, the
 * SPA route, the footer and the services hub — and they disagreed. The result
 * was a service the hub linked, the footer linked sitewide and the SPA served
 * at HTTP 200 with a full canonical and Service schema, while the build wrote
 * no file for it and left it out of the sitemap. One predicate, read by all of
 * them, is what stops that.
 */

/**
 * Services that get a page on this domain.
 *
 * The body guard is load-bearing, not a tidiness check. A content document
 * written before `mode` existed carries no pointers at all, and lib/sanitize.ts
 * defaults every service to 'page' — so without it a deploy publishes a page
 * per legacy service, including empty ones competing with limicreatives.com
 * for the queries the agency already owns. No body, no page.
 *
 * `published !== false` rather than `published`: a service saved before the
 * field existed has it absent, and those were already live.
 */
export const ownedServices = (data: Partial<PortfolioData> | null | undefined): Service[] =>
  (data?.services ?? []).filter(
    (service): service is Service =>
      Boolean(service) &&
      service.mode === 'page' &&
      service.published !== false &&
      Boolean((service.body ?? '').trim()),
  );

/**
 * Services whose page lives on limicreatives.com. They render as an outbound
 * card here and get no file and no sitemap entry — that is the whole point of
 * the two-site split.
 *
 * `externalUrl` is re-checked even though lib/sanitize.ts already demotes a
 * pointer with nowhere to point back to 'page': this runs on raw data in the
 * prerenderer too, and a pointer with a dead href renders a dead card.
 */
export const pointerServices = (data: Partial<PortfolioData> | null | undefined): Service[] =>
  (data?.services ?? []).filter(
    (service): service is Service =>
      Boolean(service) &&
      service.mode === 'pointer' &&
      service.published !== false &&
      Boolean((service.externalUrl ?? '').trim()),
  );
