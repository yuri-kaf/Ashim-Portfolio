import React from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';

interface DashboardTopBarProps {
  /** Sticky offset, so the bar clears the site's own fixed navbar. */
  className?: string;
  sectionLabel: string;
  dirty: boolean;
  saving: boolean;
  error: string | null;
  savedAt: number | null;
  onSave: () => void;
  onDiscard: () => void;
  onSignOut: () => void;
}

/**
 * Where the section name, the save state and the way out all live.
 *
 * This replaces the sticky SaveBar at the foot of the page rather than sitting
 * above it. Two persistent bars on one screen is two chromes competing for the
 * same attention, and both of them printing "Unsaved changes" is the reader
 * checking twice to find out whether they mean the same thing. The controls
 * stay reachable from anywhere because this bar is sticky too.
 */
const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  className = '',
  sectionLabel,
  dirty,
  saving,
  error,
  savedAt,
  onSave,
  onDiscard,
  onSignOut,
}) => {
  const status = error
    ? error
    : saving
      ? 'Saving'
      : dirty
        ? 'Unsaved changes'
        : savedAt
          ? `Saved ${new Date(savedAt).toLocaleTimeString()}`
          : 'Saved';

  return (
    <header
      className={`sticky ${className} z-20 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-[var(--hairline)] bg-[var(--paper)]/95 px-5 py-3.5 backdrop-blur md:px-10`}
    >
      <h1 className="text-[15px] tracking-tight">{sectionLabel}</h1>

      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="mono inline-flex items-center gap-1 text-[var(--grey-1)] transition-colors hover:text-[var(--ink)]"
      >
        View site <ArrowUpRight size={12} />
      </a>

      <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className={`mono ${error ? 'text-[var(--ink)]' : 'text-[var(--grey-1)]'}`}>{status}</p>

        <button
          onClick={onDiscard}
          disabled={!dirty || saving}
          className="mono text-[var(--grey-1)] transition-opacity hover:text-[var(--ink)] disabled:opacity-40"
        >
          Discard
        </button>

        <button
          onClick={onSave}
          disabled={!dirty || saving}
          className="mono flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-[var(--paper)] transition-opacity disabled:opacity-40"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving' : 'Save'}
        </button>

        <button
          onClick={onSignOut}
          className="mono text-[var(--grey-1)] transition-colors hover:text-[var(--ink)]"
        >
          Sign out
        </button>
      </div>
    </header>
  );
};

export default DashboardTopBar;
