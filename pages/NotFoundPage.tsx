import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { INITIAL_DATA } from '../constants';
import Seo from '../components/Seo';
import { notFoundMeta } from '../lib/pageMeta';

/**
 * Renders its own <head>, which a 404 otherwise inherits from index.html —
 * leaving every unknown URL canonicalised to the home page. Vercel rewrites
 * all unmatched paths to index.html and answers 200, so without this a
 * soft-404 reads to a crawler as a duplicate of the front page.
 *
 * Takes its defaults from the bundled seed rather than a prop: the four pages
 * that render this on an unknown slug do not pass content down, and the SEO
 * defaults are the same either way on a page that must not be indexed.
 */
const NotFoundSeo: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <Seo defaults={INITIAL_DATA.seo} data={INITIAL_DATA} {...notFoundMeta(pathname)} />
  );
};

const NotFoundPage: React.FC = () => (
  <div
    data-nav-theme="light"
    className="flex min-h-screen flex-col items-center justify-center px-6 py-32 text-center"
  >
    <NotFoundSeo />
    <p className="mono bracket mb-8 text-[var(--grey-1)]">404</p>
    <h1 className="mega mb-8 text-5xl md:text-7xl">Nothing here.</h1>
    <p className="mb-12 max-w-md text-base font-light leading-relaxed text-[var(--grey-1)]">
      That page doesn&rsquo;t exist — it may have moved, or the link may be wrong.
    </p>
    <Link
      to="/"
      className="mono inline-flex items-center gap-3 rounded-full bg-[var(--ink)] px-7 py-3.5 text-[var(--paper)] transition-colors duration-300 hover:bg-[var(--grey-1)]"
    >
      <ArrowLeft size={16} /> Back to the site
    </Link>
  </div>
);

export default NotFoundPage;
