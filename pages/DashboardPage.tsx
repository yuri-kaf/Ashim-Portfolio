import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PortfolioData } from '../types';
import { getSession, logout } from '../services/authApi';
import LoginForm from './dashboard/LoginForm';

interface DashboardPageProps {
  data: PortfolioData;
  updateData: (newData: PortfolioData) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ data }) => {
  const [authed, setAuthed] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    getSession().then(setAuthed);
  }, []);

  useEffect(refresh, [refresh]);

  const signOut = async () => {
    await logout();
    setAuthed(false);
  };

  // null means "still asking the server" — rendering the login form during that
  // window would flash it at an already-signed-in editor on every page load.
  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-[var(--grey-2)]" />
      </div>
    );
  }

  if (!authed) return <LoginForm onSignedIn={refresh} />;

  return (
    <div data-nav-theme="light" className="min-h-screen px-5 py-28 md:px-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="mono bracket mb-4 text-[var(--grey-1)]">Command Center</p>
            <h1 className="mega text-4xl md:text-6xl">Signed in.</h1>
          </div>
          <button onClick={signOut} className="mono text-[var(--grey-1)] hover:text-[var(--ink)]">
            Sign out
          </button>
        </div>

        <p className="mono mb-8 text-[var(--grey-2)]">
          {data?.projects?.length ?? 0} projects · {data?.services?.length ?? 0} services ·{' '}
          {data?.blogs?.length ?? 0} journal entries · {data?.gallery?.length ?? 0} gallery items
        </p>

        <Link
          to="/"
          className="mono inline-flex items-center gap-2 text-[var(--grey-1)] hover:text-[var(--ink)]"
        >
          <ArrowLeft size={14} /> Back to the site
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
