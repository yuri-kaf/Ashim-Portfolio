import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PortfolioData } from '../types';
import { getSession, logout } from '../services/authApi';
import { saveContent } from '../services/contentApi';
import { sanitizePortfolioData } from '../lib/sanitize';
import SaveBar from '../components/dashboard/SaveBar';
import { COLLECTIONS } from '../lib/editorSchema';
import LoginForm from './dashboard/LoginForm';
import ProfileEditor from './dashboard/ProfileEditor';
import CollectionEditor from './dashboard/CollectionEditor';

interface DashboardPageProps {
  data: PortfolioData;
  updateData: (newData: PortfolioData) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ data, updateData }) => {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [draft, setDraft] = useState<PortfolioData>(data);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [section, setSection] = useState<string>('profile');

  /**
   * Whether the editor has been typed in.
   *
   * Deliberately not derived by diffing `draft` against `data`: `data` starts
   * as the bundled INITIAL_DATA and is replaced when App's fetch resolves, so
   * a diff would read as "dirty" before any edit whenever published content
   * differs from the defaults — and then refuse to adopt the real content,
   * leaving Save free to overwrite the live site with defaults.
   */
  const [touched, setTouched] = useState(false);

  const refresh = useCallback(() => {
    getSession().then(setAuthed);
  }, []);

  useEffect(refresh, [refresh]);

  // Adopt published content whenever it arrives, unless there is unsaved work.
  useEffect(() => {
    if (!touched) setDraft(data);
  }, [data, touched]);

  const dirty = touched && JSON.stringify(draft) !== JSON.stringify(data);

  const patch = useCallback((changes: Partial<PortfolioData>) => {
    setTouched(true);
    setDraft((current) => ({ ...current, ...changes }));
  }, []);

  const discard = () => {
    setDraft(data);
    setTouched(false);
    setSaveError(null);
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const stored = await saveContent(sanitizePortfolioData(draft));
      updateData(stored);
      setDraft(stored);
      setTouched(false);
      setSavedAt(Date.now());
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await logout();
    setAuthed(false);
  };

  // Browsers only honour this on a real interaction, which is what we want:
  // it warns on tab-close, not on programmatic navigation.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

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
            <h1 className="mega text-4xl md:text-6xl">Your content.</h1>
          </div>
          <button onClick={signOut} className="mono text-[var(--grey-1)] hover:text-[var(--ink)]">
            Sign out
          </button>
        </div>

        <nav className="mb-10 flex flex-wrap gap-2">
          {[{ key: 'profile', label: 'Profile' }, ...COLLECTIONS].map((entry) => (
            <button
              key={entry.key}
              onClick={() => setSection(entry.key)}
              className={`mono rounded-full px-5 py-2.5 transition-colors ${
                section === entry.key
                  ? 'bg-[var(--ink)] text-[var(--paper)]'
                  : 'border border-[var(--hairline)] text-[var(--grey-1)] hover:border-[var(--ink)]'
              }`}
            >
              {entry.label}
            </button>
          ))}
        </nav>

        {section === 'profile' ? (
          <ProfileEditor draft={draft} patch={patch} />
        ) : (
          (() => {
            const spec = COLLECTIONS.find((c) => c.key === section);
            if (!spec) return null;
            return (
              <CollectionEditor
                spec={spec}
                data={draft}
                items={draft[spec.key] as Record<string, any>[]}
                onChange={(items) => patch({ [spec.key]: items } as Partial<PortfolioData>)}
              />
            );
          })()
        )}

        <SaveBar
          dirty={dirty}
          saving={saving}
          error={saveError}
          savedAt={savedAt}
          onSave={save}
          onDiscard={discard}
        />

        <Link
          to="/"
          className="mono mt-10 inline-flex items-center gap-2 text-[var(--grey-1)] hover:text-[var(--ink)]"
        >
          <ArrowLeft size={14} /> Back to the site
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
