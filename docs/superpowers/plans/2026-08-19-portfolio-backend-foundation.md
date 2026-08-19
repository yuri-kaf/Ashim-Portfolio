# Portfolio Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded, browser-cached portfolio content with a Vercel Blob-backed content API behind password auth, and serve the site on real paths instead of hash URLs.

**Architecture:** The existing Vite SPA gains Vercel serverless functions under `/api` using the Web Handler signature (`export async function GET(request: Request)`). Content is a single JSON document in Vercel Blob at `content/portfolio.json`, read publicly through `GET /api/content` and written by an authenticated `PUT`. Auth is one admin password (scrypt hash in an env var) exchanged for an HMAC-signed session cookie. `HashRouter` becomes `BrowserRouter`, with a `vercel.json` rewrite so deep links resolve server-side.

**Tech Stack:** Vite 6, React 19, react-router-dom 7, `@vercel/blob`, Node 24 `node:crypto`, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-19-portfolio-backend-design.md`

**Deploys to production on every push to `main`.** Every task below is safe to deploy on its own: until the Blob store and env vars exist, `GET /api/content` fails and the client falls back to `INITIAL_DATA`, so visitors see today's site.

---

## File Structure

**Shared between client and server** (imported by both — must stay dependency-free):
- `lib/sanitize.ts` — validates and normalises an unknown value into `PortfolioData`. Moved out of `App.tsx`.
- `types.ts` *(modify)* — gains `SocialLink` and `PortfolioData.social`.

**Server-only** (under `api/_lib/`; Vercel does not route files whose directory starts with `_`):
- `api/_lib/http.ts` — JSON response helpers, cookie parsing.
- `api/_lib/password.ts` — scrypt hash + timing-safe verify.
- `api/_lib/session.ts` — sign/verify the session token, build/clear the `Set-Cookie` header.
- `api/_lib/blob.ts` — read and write the content document in Blob.

**Routes:**
- `api/content.ts` — `GET` (public) and `PUT` (admin).
- `api/auth/login.ts`, `api/auth/logout.ts`, `api/auth/session.ts`.

**Client:**
- `services/contentApi.ts` — `fetchContent()` wrapper.
- `components/Navbar.tsx`, `components/Footer.tsx` — extracted from `App.tsx`, which currently holds four responsibilities in ~450 lines.
- `pages/NotFoundPage.tsx` — there is no catch-all route today.

**Config / scripts:**
- `vercel.json`, `vitest.config.ts`
- `scripts/hash-password.mjs` — generates `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` locally.
- `scripts/seed-content.mjs` — uploads `INITIAL_DATA` to Blob once.

**Deleted:**
- `services/geminiService.ts` — unused by any file, and the reason an API key is inlined into the client bundle.

---

## Task 1: Test infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest@^3.2.4
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
  },
});
```

- [ ] **Step 3: Add the test script**

In `package.json`, inside `"scripts"`, add:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 4: Verify the runner starts**

Run: `npm test`
Expected: exits 1 with "No test files found" — the runner works, there are no tests yet.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "Add Vitest test infrastructure"
```

---

## Task 2: Social links in the type model

**Files:**
- Modify: `types.ts`
- Modify: `constants.tsx`

- [ ] **Step 1: Add the `SocialLink` type**

In `types.ts`, above `export interface PortfolioData`:

```ts
/**
 * A social profile link. An entry with an empty `url` renders as an inert
 * label rather than a dead link — the hardcoded "#" placeholders used to do
 * this, and `#` is no longer safe now that the app uses real paths.
 */
export interface SocialLink {
  id: string;
  label: string;
  url: string;
}
```

- [ ] **Step 2: Add the field to `PortfolioData`**

In `types.ts`, inside `PortfolioData`, after `gallery: GalleryItem[];`:

```ts
  social: SocialLink[];
```

- [ ] **Step 3: Seed the field**

In `constants.tsx`, inside the `INITIAL_DATA` object, immediately before the closing `}`  of the object (after the `vibe` block), add:

```ts
  social: [
    {
      id: 'linkedin',
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/ashim-kafle-676a312a5/',
    },
    { id: 'dribbble', label: 'Dribbble', url: '' },
    { id: 'instagram', label: 'Instagram', url: '' },
  ],
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors. If it reports `social` missing on an object literal, a second `PortfolioData` literal exists somewhere — add the same field there.

- [ ] **Step 5: Commit**

```bash
git add types.ts constants.tsx
git commit -m "Add social links to the portfolio content model"
```

---

## Task 3: Extract and test the sanitizer

The function currently called `performNuclearSanitize` lives inside `App.tsx`. It becomes the single validator used by both the client and the `PUT` handler, so it must move to a shared module and grow a `social` case.

**Files:**
- Create: `lib/sanitize.ts`
- Create: `lib/sanitize.test.ts`
- Modify: `App.tsx`

- [ ] **Step 1: Write the failing tests**

Create `lib/sanitize.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { INITIAL_DATA } from '../constants';
import { sanitizePortfolioData } from './sanitize';

describe('sanitizePortfolioData', () => {
  it('returns defaults for null', () => {
    expect(sanitizePortfolioData(null)).toEqual(INITIAL_DATA);
  });

  it('returns defaults for an array', () => {
    expect(sanitizePortfolioData([1, 2, 3])).toEqual(INITIAL_DATA);
  });

  it('keeps a valid name and falls back on a non-string name', () => {
    expect(sanitizePortfolioData({ name: 'Someone' }).name).toBe('Someone');
    expect(sanitizePortfolioData({ name: 42 }).name).toBe(INITIAL_DATA.name);
  });

  it('drops non-object entries from collections', () => {
    const result = sanitizePortfolioData({
      projects: [{ id: '1', title: 'Keep' }, null, 'nope', 7],
    });
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].title).toBe('Keep');
  });

  it('falls back to defaults when a collection is not an array', () => {
    expect(sanitizePortfolioData({ projects: 'nope' }).projects).toEqual(
      INITIAL_DATA.projects,
    );
  });

  it('rejects an unknown availability value', () => {
    expect(sanitizePortfolioData({ availability: 'sleeping' }).availability).toBe(
      INITIAL_DATA.availability,
    );
    expect(sanitizePortfolioData({ availability: 'busy' }).availability).toBe('busy');
  });

  it('keeps only string entries in the vibe philosophy', () => {
    const result = sanitizePortfolioData({
      vibe: { title: 'T', description: 'D', philosophy: ['a', 3, null, 'b'] },
    });
    expect(result.vibe.philosophy).toEqual(['a', 'b']);
  });

  it('coerces social entries and drops unusable ones', () => {
    const result = sanitizePortfolioData({
      social: [
        { id: 'x', label: 'X', url: 'https://x.com/a' },
        { id: 'y', label: 'Y' },
        { label: 'no id', url: 'https://z.com' },
        null,
      ],
    });
    expect(result.social).toEqual([
      { id: 'x', label: 'X', url: 'https://x.com/a' },
      { id: 'y', label: 'Y', url: '' },
    ]);
  });

  it('produces a value that survives a second pass unchanged', () => {
    const once = sanitizePortfolioData({ name: 'Someone', projects: [] });
    expect(sanitizePortfolioData(once)).toEqual(once);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `./sanitize`.

- [ ] **Step 3: Create `lib/sanitize.ts`**

```ts
import { INITIAL_DATA } from '../constants';
import { PortfolioData, SocialLink } from '../types';

/** Keeps only entries that are plain objects — guards against nulls in arrays. */
const objectsOnly = <T>(value: unknown, fallback: T[]): T[] =>
  Array.isArray(value)
    ? (value.filter((item) => item && typeof item === 'object' && !Array.isArray(item)) as T[])
    : fallback;

const stringOr = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback;

/** A social entry is unusable without an id and a label; url may be empty. */
const sanitizeSocial = (value: unknown): SocialLink[] => {
  if (!Array.isArray(value)) return INITIAL_DATA.social;
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .filter((item) => typeof item.id === 'string' && typeof item.label === 'string')
    .map((item) => ({
      id: item.id as string,
      label: item.label as string,
      url: stringOr(item.url, ''),
    }));
};

/**
 * Normalises an unknown value into a complete `PortfolioData`.
 *
 * Runs on both sides: the client uses it on whatever the API returns, and the
 * `PUT /api/content` handler uses it before writing. Sharing one implementation
 * is what stops the stored document from drifting out of shape with `types.ts`.
 *
 * Idempotent by construction — sanitizing an already-sanitized value is a no-op.
 */
export const sanitizePortfolioData = (input: unknown): PortfolioData => {
  const base = INITIAL_DATA;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return base;
  }

  const dirty = input as Record<string, any>;
  const dirtyCompany = dirty.company && typeof dirty.company === 'object' ? dirty.company : {};
  const dirtyVibe = dirty.vibe && typeof dirty.vibe === 'object' ? dirty.vibe : {};

  return {
    name: stringOr(dirty.name, base.name),
    role: stringOr(dirty.role, base.role),
    tagline: stringOr(dirty.tagline, base.tagline),
    company: {
      name: stringOr(dirtyCompany.name, base.company.name),
      role: stringOr(dirtyCompany.role, base.company.role),
      description: stringOr(dirtyCompany.description, base.company.description),
      url: stringOr(dirtyCompany.url, base.company.url ?? ''),
    },
    availability: ['available', 'busy', 'vacation'].includes(dirty.availability)
      ? dirty.availability
      : base.availability,
    projects: objectsOnly(dirty.projects, base.projects),
    services: objectsOnly(dirty.services, base.services),
    blogs: objectsOnly(dirty.blogs, base.blogs),
    process: objectsOnly(dirty.process, base.process),
    tools: objectsOnly(dirty.tools, base.tools),
    gallery: objectsOnly(dirty.gallery, base.gallery),
    social: sanitizeSocial(dirty.social),
    vibe: {
      title: stringOr(dirtyVibe.title, base.vibe.title),
      description: stringOr(dirtyVibe.description, base.vibe.description),
      philosophy: Array.isArray(dirtyVibe.philosophy)
        ? dirtyVibe.philosophy.filter((entry: unknown) => typeof entry === 'string')
        : base.vibe.philosophy,
    },
  };
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — 9 tests.

- [ ] **Step 5: Point `App.tsx` at the shared module**

In `App.tsx`: delete the whole `performNuclearSanitize` function (including its doc comment), add to the imports:

```ts
import { sanitizePortfolioData } from './lib/sanitize';
```

then replace both call sites — the one inside the `useState` initialiser and the one inside `updateData` — with `sanitizePortfolioData(...)`.

- [ ] **Step 6: Verify the app still compiles and builds**

Run: `npx tsc --noEmit && npm run build`
Expected: no type errors; build succeeds. `grep -n performNuclearSanitize App.tsx` returns nothing.

- [ ] **Step 7: Commit**

```bash
git add lib/sanitize.ts lib/sanitize.test.ts App.tsx
git commit -m "Extract content sanitizer into a shared, tested module"
```

---

## Task 4: Render social links from content

Social links are hardcoded in two places. Both must read the model, or the dashboard will appear to have no effect on one of them.

**Files:**
- Create: `components/Footer.tsx`
- Create: `components/Navbar.tsx`
- Modify: `App.tsx`
- Modify: `pages/LandingPage.tsx:590-605`

- [ ] **Step 1: Move `Navbar` into its own file**

Create `components/Navbar.tsx`. Cut the entire `Navbar` component out of `App.tsx` verbatim and paste it in, then add at the top:

```tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { HoverSwap } from './MotionExtras';
import { useNavTheme } from './useNavTheme';
import { INITIAL_DATA } from '../constants';
import { PortfolioData } from '../types';
```

and at the bottom:

```tsx
export default Navbar;
```

- [ ] **Step 2: Move `Footer` into its own file, reading social from data**

Create `components/Footer.tsx` by cutting the `Footer` component out of `App.tsx`, with these changes: the imports

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { INITIAL_DATA } from '../constants';
import { PortfolioData } from '../types';
```

then, inside the component, above the `return`:

```tsx
  const social = data?.social?.length ? data.social : INITIAL_DATA.social;
```

then replace the entire `Social` column's `<div className="flex flex-col gap-2">…</div>` — the block that maps over the hardcoded `LinkedIn`/`Dribbble`/`Instagram` array — with:

```tsx
            <div className="flex flex-col gap-2">
              {social.map((s) =>
                s.url ? (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono text-white/75 hover:text-white"
                  >
                    {s.label}
                  </a>
                ) : (
                  <span
                    key={s.id}
                    aria-disabled="true"
                    title="Link coming soon"
                    className="mono cursor-default text-white/35"
                  >
                    {s.label}
                  </span>
                ),
              )}
            </div>
```

Delete the stale `// TODO: real URLs…` comment that explained the `#` placeholders — the constraint it describes no longer exists. End the file with:

```tsx
export default Footer;
```

- [ ] **Step 3: Import both back into `App.tsx`**

In `App.tsx`, add:

```ts
import Navbar from './components/Navbar';
import Footer from './components/Footer';
```

and remove the now-unused `Menu`, `X`, `motion`, `HoverSwap` and `useNavTheme` imports if nothing else in the file uses them (check with `grep -n "Menu\|HoverSwap\|useNavTheme\|motion\." App.tsx`).

- [ ] **Step 4: Do the same in `LandingPage.tsx`**

Add the import (the file does not currently import it):

```ts
import { INITIAL_DATA } from '../constants';
```

Delete the `isPlaceholder` helper on line 37 — `href === '#'` was only ever a stand-in for
"no link", which the model now expresses as an empty `url`:

```ts
const isPlaceholder = (href: string) => !href || href === '#';
```

Then replace the whole `Elsewhere` block (lines ~592-623) with:

```tsx
        <Reveal delay={0.2}>
          <p className="mono mb-4 text-[var(--grey-1)]">Elsewhere</p>
          <div className="flex flex-col gap-2">
            {(data?.social?.length ? data.social : INITIAL_DATA.social).map((s) =>
              s.url ? (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-wipe w-fit text-xl font-medium md:text-2xl"
                >
                  {s.label}
                </a>
              ) : (
                <span
                  key={s.id}
                  aria-disabled="true"
                  title="Link coming soon"
                  className="w-fit cursor-default text-xl font-medium text-[var(--grey-2)] md:text-2xl"
                >
                  {s.label}
                </span>
              ),
            )}
          </div>
        </Reveal>
```

Note the branches are ordered link-first here, the opposite of the original — `s.url` is the
positive test where `isPlaceholder` was a negative one. Verify with
`grep -n "isPlaceholder" pages/LandingPage.tsx`, which must return nothing.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run build && npm test`
Expected: all pass. Then `grep -rn "'#'" App.tsx components/Footer.tsx pages/LandingPage.tsx` returns nothing.

- [ ] **Step 6: Commit**

```bash
git add App.tsx components/Navbar.tsx components/Footer.tsx pages/LandingPage.tsx
git commit -m "Render social links from content and split Navbar/Footer out of App"
```

---

## Task 5: Clean URLs

This is the user-visible fix: `https://www.ashimkafle.com.np/works` currently returns 404.

**Files:**
- Modify: `index.tsx`
- Modify: `App.tsx`
- Modify: `index.html`
- Create: `vercel.json`
- Create: `pages/NotFoundPage.tsx`

- [ ] **Step 1: Create the 404 page**

Create `pages/NotFoundPage.tsx`:

```tsx
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
```

- [ ] **Step 2: Swap the router and add the legacy-hash shim**

Replace the contents of `index.tsx` with:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

/**
 * The site previously ran on HashRouter, so links like /#/works exist in
 * bookmarks, in shared messages and possibly in search results. The fragment
 * never reaches the server, so only the client can repair these — rewrite the
 * URL before React Router reads it, so the app mounts on the right route.
 */
const redirectLegacyHashUrl = () => {
  const { hash, pathname, search } = window.location;
  if (pathname === '/' && hash.startsWith('#/')) {
    window.history.replaceState(null, '', hash.slice(1) + search);
  }
};

redirectLegacyHashUrl();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
);
```

- [ ] **Step 3: Add the catch-all route**

In `App.tsx`, add the import:

```ts
import NotFoundPage from './pages/NotFoundPage';
```

and inside `<Routes>`, as the **last** child after the `/dashboard` route:

```tsx
      <Route path="*" element={<NotFoundPage />} />
```

- [ ] **Step 4: Create `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

The negative lookahead is what keeps `/api/*` reaching the functions; a blanket `/(.*)` rewrite would swallow them. Static assets under `/assets/*` are served before rewrites apply, so they need no exclusion.

- [ ] **Step 5: Add the canonical link**

In `index.html`, inside `<head>` directly after the `<title>` line:

```html
    <link rel="canonical" href="https://www.ashimkafle.com.np/" />
    <meta name="description" content="Ashim Kafle — product designer and digital marketer. Design that looks sharp and marketing that makes it sell." />
```

- [ ] **Step 6: Verify locally**

Run: `npm run build && npm run preview`
Then in another shell: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4173/works`
Expected: `200`. Also open `http://localhost:4173/#/works` in a browser and confirm the address bar becomes `/works`.

- [ ] **Step 7: Commit**

```bash
git add index.tsx App.tsx index.html vercel.json pages/NotFoundPage.tsx
git commit -m "Serve real paths instead of hash URLs"
```

- [ ] **Step 8: Push and verify in production**

```bash
git push origin main
```

Wait for the deployment to reach READY, then:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://www.ashimkafle.com.np/works
```

Expected: `200` (it returns `404` before this change). If it still 404s, the rewrite did not apply — check the deployment's build output before continuing.

---

## Task 6: Close the API key exposure

`services/geminiService.ts` is imported by no file — verify before deleting. It is the only reason `vite.config.ts` inlines a key into the client bundle.

**Files:**
- Delete: `services/geminiService.ts`
- Modify: `vite.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Confirm it is genuinely unused**

Run:

```bash
grep -rn "geminiService\|isAiAvailable\|generateBlogContent\|refineCaseStudy" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v "^./services/geminiService"
```

Expected: no output. If anything is listed, stop — the file is in use and this task needs revisiting.

- [ ] **Step 2: Delete the file and the `define` block**

```bash
git rm services/geminiService.ts
```

In `vite.config.ts`, delete the entire `define: { … }` property, including both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` lines. Nothing in the client may reference `process.env` afterwards — in a browser `process` is undefined, so a leftover reference would throw at runtime rather than fail the build.

- [ ] **Step 3: Remove the now-unused dependency**

```bash
npm uninstall @google/genai
```

Plan 2 reinstalls it as a server-side dependency for `/api/ai/*`.

- [ ] **Step 4: Verify no client code touches `process.env`**

Run:

```bash
grep -rn "process\.env" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v vitest.config | grep -v "^./api/" | grep -v "^./scripts/"
```

Expected: no output. Then `npm run build` — expected: succeeds.

- [ ] **Step 5: Confirm the key is gone from the bundle**

```bash
grep -rc "AIza" dist/assets/*.js || echo "no key in bundle"
```

Expected: `no key in bundle`.

- [ ] **Step 6: Commit**

```bash
git add -A vite.config.ts package.json package-lock.json services
git commit -m "Remove unused Gemini client and stop inlining the API key into the bundle"
```

---

## Task 7: Password hashing

**Files:**
- Create: `api/_lib/password.ts`
- Create: `api/_lib/password.test.ts`
- Create: `scripts/hash-password.mjs`

- [ ] **Step 1: Write the failing tests**

Create `api/_lib/password.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('verifies a correct password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('wrong password', hash)).toBe(false);
  });

  it('produces a different hash each time for the same password', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
    expect(await verifyPassword('same', a)).toBe(true);
    expect(await verifyPassword('same', b)).toBe(true);
  });

  it('returns false rather than throwing on a malformed hash', async () => {
    expect(await verifyPassword('anything', 'not-a-hash')).toBe(false);
    expect(await verifyPassword('anything', '')).toBe(false);
    expect(await verifyPassword('anything', 'scrypt$zzz$deadbeef')).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `./password`.

- [ ] **Step 3: Implement `api/_lib/password.ts`**

```ts
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/** Format: `scrypt$<salt-hex>$<key-hex>`. Salt travels with the hash. */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
};

/**
 * Constant-time comparison. Returns false on any malformed stored hash rather
 * than throwing, so a misconfigured env var denies access instead of turning
 * every login attempt into a 500.
 */
export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const parts = (stored ?? '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

  const [, saltHex, keyHex] = parts;
  if (!/^[0-9a-f]+$/i.test(saltHex) || !/^[0-9a-f]+$/i.test(keyHex)) return false;

  const expected = Buffer.from(keyHex, 'hex');
  if (expected.length !== KEY_LENGTH) return false;

  try {
    const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), KEY_LENGTH);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
};
```

- [ ] **Step 4: Run to verify they pass**

Run: `npm test`
Expected: PASS — 4 password tests plus the 9 sanitizer tests.

- [ ] **Step 5: Create the local generator script**

Create `scripts/hash-password.mjs`:

```js
/**
 * Generates the two auth environment variables locally, so the plaintext
 * password never leaves this machine.
 *
 * Usage: node scripts/hash-password.mjs "your chosen password"
 */
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your chosen password"');
  process.exit(1);
}
if (password.length < 16) {
  console.error('Refusing: use a password of at least 16 characters.');
  process.exit(1);
}

const salt = randomBytes(16);
const key = await scryptAsync(password, salt, 64);

console.log('\nAdd these to Vercel → Project → Settings → Environment Variables');
console.log('(all environments), then redeploy:\n');
console.log(`ADMIN_PASSWORD_HASH=scrypt$${salt.toString('hex')}$${key.toString('hex')}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString('hex')}`);
console.log('\nStore the password itself in your password manager. It is not recoverable.\n');
```

- [ ] **Step 6: Verify the script runs**

Run: `node scripts/hash-password.mjs "a-test-password-long-enough"`
Expected: prints an `ADMIN_PASSWORD_HASH=scrypt$…` line and a 64-character `SESSION_SECRET`. Discard this test output — do not use a password that has been typed into a shell for real.

- [ ] **Step 7: Commit**

```bash
git add api/_lib/password.ts api/_lib/password.test.ts scripts/hash-password.mjs
git commit -m "Add scrypt password hashing and a local env-var generator"
```

---

## Task 8: Session cookies

**Files:**
- Create: `api/_lib/session.ts`
- Create: `api/_lib/session.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `api/_lib/session.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  COOKIE_NAME,
  clearCookie,
  isAuthenticated,
  serializeCookie,
  signToken,
  verifyToken,
} from './session';

const SECRET = 'a'.repeat(64);

describe('signToken / verifyToken', () => {
  it('round-trips a valid token', () => {
    expect(verifyToken(signToken(SECRET, 3600), SECRET)).toBe(true);
  });

  it('rejects a token signed with a different secret', () => {
    expect(verifyToken(signToken(SECRET, 3600), 'b'.repeat(64))).toBe(false);
  });

  it('rejects an expired token', () => {
    expect(verifyToken(signToken(SECRET, -10), SECRET)).toBe(false);
  });

  it('rejects a tampered payload', () => {
    const [, signature] = signToken(SECRET, 3600).split('.');
    const forged = Buffer.from(JSON.stringify({ exp: 9999999999 }))
      .toString('base64url');
    expect(verifyToken(`${forged}.${signature}`, SECRET)).toBe(false);
  });

  it('rejects malformed input without throwing', () => {
    expect(verifyToken('', SECRET)).toBe(false);
    expect(verifyToken('nodot', SECRET)).toBe(false);
    expect(verifyToken('a.b.c', SECRET)).toBe(false);
    expect(verifyToken('!!!.!!!', SECRET)).toBe(false);
  });
});

describe('cookies', () => {
  it('marks the cookie httpOnly, Secure and SameSite=Lax', () => {
    const cookie = serializeCookie('token-value', 3600);
    expect(cookie).toContain(`${COOKIE_NAME}=token-value`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=3600');
  });

  it('expires the cookie when clearing', () => {
    expect(clearCookie()).toContain('Max-Age=0');
  });

  it('authenticates a request carrying a valid cookie', () => {
    const request = new Request('https://example.com', {
      headers: { cookie: `other=1; ${COOKIE_NAME}=${signToken(SECRET, 3600)}; more=2` },
    });
    expect(isAuthenticated(request, SECRET)).toBe(true);
  });

  it('rejects a request with no cookie header', () => {
    expect(isAuthenticated(new Request('https://example.com'), SECRET)).toBe(false);
  });

  it('rejects a request whose cookie is a different session', () => {
    const request = new Request('https://example.com', {
      headers: { cookie: `${COOKIE_NAME}=garbage` },
    });
    expect(isAuthenticated(request, SECRET)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `./session`.

- [ ] **Step 3: Implement `api/_lib/session.ts`**

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE_NAME = 'portfolio_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

interface SessionPayload {
  exp: number;
}

const sign = (data: string, secret: string): string =>
  createHmac('sha256', secret).update(data).digest('base64url');

/** Token format: `<base64url payload>.<base64url hmac>`. */
export const signToken = (secret: string, ttlSeconds: number): string => {
  const payload: SessionPayload = { exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded, secret)}`;
};

/**
 * Verifies signature first, then expiry — an attacker must not be able to
 * learn anything from a forged token beyond "rejected". Never throws.
 */
export const verifyToken = (token: string, secret: string): boolean => {
  if (!token || !secret) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [encoded, signature] = parts;

  try {
    const expected = Buffer.from(sign(encoded, secret));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length) return false;
    if (!timingSafeEqual(expected, actual)) return false;

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as SessionPayload;
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
};

export const serializeCookie = (token: string, maxAge: number): string =>
  [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ].join('; ');

export const clearCookie = (): string => serializeCookie('', 0);

const readCookie = (request: Request, name: string): string | null => {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
};

/** The single authorisation check every admin route calls. */
export const isAuthenticated = (request: Request, secret: string | undefined): boolean => {
  if (!secret) return false;
  const token = readCookie(request, COOKIE_NAME);
  return token ? verifyToken(token, secret) : false;
};
```

- [ ] **Step 4: Run to verify they pass**

Run: `npm test`
Expected: PASS — 10 session tests added.

- [ ] **Step 5: Commit**

```bash
git add api/_lib/session.ts api/_lib/session.test.ts
git commit -m "Add signed session tokens and cookie handling"
```

---

## Task 9: HTTP helpers and the Blob content store

**Files:**
- Create: `api/_lib/http.ts`
- Create: `api/_lib/blob.ts`
- Modify: `package.json`

- [ ] **Step 1: Install the Blob SDK**

```bash
npm install @vercel/blob@^2.0.0
```

- [ ] **Step 2: Create `api/_lib/http.ts`**

```ts
/** Shared response shapes, so every route answers in the same format. */
export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

export const error = (message: string, status: number, headers: Record<string, string> = {}) =>
  json({ error: message }, status, headers);

export const methodNotAllowed = (allowed: string[]) =>
  error('Method not allowed', 405, { allow: allowed.join(', ') });

/** Parses a JSON body, returning undefined rather than throwing on garbage. */
export const readJson = async (request: Request): Promise<unknown | undefined> => {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
};
```

- [ ] **Step 3: Create `api/_lib/blob.ts`**

```ts
import { head, put } from '@vercel/blob';
import { sanitizePortfolioData } from '../../lib/sanitize';
import { PortfolioData } from '../../types';

export const CONTENT_PATH = 'content/portfolio.json';

/**
 * Reads the stored content document.
 *
 * Returns null when the blob does not exist yet — a fresh Blob store is a
 * normal state, not an error, and callers fall back to the bundled defaults.
 */
export const readContent = async (): Promise<PortfolioData | null> => {
  try {
    const metadata = await head(CONTENT_PATH);
    // Bypass the CDN copy: a save must be readable immediately afterwards.
    const response = await fetch(`${metadata.url}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return sanitizePortfolioData(await response.json());
  } catch {
    return null;
  }
};

/**
 * Overwrites the content document. `addRandomSuffix: false` with
 * `allowOverwrite: true` keeps the pathname stable, so `head()` above always
 * resolves the current version.
 */
export const writeContent = async (data: PortfolioData): Promise<void> => {
  await put(CONTENT_PATH, JSON.stringify(data, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
};
```

- [ ] **Step 4: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add api/_lib/http.ts api/_lib/blob.ts package.json package-lock.json
git commit -m "Add HTTP helpers and Blob-backed content storage"
```

---

## Task 10: The content endpoint

**Files:**
- Create: `api/content.ts`
- Create: `api/content.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `api/content.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INITIAL_DATA } from '../constants';
import { COOKIE_NAME, signToken } from './_lib/session';

const readContent = vi.fn();
const writeContent = vi.fn();

vi.mock('./_lib/blob', () => ({
  CONTENT_PATH: 'content/portfolio.json',
  readContent: () => readContent(),
  writeContent: (data: unknown) => writeContent(data),
}));

const SECRET = 'c'.repeat(64);

const authedRequest = (body: unknown) =>
  new Request('https://example.com/api/content', {
    method: 'PUT',
    headers: {
      cookie: `${COOKIE_NAME}=${signToken(SECRET, 3600)}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

describe('/api/content', () => {
  beforeEach(() => {
    vi.resetModules();
    readContent.mockReset();
    writeContent.mockReset();
    process.env.SESSION_SECRET = SECRET;
  });

  it('GET returns the stored document', async () => {
    readContent.mockResolvedValue({ ...INITIAL_DATA, name: 'Stored Name' });
    const { GET } = await import('./content');

    const response = await GET(new Request('https://example.com/api/content'));
    expect(response.status).toBe(200);
    expect((await response.json()).name).toBe('Stored Name');
  });

  it('GET falls back to defaults when nothing is stored', async () => {
    readContent.mockResolvedValue(null);
    const { GET } = await import('./content');

    const response = await GET(new Request('https://example.com/api/content'));
    expect(response.status).toBe(200);
    expect((await response.json()).name).toBe(INITIAL_DATA.name);
  });

  it('GET sets a CDN cache header', async () => {
    readContent.mockResolvedValue(null);
    const { GET } = await import('./content');

    const response = await GET(new Request('https://example.com/api/content'));
    expect(response.headers.get('cache-control')).toContain('s-maxage=30');
  });

  it('PUT rejects an unauthenticated request and does not write', async () => {
    const { PUT } = await import('./content');

    const response = await PUT(
      new Request('https://example.com/api/content', {
        method: 'PUT',
        body: JSON.stringify(INITIAL_DATA),
      }),
    );
    expect(response.status).toBe(401);
    expect(writeContent).not.toHaveBeenCalled();
  });

  it('PUT rejects a malformed body', async () => {
    const { PUT } = await import('./content');

    const response = await PUT(
      new Request('https://example.com/api/content', {
        method: 'PUT',
        headers: { cookie: `${COOKIE_NAME}=${signToken(SECRET, 3600)}` },
        body: 'not json',
      }),
    );
    expect(response.status).toBe(400);
    expect(writeContent).not.toHaveBeenCalled();
  });

  it('PUT sanitizes before writing', async () => {
    writeContent.mockResolvedValue(undefined);
    const { PUT } = await import('./content');

    const response = await PUT(
      authedRequest({ ...INITIAL_DATA, name: 'New', projects: [null, { id: '1' }] }),
    );

    expect(response.status).toBe(200);
    const written = writeContent.mock.calls[0][0];
    expect(written.name).toBe('New');
    expect(written.projects).toHaveLength(1);
  });

  it('PUT reports a storage failure as a 500', async () => {
    writeContent.mockRejectedValue(new Error('blob unavailable'));
    const { PUT } = await import('./content');

    const response = await PUT(authedRequest(INITIAL_DATA));
    expect(response.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `./content`.

- [ ] **Step 3: Implement `api/content.ts`**

```ts
import { INITIAL_DATA } from '../constants';
import { sanitizePortfolioData } from '../lib/sanitize';
import { readContent, writeContent } from './_lib/blob';
import { error, json, readJson } from './_lib/http';
import { isAuthenticated } from './_lib/session';

/**
 * Public read.
 *
 * Falls back to the bundled defaults when the Blob store is empty or
 * unreachable, so the site renders even before the store is provisioned.
 * `s-maxage` lets the Vercel CDN absorb visitor traffic; a save becomes
 * visible within that window.
 */
export async function GET(): Promise<Response> {
  const stored = await readContent();
  return json(stored ?? INITIAL_DATA, 200, {
    'cache-control': 'public, s-maxage=30, stale-while-revalidate=300',
  });
}

/** Admin write. Sanitizes before storing so the document cannot go malformed. */
export async function PUT(request: Request): Promise<Response> {
  if (!isAuthenticated(request, process.env.SESSION_SECRET)) {
    return error('Unauthorized', 401);
  }

  const body = await readJson(request);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return error('Expected a JSON object body', 400);
  }

  try {
    const sanitized = sanitizePortfolioData(body);
    await writeContent(sanitized);
    return json({ ok: true, data: sanitized });
  } catch (cause) {
    console.error('Failed to write content:', cause);
    return error('Could not save content', 500);
  }
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `npm test`
Expected: PASS — 7 content tests.

- [ ] **Step 5: Commit**

```bash
git add api/content.ts api/content.test.ts
git commit -m "Add public content read and authenticated content write"
```

---

## Task 11: Auth endpoints

**Files:**
- Create: `api/auth/login.ts`
- Create: `api/auth/logout.ts`
- Create: `api/auth/session.ts`
- Create: `api/auth/login.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `api/auth/login.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hashPassword } from '../_lib/password';
import { COOKIE_NAME } from '../_lib/session';

const SECRET = 'd'.repeat(64);
const PASSWORD = 'a-sufficiently-long-password';

const post = (body: unknown) =>
  new Request('https://example.com/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('/api/auth/login', () => {
  beforeEach(async () => {
    vi.resetModules();
    process.env.SESSION_SECRET = SECRET;
    process.env.ADMIN_PASSWORD_HASH = await hashPassword(PASSWORD);
  });

  it('sets a session cookie for the correct password', async () => {
    const { POST } = await import('./login');
    const response = await POST(post({ password: PASSWORD }));

    expect(response.status).toBe(200);
    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toContain(`${COOKIE_NAME}=`);
    expect(cookie).toContain('HttpOnly');
  });

  it('rejects the wrong password without setting a cookie', async () => {
    const { POST } = await import('./login');
    const response = await POST(post({ password: 'wrong' }));

    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('rejects a missing password', async () => {
    const { POST } = await import('./login');
    expect((await POST(post({}))).status).toBe(400);
  });

  it('returns 500 when the server is not configured', async () => {
    delete process.env.ADMIN_PASSWORD_HASH;
    const { POST } = await import('./login');
    expect((await POST(post({ password: PASSWORD }))).status).toBe(500);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `./login`.

- [ ] **Step 3: Implement `api/auth/login.ts`**

```ts
import { error, json, readJson } from '../_lib/http';
import { verifyPassword } from '../_lib/password';
import { SESSION_TTL_SECONDS, serializeCookie, signToken } from '../_lib/session';

/** Delay applied to every failure, to blunt trivial online guessing. */
const FAILURE_DELAY_MS = 400;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.SESSION_SECRET;
  const storedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!secret || !storedHash) {
    console.error('SESSION_SECRET or ADMIN_PASSWORD_HASH is not configured.');
    return error('Server is not configured for sign-in', 500);
  }

  const body = await readJson(request);
  const password =
    body && typeof body === 'object' ? (body as Record<string, unknown>).password : undefined;

  if (typeof password !== 'string' || password.length === 0) {
    return error('Password is required', 400);
  }

  if (!(await verifyPassword(password, storedHash))) {
    await delay(FAILURE_DELAY_MS);
    return error('Incorrect password', 401);
  }

  return json({ ok: true }, 200, {
    'set-cookie': serializeCookie(signToken(secret, SESSION_TTL_SECONDS), SESSION_TTL_SECONDS),
  });
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `npm test`
Expected: PASS — 4 login tests.

- [ ] **Step 5: Implement `api/auth/logout.ts`**

```ts
import { clearCookie } from '../_lib/session';
import { json } from '../_lib/http';

export async function POST(): Promise<Response> {
  return json({ ok: true }, 200, { 'set-cookie': clearCookie() });
}
```

- [ ] **Step 6: Implement `api/auth/session.ts`**

```ts
import { json } from '../_lib/http';
import { isAuthenticated } from '../_lib/session';

/** Lets the dashboard decide between the login form and the editor on load. */
export async function GET(request: Request): Promise<Response> {
  return json(
    { authenticated: isAuthenticated(request, process.env.SESSION_SECRET) },
    200,
    { 'cache-control': 'no-store' },
  );
}
```

- [ ] **Step 7: Verify and commit**

Run: `npm test && npx tsc --noEmit`
Expected: all pass.

```bash
git add api/auth
git commit -m "Add login, logout and session endpoints"
```

---

## Task 12: Client reads content from the API

This is where `localStorage` persistence goes away. Keeping it would let a stale visitor copy shadow published content.

**Files:**
- Create: `services/contentApi.ts`
- Modify: `App.tsx`

- [ ] **Step 1: Create `services/contentApi.ts`**

```ts
import { sanitizePortfolioData } from '../lib/sanitize';
import { PortfolioData } from '../types';

/**
 * Fetches published content. Returns null on any failure — the caller keeps
 * showing the bundled defaults rather than an error state, because a
 * portfolio that renders slightly stale content beats one that renders nothing.
 */
export const fetchContent = async (): Promise<PortfolioData | null> => {
  try {
    const response = await fetch('/api/content', { headers: { accept: 'application/json' } });
    if (!response.ok) return null;
    return sanitizePortfolioData(await response.json());
  } catch {
    return null;
  }
};

/** Persists the whole document. Requires an authenticated session cookie. */
export const saveContent = async (data: PortfolioData): Promise<PortfolioData> => {
  const response = await fetch('/api/content', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error ?? `Save failed with status ${response.status}`);
  }

  return sanitizePortfolioData((await response.json()).data);
};
```

- [ ] **Step 2: Replace the `localStorage` hydration in `App.tsx`**

Replace the `useState` initialiser — the block that reads `localStorage.getItem('portfolio_data')` — with:

```tsx
  const [data, setData] = useState<PortfolioData>(INITIAL_DATA);
```

Delete the `useEffect` that calls `localStorage.setItem('portfolio_data', …)` entirely, and add in its place:

```tsx
  // Published content is the source of truth. INITIAL_DATA renders immediately
  // and stays if the request fails, so the site is never blank.
  //
  // Deliberately not cached in localStorage: a stored copy used to make
  // constants.tsx edits look like no-ops until the key was cleared, and with a
  // real backend the same cache would hide published changes from visitors.
  useEffect(() => {
    let cancelled = false;
    fetchContent().then((published) => {
      if (!cancelled && published) setData(published);
    });
    return () => {
      cancelled = true;
    };
  }, []);
```

Add the import:

```ts
import { fetchContent } from './services/contentApi';
```

- [ ] **Step 3: Confirm no `localStorage` reference survives**

Run: `grep -rn "localStorage" --include=*.tsx --include=*.ts . | grep -v node_modules`
Expected: no output.

- [ ] **Step 4: Verify**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all pass.

- [ ] **Step 5: Commit and push**

```bash
git add services/contentApi.ts App.tsx
git commit -m "Read published content from the API instead of localStorage"
git push origin main
```

- [ ] **Step 6: Verify the deployment serves defaults safely**

```bash
curl -s https://www.ashimkafle.com.np/api/content | head -c 200
```

Expected: JSON starting with `{"name":"Ashim Kafle"` — served from `INITIAL_DATA` if the Blob store does not exist yet, from Blob once it does. Then load the site in a browser and confirm it renders normally.

---

## Task 13: Seed the Blob store

Run once, after the Blob store exists, to move today's content into it.

**Files:**
- Create: `scripts/seed-content.mjs`
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: Create `scripts/seed-content.mjs`**

```js
/**
 * Uploads the bundled INITIAL_DATA to Blob as the starting content document.
 *
 * Requires BLOB_READ_WRITE_TOKEN in the environment. Get it from
 * Vercel → Project → Storage → your Blob store → tokens, or pull it with
 * `vercel env pull`. Refuses to overwrite existing content unless --force.
 *
 * Usage: node scripts/seed-content.mjs [--force]
 */
import { head, put } from '@vercel/blob';

const CONTENT_PATH = 'content/portfolio.json';

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN is not set. Create the Blob store first.');
  process.exit(1);
}

const force = process.argv.includes('--force');

let existing = null;
try {
  existing = await head(CONTENT_PATH);
} catch {
  // Not found is the expected path on a fresh store.
}

if (existing && !force) {
  console.error(
    `${CONTENT_PATH} already exists. Re-run with --force to overwrite it — ` +
      'this discards any edits made through the dashboard.',
  );
  process.exit(1);
}

const { INITIAL_DATA } = await import('../constants.tsx');

const blob = await put(CONTENT_PATH, JSON.stringify(INITIAL_DATA, null, 2), {
  access: 'public',
  contentType: 'application/json',
  addRandomSuffix: false,
  allowOverwrite: true,

});

console.log(`Seeded ${blob.pathname} (${blob.url})`);
```

Note: `constants.tsx` imports from `./types` and `./assets/lottieData`, and is TSX. Run it through Vite's loader rather than bare Node — see the next step.

- [ ] **Step 2: Add the script entry**

In `package.json` `"scripts"`:

```json
    "seed": "vite-node scripts/seed-content.mjs"
```

and install the runner:

```bash
npm install -D vite-node@^3.2.4
```

`vite-node` resolves the TSX import and the `@` alias exactly as the app does, so the seeded document is byte-for-byte what the app bundles.

- [ ] **Step 3: Document the setup in `README.md`**

Append:

```markdown
## Content backend

Content lives in Vercel Blob at `content/portfolio.json` and is edited from `/dashboard`.

### One-time setup

1. Vercel → project → **Storage** → Create → **Blob**. This injects `BLOB_READ_WRITE_TOKEN`.
2. Generate the auth env vars locally:
   `node scripts/hash-password.mjs "your chosen password"`
   Paste the printed `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` into
   Vercel → Settings → Environment Variables (all environments), then redeploy.
3. Seed the store: `vercel env pull .env.local && npm run seed`

### Environment variables

| Name | Where it comes from |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | injected by Vercel when the Blob store is created |
| `ADMIN_PASSWORD_HASH` | `scripts/hash-password.mjs` |
| `SESSION_SECRET` | `scripts/hash-password.mjs` |
```

- [ ] **Step 4: Verify the guard works before the store exists**

Run: `npm run seed`
Expected: exits 1 with "BLOB_READ_WRITE_TOKEN is not set." — correct behaviour until Step 1 of the README is done.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-content.mjs package.json package-lock.json README.md
git commit -m "Add content seeding script and backend setup docs"
```

---

## Task 14: End-to-end verification

- [ ] **Step 1: Push everything**

```bash
git push origin main
```

- [ ] **Step 2: Confirm the deployment succeeded**

Check the Vercel deployment reaches READY. If it failed, read the build logs before proceeding — do not diagnose from the site's behaviour.

- [ ] **Step 3: Verify clean URLs**

```bash
curl -s -o /dev/null -w "works=%{http_code}\n" https://www.ashimkafle.com.np/works
curl -s -o /dev/null -w "gallery=%{http_code}\n" https://www.ashimkafle.com.np/gallery
curl -s -o /dev/null -w "nonsense=%{http_code}\n" https://www.ashimkafle.com.np/nonsense
```

Expected: `200` for all three. The unknown path returns 200 because the SPA serves its own 404 page — confirm in a browser that it shows "Nothing here."

- [ ] **Step 4: Verify the content API**

```bash
curl -s https://www.ashimkafle.com.np/api/content | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('name:',j.name,'| projects:',j.projects.length,'| social:',j.social.length)})"
```

Expected: the name, a project count, and a social count of 3.

- [ ] **Step 5: Verify auth rejects by default**

```bash
curl -s -o /dev/null -w "unauth_put=%{http_code}\n" -X PUT -H 'content-type: application/json' -d '{}' https://www.ashimkafle.com.np/api/content
curl -s https://www.ashimkafle.com.np/api/auth/session
```

Expected: `unauth_put=401`, and `{"authenticated":false}`.

- [ ] **Step 6: Verify login works** (after the env vars are set)

```bash
curl -s -o /dev/null -w "bad_login=%{http_code}\n" -X POST -H 'content-type: application/json' -d '{"password":"definitely-wrong"}' https://www.ashimkafle.com.np/api/auth/login
```

Expected: `bad_login=401`. Then log in through `/dashboard` in a browser with the real password and confirm `GET /api/auth/session` reports `authenticated: true`.

- [ ] **Step 7: Confirm the full suite passes**

Run: `npm test`
Expected: PASS — 34 tests across sanitize (9), password (4), session (10), content (7) and login (4).

---

## Definition of done

- `https://www.ashimkafle.com.np/works` returns 200 and hash URLs redirect to real paths
- `GET /api/content` serves the stored document, falling back to defaults when the store is empty
- `PUT /api/content` returns 401 without a valid session cookie
- No API key appears anywhere in `dist/`
- No `localStorage` reference remains in the client
- Social links render from content in both the footer and the landing page
- `npm test` passes

## Follow-up: Plan 2

Not in this plan, and blocked on it: the dashboard editor UI, Blob client-uploads for images,
and `/api/ai/*` as a server-side replacement for the deleted Gemini client. `/dashboard` remains
the existing placeholder until then.
