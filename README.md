# Ashim-Portfolio

My portfolio website — live at [www.ashimkafle.com.np](https://www.ashimkafle.com.np).

React 19 + Vite SPA on Vercel, with content stored in Vercel Blob and edited
from `/dashboard`.

## Local development

```bash
npm install
npm run dev
```

The dev server runs the client only — `/api/*` routes exist as Vercel Functions
and are not served by Vite, so `GET /api/content` fails locally and the app
falls back to `INITIAL_DATA` in `constants.ts`. That fallback is deliberate: the
site renders even when content cannot be fetched.

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | production build |
| `npm test` | Vitest suite |
| `npm run seed` | upload `INITIAL_DATA` to Blob (optional, see below) |

## Content backend

Content is one JSON document in Vercel Blob at `content/portfolio.json`.

| Route | Access | Purpose |
|---|---|---|
| `GET /api/content` | public | published content, CDN-cached ~30s |
| `PUT /api/content` | admin | validate, sanitize, overwrite |
| `POST /api/auth/login` | public | password to session cookie |
| `POST /api/auth/logout` | admin | clear the cookie |
| `GET /api/auth/session` | any | is the cookie still valid |

`lib/sanitize.ts` runs on **both** sides — the client applies it to whatever the
API returns, and `PUT` applies it before writing — so the stored document cannot
drift out of shape with `types.ts`.

### One-time setup

1. **Blob store:** Vercel → project → Storage → Create → Blob. This injects
   `BLOB_READ_WRITE_TOKEN` automatically.
2. **Auth env vars:** generate them locally so the plaintext password never
   leaves your machine:

   ```bash
   node scripts/hash-password.mjs "your chosen password"
   ```

   Paste the printed `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` into Vercel →
   Settings → Environment Variables (all environments), then redeploy. Store the
   password itself in a password manager; it is not recoverable from the hash.

   Until these are set, `POST /api/auth/login` returns 500 with
   "Server is not configured for sign-in". The public site is unaffected.
3. **Seed (optional):** `GET /api/content` already falls back to `INITIAL_DATA`
   when the blob is absent, and the first dashboard save creates it. To create it
   up front:

   ```bash
   vercel env pull .env.local
   npm run seed
   ```

### Environment variables

| Name | Source | Needed for |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | injected when the Blob store is created | reading and writing content |
| `ADMIN_PASSWORD_HASH` | `scripts/hash-password.mjs` | dashboard login |
| `SESSION_SECRET` | `scripts/hash-password.mjs` | signing session cookies |

## Notes for future work

- **Serverless imports need file extensions.** `package.json` sets
  `"type": "module"` and Vercel does not bundle relative imports in
  `api/`, so every relative specifier in the server chain ends in `.js`
  (mapping to the `.ts` source). Dropping an extension produces
  `ERR_MODULE_NOT_FOUND` at runtime that `tsc`, Vitest and `vite build` all
  pass straight through.
- **No SEO/prerendering.** Content is fetched client-side, so it is absent from
  the initial HTML — weaker indexing and social link previews on `/works/:id`.
- **Tailwind loads from `cdn.tailwindcss.com`** in `index.html`, which is not
  intended for production use.
- **Contact is still `mailto:`** links rather than a form.
