import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => (
  <div
    data-nav-theme="light"
    className="flex min-h-screen flex-col items-center justify-center px-6 py-32 text-center"
  >
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
