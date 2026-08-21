# Portfolio Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/dashboard` placeholder with a working admin panel: log in, edit every part of the portfolio, upload images, save to Blob.

**Architecture:** A session-gated dashboard shell that fetches content once, holds it in local draft state, and saves the whole document through `PUT /api/content`. Collection editors are driven by a field schema rather than hand-written per collection, so six collections share one editor component. Images upload straight from the browser to Blob using a token minted by `POST /api/upload`. Gemini calls move behind `POST /api/ai/*`.

**Tech Stack:** React 19, react-router-dom 7, `@vercel/blob` 2.8.0 (`upload` + `handleUpload`), `@google/genai`, Vitest.

**Depends on:** Plan 1 (`docs/superpowers/plans/2026-08-19-portfolio-backend-foundation.md`) — complete and deployed. `GET/PUT /api/content` and the auth routes are live and verified.

---

## Decisions

| Question | Decision |
|---|---|
| Save model | Explicit **Save** button for the whole document, not per-field autosave |
| Unsaved work | Dirty indicator + browser warning on navigate-away |
| Draft state | One local copy of `PortfolioData`; Save issues one `PUT` |
| Editors | Schema-driven generic component, not six bespoke forms |
| New item ids | `crypto.randomUUID()`, generated client-side |
| Reordering | Move up / move down buttons, not drag-and-drop |
| Deleting | Inline confirm ("Delete" → "Really?"), no modal |
| Images | Blob client-upload; jpeg/png/webp/avif, max 5 MB, enforced server-side |
| AI helpers | Behind `/api/ai/*`, admin-only, key never in the client |
| Styling | Existing utilities (`mono`, `mega`, `surface-inset`, `card-physical`) — no new design system |

### Why one Save button

Autosave on a whole-document `PUT` would fire a write per keystroke and make a half-typed
sentence the published state. An explicit save also gives one obvious place to surface
validation failures.

### Why schema-driven editors

`projects`, `services`, `blogs`, `gallery`, `tools` and `process` are all "a list of flat objects
with a few text fields, sometimes an image". Six hand-written forms means six places to fix a bug.
One generic editor plus six field specs keeps each file small and behaviour identical.

---

## File Structure

**Field schema (shared, pure):**
- `lib/editorSchema.ts` — `FieldSpec`/`CollectionSpec` types plus the spec for each collection. No React.

**Client services:**
- `services/authApi.ts` — `login`, `logout`, `getSession`
- `services/uploadApi.ts` — wraps `upload()` from `@vercel/blob/client`
- `services/aiApi.ts` — calls `/api/ai/*`

**Dashboard UI:**
- `pages/DashboardPage.tsx` *(replace)* — gate, shell, section routing, save
- `pages/dashboard/LoginForm.tsx`
- `pages/dashboard/ProfileEditor.tsx` — scalar fields, company, vibe, availability
- `pages/dashboard/CollectionEditor.tsx` — generic list editor driven by a `CollectionSpec`
- `components/dashboard/Field.tsx` — text / textarea / select input
- `components/dashboard/ImageField.tsx` — preview + upload
- `components/dashboard/SaveBar.tsx` — dirty state, save, errors

**Routes:**
- `api/upload.ts` — mints the client-upload token
- `api/ai/blog.ts`, `api/ai/case-study.ts`

**Tests:**
- `lib/editorSchema.test.ts` — every spec field exists on its type
- `api/upload.test.ts` — rejects unauthenticated
- `api/ai/blog.test.ts` — rejects unauthenticated, handles a missing key

---

## Task 1: Auth client and the login gate

Ships a real login: after this task `/dashboard` asks for a password and reports success,
even though no editors exist yet.

**Files:**
- Create: `services/authApi.ts`
- Replace: `pages/DashboardPage.tsx`
- Create: `pages/dashboard/LoginForm.tsx`

- [ ] **Step 1: Create `services/authApi.ts`**

```ts
/** Session state as reported by the server; the cookie itself is httpOnly. */
export const getSession = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/session', { cache: 'no-store' });
    if (!response.ok) return false;
    return Boolean((await response.json()).authenticated);
  } catch {
    return false;
  }
};

/** Resolves on success; throws with the server's message so the form can show it. */
export const login = async (password: string): Promise<void> => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error ?? `Sign-in failed with status ${response.status}`);
  }
};

export const logout = async (): Promise<void> => {
  await fetch('/api/auth/logout', { method: 'POST' });
};
```

- [ ] **Step 2: Create `pages/dashboard/LoginForm.tsx`**

```tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { login } from '../../services/authApi';

const LoginForm: React.FC<{ onSignedIn: () => void }> = ({ onSignedIn }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(password);
      setPassword('');
      onSignedIn();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-nav-theme="light"
      className="flex min-h-screen items-center justify-center px-6 py-32"
    >
      <form onSubmit={submit} className="surface-inset w-full max-w-md p-8">
        <p className="mono bracket mb-6 text-[var(--grey-1)]">Command Center</p>
        <h1 className="mega mb-8 text-4xl">Sign in.</h1>

        <label className="mono mb-2 block text-[var(--grey-1)]" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          className="mb-6 w-full rounded-xl border border-[var(--hairline)] bg-[var(--paper-pure)] px-4 py-3 text-base outline-none focus:border-[var(--ink)]"
        />

        {error && (
          <p role="alert" className="mb-6 text-sm text-[var(--ink)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || password.length === 0}
          className="mono flex w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-7 py-3.5 text-[var(--paper)] transition-opacity disabled:opacity-40"
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          {busy ? 'Signing in' : 'Sign in'}
        </button>

        <Link
          to="/"
          className="mono mt-8 inline-flex items-center gap-2 text-[var(--grey-1)] hover:text-[var(--ink)]"
        >
          <ArrowLeft size={14} /> Back to the site
        </Link>
      </form>
    </div>
  );
};

export default LoginForm;
```

- [ ] **Step 3: Replace `pages/DashboardPage.tsx`**

```tsx
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
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run build && npm test`
Expected: all pass, 34 tests.

- [ ] **Step 5: Commit and push**

```bash
git add services/authApi.ts pages/DashboardPage.tsx pages/dashboard/LoginForm.tsx
git commit -m "Add dashboard login gate"
git push origin main
```

- [ ] **Step 6: Verify in production**

Load `/dashboard`, confirm the password form appears, sign in with the real password, confirm
the signed-in view and the counts appear, then Sign out and confirm the form returns.

---

## Task 2: Field primitives and the save bar

**Files:**
- Create: `components/dashboard/Field.tsx`
- Create: `components/dashboard/SaveBar.tsx`

- [ ] **Step 1: Create `components/dashboard/Field.tsx`**

```tsx
import React from 'react';

export type FieldKind = 'text' | 'textarea' | 'select';

interface FieldProps {
  label: string;
  value: string;
  kind?: FieldKind;
  options?: readonly string[];
  rows?: number;
  onChange: (value: string) => void;
}

const inputClass =
  'w-full rounded-xl border border-[var(--hairline)] bg-[var(--paper-pure)] px-4 py-3 text-sm outline-none focus:border-[var(--ink)]';

const Field: React.FC<FieldProps> = ({
  label,
  value,
  kind = 'text',
  options = [],
  rows = 4,
  onChange,
}) => (
  <label className="block">
    <span className="mono mb-2 block text-[var(--grey-1)]">{label}</span>
    {kind === 'textarea' ? (
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} resize-y leading-relaxed`}
      />
    ) : kind === 'select' ? (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    ) : (
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    )}
  </label>
);

export default Field;
```

- [ ] **Step 2: Create `components/dashboard/SaveBar.tsx`**

```tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface SaveBarProps {
  dirty: boolean;
  saving: boolean;
  error: string | null;
  savedAt: number | null;
  onSave: () => void;
  onDiscard: () => void;
}

const SaveBar: React.FC<SaveBarProps> = ({
  dirty,
  saving,
  error,
  savedAt,
  onSave,
  onDiscard,
}) => (
  <div className="sticky bottom-0 z-50 -mx-5 mt-16 border-t border-[var(--hairline)] bg-[var(--paper)]/95 px-5 py-4 backdrop-blur md:-mx-10 md:px-10">
    <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4">
      <p className="mono text-[var(--grey-1)]">
        {error
          ? error
          : saving
            ? 'Saving'
            : dirty
              ? 'Unsaved changes'
              : savedAt
                ? `Saved ${new Date(savedAt).toLocaleTimeString()}`
                : 'No changes'}
      </p>

      <div className="flex items-center gap-3">
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
          className="mono flex items-center gap-2 rounded-full bg-[var(--ink)] px-7 py-3 text-[var(--paper)] transition-opacity disabled:opacity-40"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving' : 'Save'}
        </button>
      </div>
    </div>
  </div>
);

export default SaveBar;
```

- [ ] **Step 3: Verify and commit**

Run: `npx tsc --noEmit && npm run build`

```bash
git add components/dashboard
git commit -m "Add dashboard field and save-bar primitives"
```

---

## Task 3: Draft state and the profile editor

First end-to-end edit: change your tagline in the dashboard and see it on the live site.

**Files:**
- Create: `pages/dashboard/ProfileEditor.tsx`
- Modify: `pages/DashboardPage.tsx`

- [ ] **Step 1: Create `pages/dashboard/ProfileEditor.tsx`**

```tsx
import React from 'react';
import { PortfolioData } from '../../types';
import Field from '../../components/dashboard/Field';

const AVAILABILITY = ['available', 'busy', 'vacation'] as const;

interface ProfileEditorProps {
  draft: PortfolioData;
  patch: (changes: Partial<PortfolioData>) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ draft, patch }) => (
  <div className="space-y-10">
    <section className="grid gap-6 md:grid-cols-2">
      <Field label="Name" value={draft.name} onChange={(name) => patch({ name })} />
      <Field label="Role" value={draft.role} onChange={(role) => patch({ role })} />
      <div className="md:col-span-2">
        <Field
          label="Tagline"
          kind="textarea"
          rows={2}
          value={draft.tagline}
          onChange={(tagline) => patch({ tagline })}
        />
      </div>
      <Field
        label="Availability"
        kind="select"
        options={AVAILABILITY}
        value={draft.availability}
        onChange={(availability) =>
          patch({ availability: availability as PortfolioData['availability'] })
        }
      />
    </section>

    <section>
      <p className="mono bracket mb-4 text-[var(--grey-1)]">Current position</p>
      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="Company"
          value={draft.company.name}
          onChange={(name) => patch({ company: { ...draft.company, name } })}
        />
        <Field
          label="Your role there"
          value={draft.company.role}
          onChange={(role) => patch({ company: { ...draft.company, role } })}
        />
        <Field
          label="Company URL"
          value={draft.company.url ?? ''}
          onChange={(url) => patch({ company: { ...draft.company, url } })}
        />
        <div className="md:col-span-2">
          <Field
            label="Company description"
            kind="textarea"
            rows={2}
            value={draft.company.description}
            onChange={(description) => patch({ company: { ...draft.company, description } })}
          />
        </div>
      </div>
    </section>

    <section>
      <p className="mono bracket mb-4 text-[var(--grey-1)]">Vibe</p>
      <div className="grid gap-6">
        <Field
          label="Title"
          value={draft.vibe.title}
          onChange={(title) => patch({ vibe: { ...draft.vibe, title } })}
        />
        <Field
          label="Description"
          kind="textarea"
          rows={3}
          value={draft.vibe.description}
          onChange={(description) => patch({ vibe: { ...draft.vibe, description } })}
        />
        <Field
          label="Philosophy — one line each"
          kind="textarea"
          rows={5}
          value={draft.vibe.philosophy.join('\n')}
          onChange={(text) =>
            patch({
              vibe: {
                ...draft.vibe,
                // Blank lines are dropped on save, so a trailing newline while
                // typing does not become an empty bullet on the site.
                philosophy: text.split('\n').filter((line) => line.trim().length > 0),
              },
            })
          }
        />
      </div>
    </section>
  </div>
);

export default ProfileEditor;
```

- [ ] **Step 2: Add draft state to `pages/DashboardPage.tsx`**

Replace the signed-in `return (...)` block with a version that holds a draft. Add these
imports at the top of the file:

```ts
import { saveContent } from '../services/contentApi';
import { sanitizePortfolioData } from '../lib/sanitize';
import SaveBar from '../components/dashboard/SaveBar';
import ProfileEditor from './dashboard/ProfileEditor';
```

Inside the component, above the `if (authed === null)` guard:

```tsx
  const [draft, setDraft] = useState<PortfolioData>(data);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // `data` arrives asynchronously in App; adopt it until the editor has
  // unsaved work, after which overwriting the draft would discard typing.
  const dirty = JSON.stringify(draft) !== JSON.stringify(data);
  useEffect(() => {
    if (!dirty) setDraft(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const patch = useCallback((changes: Partial<PortfolioData>) => {
    setDraft((current) => ({ ...current, ...changes }));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const stored = await saveContent(sanitizePortfolioData(draft));
      updateData(stored);
      setDraft(stored);
      setSavedAt(Date.now());
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Browsers only honour this on a real interaction, which is what we want:
  // it warns on tab-close, not on programmatic navigation.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
```

Then change the signed-in view's body: keep the header and Sign out button, replace the
counts paragraph and the Back link with:

```tsx
        <ProfileEditor draft={draft} patch={patch} />

        <SaveBar
          dirty={dirty}
          saving={saving}
          error={saveError}
          savedAt={savedAt}
          onSave={save}
          onDiscard={() => setDraft(data)}
        />
```

Change `const DashboardPage: React.FC<DashboardPageProps> = ({ data }) => {` to destructure
both props: `({ data, updateData })`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build && npm test`

- [ ] **Step 4: Commit, push, and verify the round trip in production**

```bash
git add pages/DashboardPage.tsx pages/dashboard/ProfileEditor.tsx
git commit -m "Add profile editor with draft state and saving"
git push origin main
```

After deploy: sign in, change the tagline, Save, confirm the save bar reports "Saved", then
open the site in a private window and confirm the new tagline appears. This is also the first
real proof the `PUT` path persists to Blob.

---

## Task 4: The generic collection editor

**Files:**
- Create: `lib/editorSchema.ts`
- Create: `lib/editorSchema.test.ts`
- Create: `pages/dashboard/CollectionEditor.tsx`

- [ ] **Step 1: Write the failing schema test**

Create `lib/editorSchema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { INITIAL_DATA } from '../constants.js';
import { COLLECTIONS } from './editorSchema.js';

describe('collection specs', () => {
  it('covers every editable collection', () => {
    expect(COLLECTIONS.map((c) => c.key).sort()).toEqual(
      ['blogs', 'gallery', 'process', 'projects', 'services', 'social', 'tools'].sort(),
    );
  });

  it('names only fields that exist on the seeded data', () => {
    for (const spec of COLLECTIONS) {
      const sample = (INITIAL_DATA as any)[spec.key][0];
      if (!sample) continue;
      for (const field of spec.fields) {
        expect(Object.keys(sample), `${spec.key}.${field.key}`).toContain(field.key);
      }
    }
  });

  it('gives every collection a label and a title field', () => {
    for (const spec of COLLECTIONS) {
      expect(spec.label.length).toBeGreaterThan(0);
      expect(spec.fields.some((f) => f.key === spec.titleField)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./editorSchema.js`.

- [ ] **Step 3: Create `lib/editorSchema.ts`**

```ts
import { PortfolioData } from '../types.js';

export type FieldKind = 'text' | 'textarea' | 'image';

export interface FieldSpec {
  key: string;
  label: string;
  kind?: FieldKind;
  rows?: number;
}

export interface CollectionSpec {
  /** Key on PortfolioData holding the array. */
  key: 'projects' | 'services' | 'blogs' | 'gallery' | 'tools' | 'process' | 'social';
  label: string;
  /** Field shown as the row heading in the collapsed list. */
  titleField: string;
  fields: FieldSpec[];
}

/**
 * Describes each collection so one editor component can render all of them.
 * Field keys are asserted against INITIAL_DATA in the tests, which is what
 * keeps a typo here from silently producing an input bound to nothing.
 */
export const COLLECTIONS: CollectionSpec[] = [
  {
    key: 'projects',
    label: 'Projects',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'client', label: 'Client' },
      { key: 'category', label: 'Category' },
      { key: 'year', label: 'Year' },
      { key: 'image', label: 'Image', kind: 'image' },
      { key: 'description', label: 'Description', kind: 'textarea', rows: 3 },
      { key: 'caseStudy', label: 'Case study', kind: 'textarea', rows: 8 },
    ],
  },
  {
    key: 'services',
    label: 'Services',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'icon', label: 'Icon name' },
      { key: 'image', label: 'Image', kind: 'image' },
      { key: 'description', label: 'Description', kind: 'textarea', rows: 3 },
    ],
  },
  {
    key: 'blogs',
    label: 'Journal',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'date', label: 'Date' },
      { key: 'readTime', label: 'Read time' },
      { key: 'image', label: 'Image', kind: 'image' },
      { key: 'excerpt', label: 'Excerpt', kind: 'textarea', rows: 3 },
      { key: 'content', label: 'Content', kind: 'textarea', rows: 12 },
    ],
  },
  {
    key: 'gallery',
    label: 'Gallery',
    titleField: 'caption',
    fields: [
      { key: 'caption', label: 'Caption' },
      // Free text rather than a select: spanFor() in LandingPage has a default
      // branch, so an unrecognised value renders the square tile instead of
      // breaking the mosaic. Not worth a constrained input.
      { key: 'size', label: 'Size (sm / md / lg)' },
      { key: 'image', label: 'Image', kind: 'image' },
    ],
  },
  {
    key: 'tools',
    label: 'Tools',
    titleField: 'name',
    fields: [
      { key: 'name', label: 'Name' },
      { key: 'iconName', label: 'Icon name' },
    ],
  },
  {
    key: 'process',
    label: 'Process',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description', kind: 'textarea', rows: 3 },
    ],
  },
  {
    key: 'social',
    label: 'Social links',
    titleField: 'label',
    fields: [
      { key: 'label', label: 'Label' },
      { key: 'url', label: 'URL — leave empty to show it as inert' },
    ],
  },
];

/** A blank item with every field of a spec present as an empty string. */
export const emptyItem = (spec: CollectionSpec): Record<string, string> => {
  const item: Record<string, string> = { id: crypto.randomUUID() };
  for (const field of spec.fields) item[field.key] = '';
  return item;
};

export type CollectionKey = CollectionSpec['key'];
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS — 3 schema tests, 37 total.

- [ ] **Step 5: Create `pages/dashboard/CollectionEditor.tsx`**

```tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { CollectionSpec, emptyItem } from '../../lib/editorSchema';
import Field from '../../components/dashboard/Field';
import ImageField from '../../components/dashboard/ImageField';

interface CollectionEditorProps {
  spec: CollectionSpec;
  items: Record<string, any>[];
  onChange: (items: Record<string, any>[]) => void;
}

const CollectionEditor: React.FC<CollectionEditorProps> = ({ spec, items, onChange }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const replace = (index: number, item: Record<string, any>) =>
    onChange(items.map((existing, i) => (i === index ? item : existing)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = () => {
    const item = emptyItem(spec);
    onChange([...items, item]);
    setOpenId(item.id);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="mono bracket text-[var(--grey-1)]">
          {spec.label} — {items.length}
        </p>
        <button onClick={add} className="mono flex items-center gap-2 text-[var(--grey-1)] hover:text-[var(--ink)]">
          <Plus size={14} /> Add
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const id = String(item.id ?? index);
          const open = openId === id;

          return (
            <div key={id} className="surface-inset overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4">
                <button
                  onClick={() => setOpenId(open ? null : id)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  <span className="text-sm font-medium">
                    {item[spec.titleField] || <span className="text-[var(--grey-2)]">Untitled</span>}
                  </span>
                </button>

                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="mono text-[var(--grey-2)] hover:text-[var(--ink)] disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label="Move down"
                  className="mono text-[var(--grey-2)] hover:text-[var(--ink)] disabled:opacity-30"
                >
                  ↓
                </button>

                {confirmingId === id ? (
                  <button
                    onClick={() => {
                      onChange(items.filter((_, i) => i !== index));
                      setConfirmingId(null);
                    }}
                    className="mono text-[var(--ink)] underline"
                  >
                    Really?
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmingId(id)}
                    aria-label="Delete"
                    className="text-[var(--grey-2)] hover:text-[var(--ink)]"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {open && (
                <div className="grid gap-5 border-t border-[var(--hairline)] px-5 py-6">
                  {spec.fields.map((field) =>
                    field.kind === 'image' ? (
                      <ImageField
                        key={field.key}
                        label={field.label}
                        value={String(item[field.key] ?? '')}
                        onChange={(value) => replace(index, { ...item, [field.key]: value })}
                      />
                    ) : (
                      <Field
                        key={field.key}
                        label={field.label}
                        kind={field.kind === 'textarea' ? 'textarea' : 'text'}
                        rows={field.rows}
                        value={String(item[field.key] ?? '')}
                        onChange={(value) => replace(index, { ...item, [field.key]: value })}
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <p className="mono py-8 text-center text-[var(--grey-2)]">Nothing here yet.</p>
        )}
      </div>
    </div>
  );
};

export default CollectionEditor;
```

- [ ] **Step 6: Commit**

```bash
git add lib/editorSchema.ts lib/editorSchema.test.ts pages/dashboard/CollectionEditor.tsx
git commit -m "Add schema-driven collection editor"
```

Note: this does not build yet — `ImageField` arrives in Task 5. Do not push until then.

---

## Task 5: Image uploads

**Files:**
- Create: `api/upload.ts`
- Create: `api/upload.test.ts`
- Create: `services/uploadApi.ts`
- Create: `components/dashboard/ImageField.tsx`

- [ ] **Step 1: Write the failing upload-route test**

Create `api/upload.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIE_NAME, signToken } from './_lib/session.js';

const SECRET = 'e'.repeat(64);

describe('/api/upload', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SESSION_SECRET = SECRET;
  });

  it('rejects an unauthenticated request', async () => {
    const { POST } = await import('./upload.js');
    const response = await POST(
      new Request('https://example.com/api/upload', { method: 'POST', body: '{}' }),
    );
    expect(response.status).toBe(401);
  });

  it('rejects a request whose cookie does not verify', async () => {
    const { POST } = await import('./upload.js');
    const response = await POST(
      new Request('https://example.com/api/upload', {
        method: 'POST',
        headers: { cookie: `${COOKIE_NAME}=forged` },
        body: '{}',
      }),
    );
    expect(response.status).toBe(401);
  });

  it('returns 400 rather than throwing on a malformed body', async () => {
    const { POST } = await import('./upload.js');
    const response = await POST(
      new Request('https://example.com/api/upload', {
        method: 'POST',
        headers: { cookie: `${COOKIE_NAME}=${signToken(SECRET, 3600)}` },
        body: 'not json',
      }),
    );
    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./upload.js`.

- [ ] **Step 3: Create `api/upload.ts`**

```ts
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { error, json, readJson } from './_lib/http.js';
import { isAuthenticated } from './_lib/session.js';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Mints a short-lived token so the browser uploads straight to Blob.
 *
 * Files do not pass through this function: serverless request bodies cap at
 * 4.5 MB, which a portfolio image can exceed. Type and size limits are set
 * here, server-side, so the client cannot widen them.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isAuthenticated(request, process.env.SESSION_SECRET)) {
    return error('Unauthorized', 401);
  }

  const body = await readJson(request);
  if (!body || typeof body !== 'object') {
    return error('Expected a JSON body', 400);
  }

  try {
    const result = await handleUpload({
      request,
      body: body as HandleUploadBody,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
      }),
    });
    return json(result);
  } catch (cause) {
    console.error('Upload token generation failed:', cause);
    return error(cause instanceof Error ? cause.message : 'Upload failed', 400);
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS — 3 upload tests, 40 total.

- [ ] **Step 5: Create `services/uploadApi.ts`**

```ts
import { upload } from '@vercel/blob/client';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Uploads an image and returns its public URL.
 *
 * Checks size and type before contacting the server purely to give a fast,
 * clear message; the authoritative limits live in /api/upload.
 */
export const uploadImage = async (file: File): Promise<string> => {
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Use a JPEG, PNG, WebP or AVIF image.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is 5 MB.`);
  }

  const blob = await upload(`media/${file.name}`, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
  });

  return blob.url;
};
```

- [ ] **Step 6: Create `components/dashboard/ImageField.tsx`**

```tsx
import React, { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { uploadImage } from '../../services/uploadApi';

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

const ImageField: React.FC<ImageFieldProps> = ({ label, value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="mono mb-2 block text-[var(--grey-1)]">{label}</span>

      <div className="flex items-start gap-4">
        {value ? (
          <img
            src={value}
            alt=""
            className="h-24 w-24 shrink-0 rounded-xl object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.opacity = '0.2';
            }}
          />
        ) : (
          <div className="mono flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-dashed border-[var(--hairline)] text-[var(--grey-2)]">
            None
          </div>
        )}

        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste a URL, or upload"
            className="mb-3 w-full rounded-xl border border-[var(--hairline)] bg-[var(--paper-pure)] px-4 py-3 text-sm outline-none focus:border-[var(--ink)]"
          />

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="mono flex items-center gap-2 rounded-full border border-[var(--hairline)] px-5 py-2.5 transition-colors hover:border-[var(--ink)] disabled:opacity-40"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {busy ? 'Uploading' : 'Upload'}
          </button>

          {error && (
            <p role="alert" className="mono mt-2 text-[var(--ink)]">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageField;
```

The text field stays alongside the upload button deliberately: existing content references
Unsplash URLs, and pasting a URL must keep working.

- [ ] **Step 7: Verify and commit**

Run: `npx tsc --noEmit && npm run build && npm test`
Expected: all pass, 40 tests.

```bash
git add api/upload.ts api/upload.test.ts services/uploadApi.ts components/dashboard/ImageField.tsx
git commit -m "Add image uploads via Blob client-upload"
```

---

## Task 6: Wire the collections into the dashboard

**Files:**
- Modify: `pages/DashboardPage.tsx`

- [ ] **Step 1: Add section navigation and render the editors**

Add imports:

```ts
import { COLLECTIONS } from '../lib/editorSchema';
import CollectionEditor from './dashboard/CollectionEditor';
```

Add state next to the other `useState` calls:

```tsx
  const [section, setSection] = useState<string>('profile');
```

Insert this above `<ProfileEditor …>` in the signed-in view:

```tsx
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
```

Then replace the bare `<ProfileEditor draft={draft} patch={patch} />` with:

```tsx
        {section === 'profile' ? (
          <ProfileEditor draft={draft} patch={patch} />
        ) : (
          (() => {
            const spec = COLLECTIONS.find((c) => c.key === section);
            if (!spec) return null;
            return (
              <CollectionEditor
                spec={spec}
                items={draft[spec.key] as Record<string, any>[]}
                onChange={(items) => patch({ [spec.key]: items } as Partial<PortfolioData>)}
              />
            );
          })()
        )}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run build && npm test`

- [ ] **Step 3: Commit and push**

```bash
git add pages/DashboardPage.tsx
git commit -m "Wire collection editors into the dashboard"
git push origin main
```

- [ ] **Step 4: Verify in production**

Sign in, and for each of the eight sections: open an item, edit a field, Save, then confirm the
change on the public site. Add a project with an uploaded image and confirm it renders on
`/works`. Delete it again and Save.

---

## Task 7: Server-side AI helpers

Restores the two helpers deleted in Plan 1, with the key server-side.

**Files:**
- Create: `api/ai/blog.ts`
- Create: `api/ai/case-study.ts`
- Create: `api/ai/blog.test.ts`
- Create: `services/aiApi.ts`
- Modify: `pages/dashboard/CollectionEditor.tsx`
- Modify: `package.json`

- [ ] **Step 1: Reinstall the SDK as a server dependency**

```bash
npm install @google/genai
```

- [ ] **Step 2: Write the failing test**

Create `api/ai/blog.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIE_NAME, signToken } from '../_lib/session.js';

const SECRET = 'f'.repeat(64);

const post = (cookie?: string, body: unknown = { topic: 'Design systems' }) =>
  new Request('https://example.com/api/ai/blog', {
    method: 'POST',
    headers: cookie ? { cookie, 'content-type': 'application/json' } : { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('/api/ai/blog', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SESSION_SECRET = SECRET;
    process.env.GEMINI_API_KEY = '';
  });

  it('rejects an unauthenticated request', async () => {
    const { POST } = await import('./blog.js');
    expect((await POST(post())).status).toBe(401);
  });

  it('reports 503 when no API key is configured', async () => {
    const { POST } = await import('./blog.js');
    const response = await POST(post(`${COOKIE_NAME}=${signToken(SECRET, 3600)}`));
    expect(response.status).toBe(503);
  });

  it('rejects a missing topic', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const { POST } = await import('./blog.js');
    const response = await POST(post(`${COOKIE_NAME}=${signToken(SECRET, 3600)}`, {}));
    expect(response.status).toBe(400);
  });
});
```

The empty body goes to `post`, not to `POST` — `POST` takes only a `Request`.

- [ ] **Step 3: Run to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./blog.js`.

- [ ] **Step 4: Create `api/ai/blog.ts`**

```ts
import { GoogleGenAI, Type } from '@google/genai';
import { error, json, readJson } from '../_lib/http.js';
import { isAuthenticated } from '../_lib/session.js';

export async function POST(request: Request): Promise<Response> {
  if (!isAuthenticated(request, process.env.SESSION_SECRET)) {
    return error('Unauthorized', 401);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // 503 rather than 500: the feature is unavailable, the request was fine.
    return error('AI generation is not configured', 503);
  }

  const body = await readJson(request);
  const topic =
    body && typeof body === 'object' ? (body as Record<string, unknown>).topic : undefined;
  if (typeof topic !== 'string' || topic.trim().length === 0) {
    return error('A topic is required', 400);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a modern, professional blog post excerpt and content for a design portfolio based on the topic: "${topic}". Make it insightful, bold, and trend-focused.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            excerpt: { type: Type.STRING },
            content: { type: Type.STRING },
          },
          required: ['excerpt', 'content'],
        },
      },
    });

    const text = response.text;
    if (!text) return error('The model returned nothing', 502);
    return json(JSON.parse(text));
  } catch (cause) {
    console.error('Gemini blog generation failed:', cause);
    return error('Generation failed', 502);
  }
}
```

- [ ] **Step 5: Create `api/ai/case-study.ts`**

```ts
import { GoogleGenAI } from '@google/genai';
import { error, json, readJson } from '../_lib/http.js';
import { isAuthenticated } from '../_lib/session.js';

export async function POST(request: Request): Promise<Response> {
  if (!isAuthenticated(request, process.env.SESSION_SECRET)) {
    return error('Unauthorized', 401);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return error('AI generation is not configured', 503);

  const body = (await readJson(request)) as Record<string, unknown> | undefined;
  const title = typeof body?.title === 'string' ? body.title : '';
  const description = typeof body?.description === 'string' ? body.description : '';
  if (!title.trim()) return error('A title is required', 400);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Refine this design case study. Title: ${title}. Initial Description: ${description}. Explain the challenge, the approach taken, and the result in a compelling way for a senior design portfolio. Return the content as a single markdown-style string.`,
    });

    const text = response.text;
    if (!text) return error('The model returned nothing', 502);
    return json({ caseStudy: text });
  } catch (cause) {
    console.error('Gemini case-study refinement failed:', cause);
    return error('Generation failed', 502);
  }
}
```

- [ ] **Step 6: Run to verify tests pass**

Run: `npm test`
Expected: PASS — 3 AI tests, 43 total.

- [ ] **Step 7: Create `services/aiApi.ts`**

```ts
const call = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error ?? `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const generateBlog = (topic: string) =>
  call<{ excerpt: string; content: string }>('/api/ai/blog', { topic });

export const refineCaseStudy = (title: string, description: string) =>
  call<{ caseStudy: string }>('/api/ai/case-study', { title, description });
```

- [ ] **Step 8: Add the helper buttons to `CollectionEditor.tsx`**

Add imports:

```ts
import { Sparkles } from 'lucide-react';
import { generateBlog, refineCaseStudy } from '../../services/aiApi';
```

Add state inside the component:

```tsx
  const [aiBusyId, setAiBusyId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
```

Then inside the expanded-item `<div className="grid gap-5 …">`, after the mapped fields, add:

```tsx
                  {(spec.key === 'blogs' || spec.key === 'projects') && (
                    <div>
                      <button
                        disabled={aiBusyId === id}
                        onClick={async () => {
                          setAiBusyId(id);
                          setAiError(null);
                          try {
                            if (spec.key === 'blogs') {
                              const result = await generateBlog(String(item.title ?? ''));
                              replace(index, { ...item, ...result });
                            } else {
                              const result = await refineCaseStudy(
                                String(item.title ?? ''),
                                String(item.description ?? ''),
                              );
                              replace(index, { ...item, caseStudy: result.caseStudy });
                            }
                          } catch (cause) {
                            setAiError(cause instanceof Error ? cause.message : 'Generation failed');
                          } finally {
                            setAiBusyId(null);
                          }
                        }}
                        className="mono flex items-center gap-2 rounded-full border border-[var(--hairline)] px-5 py-2.5 transition-colors hover:border-[var(--ink)] disabled:opacity-40"
                      >
                        <Sparkles size={14} />
                        {aiBusyId === id
                          ? 'Generating'
                          : spec.key === 'blogs'
                            ? 'Draft from title'
                            : 'Refine case study'}
                      </button>
                      {aiError && (
                        <p role="alert" className="mono mt-2 text-[var(--ink)]">
                          {aiError}
                        </p>
                      )}
                    </div>
                  )}
```

Generated text lands in the draft, not the published document — it is not saved until Save
is pressed, so a bad generation costs nothing.

- [ ] **Step 9: Verify and commit**

Run: `npx tsc --noEmit && npm run build && npm test`

```bash
git add api/ai services/aiApi.ts pages/dashboard/CollectionEditor.tsx package.json package-lock.json
git commit -m "Add server-side Gemini helpers for journal drafts and case studies"
git push origin main
```

- [ ] **Step 10: Confirm the key is not in the client bundle**

```bash
npm run build && grep -rl "AIza\|GoogleGenAI" dist/ || echo "clean"
```

Expected: `clean`. The SDK must appear only in the function bundles.

**Note:** these routes return 503 until `GEMINI_API_KEY` is set in Vercel. That is expected and
the buttons surface it as "AI generation is not configured".

---

## Task 8: End-to-end verification

- [ ] **Step 1: Full local check**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: 43 tests pass, no type errors, build succeeds.

- [ ] **Step 2: Confirm the deployment is READY**

Read the build logs if it failed; do not diagnose from the site.

- [ ] **Step 3: Auth boundary — every admin route must reject anonymous callers**

```bash
B=https://www.ashimkafle.com.np
for r in "PUT /api/content" "POST /api/upload" "POST /api/ai/blog" "POST /api/ai/case-study"; do
  set -- $r
  printf "%-28s %s\n" "$r" "$(curl -sS -o /dev/null -w '%{http_code}' -X $1 -H 'content-type: application/json' -d '{}' $B$2)"
done
```

Expected: `401` for all four.

- [ ] **Step 4: Signed-in round trip**

Sign in at `/dashboard`. For each section, make one edit and Save. Confirm each change on the
public site in a private window. Upload an image to a new project and confirm it renders.

- [ ] **Step 5: Confirm unsaved-work protection**

Edit a field without saving, then try to close the tab. The browser must warn. Then press
Discard and confirm the field reverts.

- [ ] **Step 6: Run the smoke test**

```bash
node scripts/verify-auth.mjs "your password"
```

Expected: all checks pass.

---

## Definition of done

- `/dashboard` requires a password and shows a real editor
- All eight sections editable; saves appear on the public site
- Images upload from the browser to Blob and render
- `PUT /api/content`, `POST /api/upload` and both `/api/ai/*` routes return 401 anonymously
- No API key in `dist/`
- Unsaved changes warn on tab close; Discard reverts
- `npm test` passes

## Not in this plan

- Contact form
- SEO / prerendering
- Replacing the Tailwind CDN with a build step
- Per-item published/draft visibility
