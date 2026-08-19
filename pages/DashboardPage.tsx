import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PortfolioData } from '../types';

interface DashboardPageProps {
  data: PortfolioData;
  updateData: (newData: PortfolioData) => void;
}

/**
 * PLACEHOLDER.
 *
 * The original admin dashboard (~380 lines — project/service/blog CRUD forms
 * writing back through `updateData`) was lost when the project folder was
 * deleted outside of any editor session, and unlike every other file in this
 * project it was never fully captured in the session transcript used to
 * reconstruct everything else: it was only ever touched in-place via shell
 * `sed` commands, never opened with the Read tool or rewritten with Write, so
 * there was no snapshot of its source to recover.
 *
 * This is a placeholder that satisfies the same `{ data, updateData }`
 * contract so the app still builds and the route still resolves — it isn't a
 * reconstruction of the original UI. Per the plan to rebuild the admin panel
 * as its own separate project, that's where the real replacement belongs.
 */
const DashboardPage: React.FC<DashboardPageProps> = ({ data }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--paper)] px-6 py-32 text-center">
      <p className="mono bracket mb-8 text-[var(--grey-1)]">Command Center</p>
      <h1 className="mega mb-8 text-5xl md:text-7xl">Rebuilding here.</h1>
      <p className="mb-12 max-w-lg text-base font-light leading-relaxed text-[var(--grey-1)]">
        The original admin dashboard couldn't be recovered along with the rest of the site — it's
        being rebuilt as its own separate project instead of living here. Portfolio content for
        now is still driven by <code className="mono">constants.tsx</code>.
      </p>
      <p className="mono mb-12 text-[var(--grey-2)]">
        {data?.projects?.length ?? 0} projects · {data?.services?.length ?? 0} services ·{' '}
        {data?.blogs?.length ?? 0} journal entries loaded
      </p>
      <Link
        to="/"
        className="mono inline-flex items-center gap-3 rounded-full bg-[var(--ink)] px-7 py-3.5 text-[var(--paper)] transition-colors duration-300 hover:bg-[var(--grey-1)]"
      >
        <ArrowLeft size={16} /> Back to the site
      </Link>
    </div>
  );
};

export default DashboardPage;
