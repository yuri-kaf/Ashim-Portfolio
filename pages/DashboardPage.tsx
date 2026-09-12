import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PortfolioData } from '../types';
import { getSession, logout } from '../services/authApi';
import { saveContent } from '../services/contentApi';
import { sanitizePortfolioData } from '../lib/sanitize';
import { COLLECTIONS, NAV_GROUPS } from '../lib/editorSchema';
import { contentIssues } from '../lib/contentHealth';
import LoginForm from './dashboard/LoginForm';
import ProfileEditor from './dashboard/ProfileEditor';
import CollectionEditor from './dashboard/CollectionEditor';
import OverviewPanel from './dashboard/OverviewPanel';
import DashboardNav from './dashboard/DashboardNav';
import DashboardTopBar from './dashboard/DashboardTopBar';

interface DashboardPageProps {
  data: PortfolioData;
  updateData: (newData: PortfolioData) => void;
}

/** The section shown before anything is clicked. */
export const OVERVIEW = 'overview';

/**
 * Profile is not a collection, so it has no CollectionSpec to carry a label or
 * a group. It is filed with the site-wide sections by hand — the one entry the
 * navigation does not derive, because there is nothing to derive it from.
 */
const PROFILE = 'profile';

/**
 * Fixed height of the site's own navbar, which renders over every route
 * including this one. The admin chrome starts below it rather than under it.
 */
const NAV_OFFSET = 'top-20 md:top-24';

const DashboardPage: React.FC<DashboardPageProps> = ({ data, updateData }) => {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [draft, setDraft] = useState<PortfolioData>(data);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [section, setSection] = useState<string>(OVERVIEW);

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

  const issues = useMemo(() => contentIssues(draft), [draft]);

  /**
   * Sections that have something blocking in them, so the navigation can mark
   * them without every row having to re-scan the issue list.
   */
  const blockedSections = useMemo(
    () => new Set(issues.filter((issue) => issue.severity === 'blocking').map((i) => i.section)),
    [issues],
  );

  /**
   * The navigation, derived from COLLECTIONS rather than written out again.
   * A collection added to the schema appears here on its own; there is no
   * second list to forget to update.
   */
  const groups = useMemo(
    () => [
      // Overview carries no heading: it is one item, and a heading over a
      // single row is noise.
      { id: 'top', label: null, items: [{ key: OVERVIEW, label: 'Overview', count: null }] },
      ...NAV_GROUPS.map((group) => ({
        id: group.id as string,
        label: group.label as string | null,
        items: [
          ...(group.id === 'site'
            ? [{ key: PROFILE, label: 'Profile', count: null as number | null }]
            : []),
          ...COLLECTIONS.filter((spec) => spec.group === group.id).map((spec) => ({
            key: spec.key as string,
            label: spec.label,
            count: (draft[spec.key] ?? []).length as number | null,
          })),
        ],
      })),
    ],
    [draft],
  );

  const sectionLabel =
    section === OVERVIEW
      ? 'Overview'
      : section === PROFILE
        ? 'Profile'
        : (COLLECTIONS.find((spec) => spec.key === section)?.label ?? 'Overview');

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

  const body =
    section === OVERVIEW ? (
      <OverviewPanel data={draft} issues={issues} onOpen={setSection} />
    ) : section === PROFILE ? (
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
    );

  return (
    <div data-nav-theme="light" className="min-h-screen pt-20 md:pt-24">
      {/* Desktop: a fixed rail with its own scroll, so a long collection list
          never pushes the navigation off the screen. */}
      <aside
        className={`no-scrollbar fixed ${NAV_OFFSET} bottom-0 left-0 z-30 hidden w-[230px] overflow-y-auto border-r border-[var(--hairline)] bg-[var(--paper)] px-5 py-7 md:block`}
      >
        <div className="mb-8">
          <p className="text-[15px] leading-tight tracking-tight">{draft.name || 'Admin'}</p>
          <p className="mono mt-1.5 text-[var(--grey-2)]">Admin</p>
        </div>

        <DashboardNav
          groups={groups}
          section={section}
          onSelect={setSection}
          blockedSections={blockedSections}
        />
      </aside>

      <div className="md:pl-[230px]">
        <DashboardTopBar
          className={NAV_OFFSET}
          sectionLabel={sectionLabel}
          dirty={dirty}
          saving={saving}
          error={saveError}
          savedAt={savedAt}
          onSave={save}
          onDiscard={discard}
          onSignOut={signOut}
        />

        {/* Mobile: the same items, as a single scrolling row above the work.
            A 230px rail on a 375px screen would leave nothing to edit in. */}
        <div className="no-scrollbar overflow-x-auto border-b border-[var(--hairline)] bg-[var(--paper)] md:hidden">
          <DashboardNav
            horizontal
            groups={groups}
            section={section}
            onSelect={setSection}
            blockedSections={blockedSections}
          />
        </div>

        <main className="px-5 py-8 md:px-10 md:py-10">
          <div className="mx-auto max-w-[1100px]">{body}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
