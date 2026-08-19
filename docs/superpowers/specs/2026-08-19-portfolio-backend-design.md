# Portfolio backend + clean URLs — design

**Date:** 2026-08-19
**Status:** approved for planning
**Project:** `ashim-portfolio` (Vercel `prj_1SDp65gDsaGqrv472dEJe6PXeMqY`, team `team_eZiRrRrXqheqeXbMwGTU1d8R`)
**Live at:** `www.ashimkafle.com.np` (apex 308-redirects to `www`)

## Problem

Three concrete failures in the deployed site:

1. **Content is not editable.** `PortfolioData` is hardcoded in `constants.tsx` and cached
   per-browser in `localStorage['portfolio_data']`. Changing content means editing code and
   redeploying. The `/dashboard` route is a placeholder stub — the original CRUD panel was lost
   and never recovered.
2. **URLs carry a hash.** `index.tsx` mounts `HashRouter`, so pages are `…/#/works`.
   `https://www.ashimkafle.com.np/works` returns **404** — verified 2026-08-19.
3. **The Gemini API key is exposed.** `vite.config.ts` inlines `GEMINI_API_KEY` into the client
   bundle via `define`. It is readable by anyone viewing source on the live site and must be
   treated as compromised.

## Decisions

| Question | Decision |
|---|---|
| Storage | Vercel Blob only — no database |
| Content shape | One JSON document, mirroring the existing `PortfolioData` type |
| Auth | Single admin password (scrypt hash in env) → HMAC-signed session cookie |
| Images | Uploaded from the dashboard via Blob client-upload |
| Publishing | Saves go live immediately; no draft state |
| Framework | Stays a Vite SPA. No Next.js migration. |
| SEO | Out of scope, tracked as a follow-up |
| Social links | Added to the content model, editable from the dashboard |
| Delivery | Commits land on `main`, deploying straight to production |

### Deploying straight to production

Work merges to `main`, so each push deploys to `www.ashimkafle.com.np`. The fallback described
under *Data flow* is what makes this safe: until the Blob store and env vars exist, `GET
/api/content` fails, the client falls back to `INITIAL_DATA`, and visitors see exactly the site
they see today. Only `/dashboard` is non-functional in that window.

## Architecture

Vite SPA plus Vercel serverless functions in `/api`. No new vendor.

**Blob layout**

- `content/portfolio.json` — the content document, overwritten in place on save
- `media/<slug>-<hash>.<ext>` — uploaded images

**Endpoints**

| Route | Access | Purpose |
|---|---|---|
| `GET /api/content` | public | return the content document |
| `PUT /api/content` | admin | validate → sanitize → overwrite the blob |
| `POST /api/auth/login` | public | password → session cookie |
| `POST /api/auth/logout` | admin | clear the cookie |
| `GET /api/auth/session` | any | report whether the cookie is still valid |
| `POST /api/upload` | admin | mint a scoped Blob client-upload token |
| `POST /api/ai/blog` | admin | Gemini blog draft, key server-side |
| `POST /api/ai/case-study` | admin | Gemini case-study refinement, key server-side |

Uploads use Blob **client-upload**: the browser sends the file straight to Blob storage using a
short-lived token minted by `/api/upload`. Posting files through the function instead would hit
the 4.5 MB serverless request-body limit, which a portfolio image can exceed.

`GET /api/content` responds with `Cache-Control: public, s-maxage=30, stale-while-revalidate=300`,
so the Vercel CDN absorbs visitor traffic and a save becomes visible within about 30 seconds.

## Auth

Two env vars: `ADMIN_PASSWORD_HASH` (scrypt, salt embedded) and `SESSION_SECRET`. Login compares
with `crypto.timingSafeEqual`, then sets a session cookie: `httpOnly`, `Secure`, `SameSite=Lax`,
`Path=/`, 7-day expiry, payload signed with HMAC-SHA256. No user table, no third-party auth.

**Known limitation:** serverless instances share no memory, so per-IP rate limiting is
best-effort — a fixed delay on failure and a constant-time compare, not a hard attempt cap.
A real cap would need a shared store. Acceptable for a single admin with a strong password;
revisit if the endpoint is ever attacked.

## Data flow

`App.tsx` fetches `/api/content` on mount, rendering `INITIAL_DATA` until it resolves and
falling back to it permanently if the request fails — the site never renders blank.

**`localStorage` persistence is removed.** Today the cached copy is what makes `constants.tsx`
edits appear to do nothing until the key is cleared. Once a server is the source of truth that
same cache would let a stale visitor copy shadow published content, turning a papercut into a
correctness bug.

`performNuclearSanitize` moves out of `App.tsx` into `lib/sanitize.ts` and runs in **both** the
client and the `PUT` handler — one validator, so client and server cannot drift from `types.ts`.
`Navbar` and `Footer` move into `components/`; `App.tsx` is currently ~450 lines doing four
separate jobs.

## Dashboard

`/dashboard` renders a login form until authenticated, then editors for each collection
(projects, services, blogs, process, tools, gallery) and the scalar fields (name, role, tagline,
company, availability, vibe). Saving issues a whole-document `PUT`.

Split as `pages/dashboard/<Collection>Editor.tsx`, one file per collection. The panel that was
lost was a single large file; keeping each editor small and independently readable is a direct
response to that.

## Clean URLs

- `HashRouter` → `BrowserRouter` in `index.tsx`
- `vercel.json`: rewrite everything except `/api/*` and static assets to `/index.html`
- a real 404 route — there is no catch-all today
- a redirect shim mapping legacy `/#/works` links to `/works`
- canonical host `www.ashimkafle.com.np`, declared with `<link rel="canonical">`
- the footer's `#` social placeholders were inert *because* `#` hijacks `HashRouter`. That
  constraint disappears, and social links become content rather than code (below).

### Social links become content

`PortfolioData` gains `social: SocialLink[]`, where `SocialLink` is `{ id, label, url }`. The
footer and the menu render whatever is in that array; an entry with an empty `url` renders as an
inert label rather than a dead link, preserving today's behaviour without hardcoding it.
`INITIAL_DATA` seeds the existing LinkedIn URL plus empty Dribbble and Instagram entries, so
filling them in later is a dashboard edit and never a code change.

## Error handling

| Failure | Behaviour |
|---|---|
| `GET /api/content` fails | fall back to `INITIAL_DATA`; site still renders |
| `PUT` validation fails | 400 with field details; dashboard shows the error and keeps form state |
| session invalid | 401; dashboard returns to the login form |
| upload wrong type/size | rejected before the token is minted — jpeg/png/webp, max 5 MB |
| Gemini fails | AI helper returns null and the UI stays usable, matching current behaviour |

## Testing

No test infrastructure exists. Add Vitest covering:

- `lib/sanitize.ts` — pure, and the thing standing between corrupt input and published content
- session cookie sign/verify, including tamper and expiry cases
- content `PUT` handler with a mocked Blob client: rejects unauthenticated, rejects malformed

Manual post-deploy checklist: deep-link `/works`, hard-refresh it, hit an unknown path, log in,
save an edit and confirm it appears for a logged-out visitor, upload an image, log out.

## Out of scope

- **Contact form** — still `mailto:` links. Next candidate.
- **SEO / prerendering** — a client-rendered SPA ships no content in its initial HTML, which
  weakens indexing and social link previews for `/works/:id`. Options when picked up: per-route
  meta tags plus build-time prerendering of static routes, or a Next.js migration.
- **Tailwind via `cdn.tailwindcss.com`** in `index.html` — not intended for production; wants a
  real build step.

## Manual steps (cannot be automated from here)

The Vercel connection available in this session exposes projects, deployments, logs and docs —
it has no tool for provisioning storage or setting environment variables, and the Vercel CLI
requires an interactive browser login.

1. **Create the Blob store** — Vercel → project → Storage → Create → Blob. Injects
   `BLOB_READ_WRITE_TOKEN`. Must happen before the functions can work.
2. **Set env vars** — `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `GEMINI_API_KEY`.
   `scripts/hash-password.mjs` generates the first two locally so the plaintext password is
   never transmitted.
3. **Rotate the Gemini key** — revoke the exposed key in Google AI Studio, issue a new one, set
   it as the env var above. Credentials are handled by the owner, not the agent.
