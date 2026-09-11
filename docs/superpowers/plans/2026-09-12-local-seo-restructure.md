# Local SEO Frontend Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure ashimkafle.com.np into a Nepal-local information architecture that (a) establishes Ashim Kafle as a search entity and the founder of Limi Creatives, and (b) owns the service queries `limicreatives.com` does *not* already target — without competing against it for the ones it does.

**Architecture:** Keep the existing shape (Vite SPA + `scripts/prerender.mjs` baking static HTML per route). Three layers change. (1) The **content model** in `types.ts` grows `Service.slug/mode/externalUrl/body/faqs`, a `BlogCategory` collection, and geo fields on `SeoDefaults` — every addition flows through `lib/defaults.ts` and `lib/sanitize.ts` so documents saved before the change still load. (2) The **route layer** gains `/services/:slug`, `/blog/category/:slug`, `/about` and `/contact`, each with exactly one `<h1>` and a breadcrumb trail. (3) `scripts/prerender.mjs` stops emitting an empty `#root` for non-article routes and instead bakes real body markup, `lastmod`, `BreadcrumbList`, and a sitewide `Person` + Limi `Organization` `@graph` into every page.

**Tech Stack:** React 19, react-router-dom 7, Vite 6, Vitest 3, Tailwind (moving off the `cdn.tailwindcss.com` dev script to a real build), esbuild (already used by the prerenderer), Vercel.

---

## The two-site strategy

`limicreatives.com` is not a stub. Verified live on 2026-09-12: 26 URLs in its sitemap, six case studies, six blog posts already targeting Nepali search intent, and clean `Organization` schema at `@id: https://limicreatives.com/#organization`. It already owns these service URLs:

`/services/seo` · `/services/content-creation` · `/services/paid-advertising` · `/services/social-media-management` · `/services/full-marketing-package`

Two weak domains competing for the same queries split authority rather than accumulating it. So the sites divide by entity type, not by topic:

- **limicreatives.com** is the *commercial* entity. It owns transactional service queries.
- **ashimkafle.com.np** is the *person* entity. It owns `ashim kafle`, `limi creatives founder`, thought-leadership, and the two service areas Limi has no page for.

Of the five services Limi offers, it has pages for three (Meta ads, content creation, SEO) and **none for UI/UX–Web Design or Branding**. Those are uncontested, and so is Motion & Animation, which is already in the personal site's content document. Those three become full pages here. The other three become short capability sections on `/services` that link out to Limi's deeper pages.

| URL | Primary query | Notes |
|---|---|---|
| `/` | `ashim kafle`, `product designer nepal` | Brand + head term |
| `/about` | `ashim kafle`, `limi creatives founder`, `ashim kafle cmo` | **New. The most important page in this plan.** `Person` schema, founder narrative, E-E-A-T |
| `/contact` | `hire web designer kathmandu` | **New.** NAP as visible text. No LocalBusiness schema — see below |
| `/services` | `design services nepal` | Hub. Three owned pages + three pointers to Limi |
| `/services/web-design` | `web design nepal`, `ui ux designer nepal` | **New.** Money page. Uncontested |
| `/services/branding` | `branding agency nepal`, `logo design nepal` | **New.** Money page. Uncontested |
| `/services/motion-animation` | `motion graphics nepal` | **New.** Money page. Uncontested |
| `/works` | `design portfolio nepal` | Hub |
| `/works/:slug` | long-tail client and industry terms | Case studies |
| `/blog` | — | Hub |
| `/blog/category/:slug` | cluster head terms | **New.** Topic clusters |
| `/blog/:slug` | long-tail informational | Posts |
| `/gallery`, `/vibe` | — | Kept, dropped to `0.4` priority |

**Not built here:** `/services/seo`, `/services/content-creation`, `/services/meta-ads`. These would compete with live Limi pages. They appear on `/services` as cards linking to `https://limicreatives.com/services/...`.

**Not built here either:** keyword-stuffed slugs (`/services/web-design-nepal`) and per-district doorway pages (`/nepal/kathmandu/web-design`). Both are thin-content patterns Google has penalised for years, and for a solo practitioner there is no honest way to make twenty location pages substantively different. Geography goes in the `<h1>`, `<title>`, body copy and schema `areaServed` — not the URL.

## The entity model, and why there is no LocalBusiness

Limi's `Organization` publishes `telephone: "+9779805812718"`. That is also Ashim's personal number (`+977 9805 812 718` in the content document). Declaring a `ProfessionalService` or `LocalBusiness` on the personal site would put two local businesses at one phone number in Kathmandu, which degrades local trust signals for both.

So the personal site emits exactly two entity nodes:

1. **`Person`** at `@id: https://www.ashimkafle.com.np/#person` — the authoritative definition. Name, jobTitle, image, sameAs, contact.
2. **`Organization`** at `@id: https://limicreatives.com/#organization` — a *reference* to the node Limi already publishes, carrying only `name`, `url` and `founder` pointing back at the Person.

`Person.worksFor` points at Limi's `@id`. Matching `@id` strings across two domains is what lets Google merge the assertions into one relationship; a trailing-slash or `www` mismatch silently produces two unrelated nodes, so the strings are asserted in tests.

The reciprocal half — Limi asserting `founder` back — is specified in `docs/superpowers/specs/limi-creatives-founder-linkage.md` and is **deliberately out of scope**. That site is under active development and Ashim asked that we not touch it yet.

---

## File Structure

**Created**
- `lib/routes.ts` — single source of truth for the route table: path, label, breadcrumb parent, sitemap priority. Both the router and the prerenderer read it, so a route can never exist in the SPA but be missing from the sitemap.
- `lib/routes.test.ts`
- `lib/seoGraph.ts` — builds the `Person` + Limi `Organization` JSON-LD `@graph`, plus `BreadcrumbList`, `Service`, `BlogPosting` and `FAQPage` nodes. Imported by both `components/Seo.tsx` (runtime) and `scripts/prerender.mjs` (build) so the two can never drift.
- `lib/seoGraph.test.ts`
- `components/Breadcrumbs.tsx`
- `pages/ServiceDetailPage.tsx`
- `pages/AboutPage.tsx`
- `pages/ContactPage.tsx`
- `pages/BlogCategoryPage.tsx`
- `src/index.css`, `tailwind.config.js`, `postcss.config.js`

**Modified**
- `types.ts` — `Service` gains `slug`, `mode`, `externalUrl`, `body`, `seoTitle`, `metaDescription`, `faqs`, `published`; new `Faq`, `BlogCategory`, `Geo`; `Blog` gains `categoryId`; `SeoDefaults` gains `geo`; `PortfolioData` gains `blogCategories`.
- `lib/defaults.ts` — defaults for every new field, plus `company.url`.
- `lib/sanitize.ts` — coercion for every new field.
- `lib/editorSchema.ts` — admin fields for the new service fields and the category collection.
- `constants.ts` — real seed content.
- `App.tsx` — four new routes.
- `components/Seo.tsx` — consume `lib/seoGraph.ts`.
- `scripts/prerender.mjs`, `scripts/_prerender-entry.ts`.
- `index.html`, `index.tsx` — drop the Tailwind CDN.
- `pages/WorksPage.tsx`, `pages/ServicesPage.tsx`, `pages/BlogPage.tsx`, `pages/VibePage.tsx` — add the missing `<h1>`.
- `components/Footer.tsx` — sitewide internal links.

---

## Task 1: Route table

**Files:**
- Create: `lib/routes.ts`
- Test: `lib/routes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { STATIC_ROUTES, breadcrumbTrail, routeByPath } from './routes';

describe('routes', () => {
  it('exposes every indexable static route', () => {
    expect(STATIC_ROUTES.map((route) => route.path)).toEqual([
      '/', '/about', '/contact', '/services', '/works', '/blog', '/gallery', '/vibe',
    ]);
  });

  it('ranks about second only to the home page, because it is the entity page', () => {
    expect(routeByPath('/')?.priority).toBe('1.0');
    expect(routeByPath('/about')?.priority).toBe('0.9');
  });

  it('drops the personality pages down the sitemap', () => {
    expect(routeByPath('/vibe')?.priority).toBe('0.4');
    expect(routeByPath('/gallery')?.priority).toBe('0.4');
  });

  it('builds a trail from home to the current page', () => {
    expect(breadcrumbTrail('/services/web-design', 'Web Design')).toEqual([
      { name: 'Home', path: '/' },
      { name: 'Services', path: '/services' },
      { name: 'Web Design', path: '/services/web-design' },
    ]);
  });

  it('breadcrumbs a category page under the journal, not as a post', () => {
    expect(breadcrumbTrail('/blog/category/design', 'Design')).toEqual([
      { name: 'Home', path: '/' },
      { name: 'Journal', path: '/blog' },
      { name: 'Design', path: '/blog/category/design' },
    ]);
  });

  it('returns just home for the home page', () => {
    expect(breadcrumbTrail('/', 'Home')).toEqual([{ name: 'Home', path: '/' }]);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/routes.test.ts`
Expected: FAIL — `Failed to resolve import "./routes"`.

- [ ] **Step 3: Implement the route table**

```ts
/**
 * The one place the site's URL structure is declared.
 *
 * Both the router (App.tsx) and the build-time prerenderer read this, so a
 * route can never exist in the SPA but be missing from the sitemap — which is
 * exactly how pages end up unindexed.
 */
export interface StaticRoute {
  path: string;
  /** Breadcrumb and nav label. */
  label: string;
  /** Sitemap priority. Personality pages sit below the money pages. */
  priority: string;
}

export const STATIC_ROUTES: StaticRoute[] = [
  { path: '/', label: 'Home', priority: '1.0' },
  // /about carries the Person entity and the founder claim. It is the page
  // this whole restructure exists to get ranked.
  { path: '/about', label: 'About', priority: '0.9' },
  { path: '/contact', label: 'Contact', priority: '0.9' },
  { path: '/services', label: 'Services', priority: '0.9' },
  { path: '/works', label: 'Work', priority: '0.8' },
  { path: '/blog', label: 'Journal', priority: '0.7' },
  { path: '/gallery', label: 'Gallery', priority: '0.4' },
  { path: '/vibe', label: 'Vibe', priority: '0.4' },
];

export const routeByPath = (path: string): StaticRoute | undefined =>
  STATIC_ROUTES.find((route) => route.path === path);

/**
 * Maps a nested path to the hub it hangs off. Order matters: the category
 * prefix must be tested before the bare blog prefix, or every category page
 * would breadcrumb as if it were a post.
 */
const PARENTS: Array<{ prefix: string; path: string; name: string }> = [
  { prefix: '/services/', path: '/services', name: 'Services' },
  { prefix: '/works/', path: '/works', name: 'Work' },
  { prefix: '/blog/category/', path: '/blog', name: 'Journal' },
  { prefix: '/blog/', path: '/blog', name: 'Journal' },
];

export interface Crumb {
  name: string;
  path: string;
}

/**
 * Home → hub → current page. Never more than three levels, because the site
 * is never deeper than three levels.
 */
export const breadcrumbTrail = (path: string, title: string): Crumb[] => {
  if (path === '/') return [{ name: 'Home', path: '/' }];
  const trail: Crumb[] = [{ name: 'Home', path: '/' }];
  const parent = PARENTS.find((candidate) => path.startsWith(candidate.prefix));
  if (parent) trail.push({ name: parent.name, path: parent.path });
  trail.push({ name: title, path });
  return trail;
};
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run lib/routes.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/routes.ts lib/routes.test.ts
git commit -m "Declare the site's URL structure in one shared route table"
```

---

## Task 2: Content model — services, categories, geo

**Files:**
- Modify: `types.ts`, `lib/defaults.ts`, `lib/sanitize.ts`
- Test: `lib/sanitize.test.ts`

The key new field is `Service.mode`. A `'page'` service gets its own URL, body and sitemap entry. A `'pointer'` service renders as a card on `/services` linking to `externalUrl` on limicreatives.com, and gets **no** page and **no** sitemap entry — that is what keeps the two sites from competing.

- [ ] **Step 1: Write the failing test**

Append to `lib/sanitize.test.ts`:

```ts
describe('sanitize — local SEO fields', () => {
  it('derives a service slug from the title when one is missing', () => {
    const data = sanitizePortfolioData({
      services: [{ id: 's1', title: 'Web Design' }],
    } as never);
    expect(data.services[0].slug).toBe('web-design');
  });

  it('defaults a service to a published page', () => {
    const data = sanitizePortfolioData({
      services: [{ id: 's1', title: 'Branding' }],
    } as never);
    expect(data.services[0].mode).toBe('page');
    expect(data.services[0].published).toBe(true);
    expect(data.services[0].faqs).toEqual([]);
  });

  it('keeps a pointer service pointing outward', () => {
    const data = sanitizePortfolioData({
      services: [{ id: 's1', title: 'SEO', mode: 'pointer', externalUrl: 'https://limicreatives.com/services/seo' }],
    } as never);
    expect(data.services[0].mode).toBe('pointer');
    expect(data.services[0].externalUrl).toBe('https://limicreatives.com/services/seo');
  });

  it('demotes a pointer with no destination back to a page', () => {
    const data = sanitizePortfolioData({
      services: [{ id: 's1', title: 'SEO', mode: 'pointer', externalUrl: '' }],
    } as never);
    // A pointer with nowhere to point would render a dead card, so it falls
    // back to the mode that at least produces something.
    expect(data.services[0].mode).toBe('page');
  });

  it('drops half-filled faqs', () => {
    const data = sanitizePortfolioData({
      services: [{
        id: 's1', title: 'Branding',
        faqs: [
          { id: 'f1', question: 'How long does a rebrand take?', answer: 'Four to six weeks.' },
          { id: 'f2', question: '', answer: 'Orphaned answer.' },
        ],
      }],
    } as never);
    expect(data.services[0].faqs).toHaveLength(1);
    expect(data.services[0].faqs[0].question).toBe('How long does a rebrand take?');
  });

  it('defaults the geo block to Kathmandu', () => {
    const data = sanitizePortfolioData({} as never);
    expect(data.seo.geo.city).toBe('Kathmandu');
    expect(data.seo.geo.country).toBe('NP');
    expect(data.seo.geo.areaServed).toContain('Nepal');
  });

  it('knows where Limi Creatives lives', () => {
    const data = sanitizePortfolioData({} as never);
    expect(data.company.url).toBe('https://limicreatives.com');
  });

  it('falls back to an empty category list', () => {
    const data = sanitizePortfolioData({} as never);
    expect(data.blogCategories).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/sanitize.test.ts`
Expected: FAIL — `data.services[0].slug` is `undefined`.

- [ ] **Step 3: Extend `types.ts`**

```ts
/** A question/answer pair, emitted as FAQPage schema on service pages. */
export interface Faq {
  id: string;
  question: string;
  answer: string;
}

/** A topic cluster head — one indexable page per category at /blog/category/:slug. */
export interface BlogCategory {
  id: string;
  slug: string;
  title: string;
  /** Intro paragraph; doubles as the meta description fallback. */
  description: string;
  seoTitle: string;
  metaDescription: string;
}

/** Where the practice operates, for local search relevance. */
export interface Geo {
  city: string;
  region: string;
  /** ISO 3166-1 alpha-2, e.g. "NP". */
  country: string;
  /** Places served, e.g. ["Kathmandu", "Lalitpur", "Nepal"]. */
  areaServed: string[];
}

/**
 * Whether a service gets its own page here, or defers to Limi Creatives.
 *
 * 'pointer' exists so this site never builds a page competing with a live
 * limicreatives.com service page for the same query. See the two-site
 * strategy in the plan.
 */
export type ServiceMode = 'page' | 'pointer';
```

In `Service`, add:

```ts
  /** URL segment for /services/:slug. Unused when mode is 'pointer'. */
  slug: string;
  mode: ServiceMode;
  /** Destination for a 'pointer' service, e.g. a limicreatives.com page. */
  externalUrl: string;
  /** Long-form Markdown body — this is what makes the page rankable. */
  body: string;
  /** Overrides the <title> tag; falls back to `title`. */
  seoTitle: string;
  /** Overrides the meta description; falls back to `description`. */
  metaDescription: string;
  faqs: Faq[];
  /** Only published services get a page and a sitemap entry. */
  published: boolean;
```

In `Blog`, add `categoryId: string;`. In `SeoDefaults`, add `geo: Geo;`. In `PortfolioData`, add `blogCategories: BlogCategory[];`.

- [ ] **Step 4: Extend `lib/defaults.ts`**

Set `company.url` to `'https://limicreatives.com'` — it is currently `''`, which is why no schema can reference the agency. Inside `seo` add:

```ts
    geo: {
      city: 'Kathmandu',
      region: 'Bagmati Province',
      country: 'NP',
      areaServed: ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Nepal'],
    },
```

At the top level of `DEFAULT_DATA` add `blogCategories: [],`.

- [ ] **Step 5: Extend `lib/sanitize.ts`**

Read the file first — it already has per-collection coercion helpers and imports `resolveSlug`. Follow that pattern rather than inventing a second one. The service coercion gains:

```ts
    slug: resolveSlug(asString(raw.slug), asString(raw.title), id),
    externalUrl: asString(raw.externalUrl),
    // A pointer with nowhere to point would render a dead card, so it falls
    // back to being a normal page.
    mode: raw.mode === 'pointer' && asString(raw.externalUrl) ? 'pointer' : 'page',
    body: asString(raw.body),
    seoTitle: asString(raw.seoTitle),
    metaDescription: asString(raw.metaDescription),
    faqs: asArray(raw.faqs)
      .map((entry, index) => ({
        id: asString((entry as Faq).id) || `faq-${index}`,
        question: asString((entry as Faq).question),
        answer: asString((entry as Faq).answer),
      }))
      // A half-filled pair emits a Question with no acceptedAnswer, which is
      // invalid FAQPage schema. Drop it rather than ship it.
      .filter((faq) => faq.question && faq.answer),
    published: raw.published !== false,
```

Add `categoryId: asString(raw.categoryId)` to the blog coercion, a `blogCategories` collection coercion mirroring `blogs`, and `geo` coercion inside the `seo` block falling back to `DEFAULT_DATA.seo.geo` field by field.

- [ ] **Step 6: Run the full suite**

Run: `npx vitest run`
Expected: the new sanitize tests PASS. `lib/editorSchema.test.ts` may now fail — that is Task 3's job. Note it and continue.

- [ ] **Step 7: Commit**

```bash
git add types.ts lib/defaults.ts lib/sanitize.ts lib/sanitize.test.ts
git commit -m "Let a service own a page here or defer to Limi Creatives"
```

---

## Task 3: Seed real content

**Files:**
- Modify: `constants.ts`, `lib/editorSchema.ts`
- Test: `lib/editorSchema.test.ts`

Six services, split three and three.

| Title | slug | mode | externalUrl |
|---|---|---|---|
| Web Design & UI/UX | `web-design` | `page` | — |
| Branding | `branding` | `page` | — |
| Motion & Animation | `motion-animation` | `page` | — |
| SEO | — | `pointer` | `https://limicreatives.com/services/seo` |
| Content Creation | — | `pointer` | `https://limicreatives.com/services/content-creation` |
| Meta & Google Ads | — | `pointer` | `https://limicreatives.com/services/paid-advertising` |

- [ ] **Step 1: Write the failing test**

Append to `lib/editorSchema.test.ts`:

```ts
describe('service pages are rankable', () => {
  const pages = INITIAL_DATA.services.filter((service) => service.mode === 'page');

  it('owns exactly the three services Limi Creatives has no page for', () => {
    expect(pages.map((service) => service.slug).sort()).toEqual([
      'branding', 'motion-animation', 'web-design',
    ]);
  });

  it('gives every owned page a substantial body and FAQs', () => {
    for (const service of pages) {
      expect(service.slug, `${service.title} slug`).toMatch(/^[a-z0-9-]+$/);
      expect(service.body.split(/\s+/).length, `${service.title} body`).toBeGreaterThan(400);
      expect(service.faqs.length, `${service.title} faqs`).toBeGreaterThanOrEqual(3);
      expect(service.seoTitle.length, `${service.title} seoTitle`).toBeLessThanOrEqual(60);
      expect(service.metaDescription.length, `${service.title} meta`).toBeLessThanOrEqual(160);
    }
  });

  it('points the other three at Limi Creatives', () => {
    const pointers = INITIAL_DATA.services.filter((service) => service.mode === 'pointer');
    expect(pointers).toHaveLength(3);
    for (const service of pointers) {
      expect(service.externalUrl, `${service.title} destination`)
        .toMatch(/^https:\/\/limicreatives\.com\/services\//);
    }
  });

  it('gives every seeded post a category that exists', () => {
    const ids = new Set(INITIAL_DATA.blogCategories.map((category) => category.id));
    for (const post of INITIAL_DATA.blogs) {
      expect(ids.has(post.categoryId), `${post.title} category`).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/editorSchema.test.ts`
Expected: FAIL — `body` is empty, word count 1.

- [ ] **Step 3: Write the seed content**

In `constants.ts`, set the six services per the table above. For the three owned pages write a Markdown `body` on this skeleton. The prose must be specific to Ashim's actual practice — generic filler does not rank and is worse than nothing:

```
## What you get
[Concrete deliverables, 3-4 sentences.]

## How it works
[The process, tied to the four steps already in `data.process`.]

## Who this is for
[The Nepali market segment — SaaS, hospitality, retail, NGOs.]

## What it costs
[A real price anchor, or an honest explanation of what drives the range.]
```

Each owned page's `seoTitle` must be ≤60 characters and carry the geo modifier: `Web Design & UI/UX in Nepal`, `Branding & Logo Design in Nepal`, `Motion Graphics & Animation in Nepal`.

The three pointer services keep their existing `title` and `description` and need no body — they render as cards only.

Add `blogCategories` with four entries: `design` ("Design"), `branding` ("Branding"), `marketing` ("Marketing"), `nepal-market` ("The Nepal Market"). Give both existing posts a `categoryId`.

- [ ] **Step 4: Add the admin fields**

In `lib/editorSchema.ts`, widen the `CollectionSpec['key']` union to include `'blogCategories'`, add the `blogCategories` collection spec, and add to the `services` spec:

```ts
  { key: 'slug', label: 'URL slug', help: 'Becomes /services/<slug>. Changing it breaks existing links.' },
  { key: 'mode', label: 'Mode', help: '"page" builds a page here. "pointer" links out to Limi Creatives instead — use it for any service limicreatives.com already has a page for.' },
  { key: 'externalUrl', label: 'Points to', help: 'Required when mode is "pointer".' },
  { key: 'body', label: 'Page body', kind: 'markdown', rows: 18, group: 'Content',
    help: 'Aim for 600+ words. This is what actually ranks.' },
  { key: 'seoTitle', label: 'SEO title', recommendedMax: 60, group: 'SEO',
    help: 'Include the service and the location, e.g. "Web Design & UI/UX in Nepal".' },
  { key: 'metaDescription', label: 'Meta description', kind: 'textarea', recommendedMax: 160, group: 'SEO' },
  { key: 'faqs', label: 'FAQs', kind: 'pairs', rows: 8, group: 'SEO',
    help: 'One per line as "question | answer". Emitted as FAQPage schema.' },
  { key: 'published', label: 'Published', kind: 'toggle' },
```

Add `slugField: 'slug'` and `publishedField: 'published'` to the services spec.

Note: the existing `'pairs'` kind edits `{value, label}` objects, but FAQs are `{question, answer}`. Widen the pairs serialiser to take the two key names via `FieldSpec` rather than adding a near-duplicate field kind.

- [ ] **Step 5: Run the suite**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add constants.ts lib/editorSchema.ts lib/editorSchema.test.ts
git commit -m "Seed three owned service pages and three pointers to Limi Creatives"
```

---

## Task 4: The entity graph

**Files:**
- Create: `lib/seoGraph.ts`
- Test: `lib/seoGraph.test.ts`

This task is the founder strategy in code. Two nodes, no `LocalBusiness` — see the entity model section above for why.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { INITIAL_DATA } from '../constants';
import { LIMI_ORG_ID, PERSON_ID, buildGraph } from './seoGraph';

const seo = INITIAL_DATA.seo;
const base = { seo, data: INITIAL_DATA };
const typesOf = (graph) => graph['@graph'].map((node) => node['@type']);
const nodeOf = (graph, type) => graph['@graph'].find((node) => node['@type'] === type);

describe('buildGraph', () => {
  it('always includes the person and the agency', () => {
    const graph = buildGraph({ ...base, path: '/', title: 'Home' });
    expect(typesOf(graph)).toContain('Person');
    expect(typesOf(graph)).toContain('Organization');
  });

  it('names Ashim as the founder of Limi Creatives, both ways', () => {
    const graph = buildGraph({ ...base, path: '/about', title: 'About' });
    expect(nodeOf(graph, 'Person').worksFor).toEqual({ '@id': LIMI_ORG_ID });
    expect(nodeOf(graph, 'Organization').founder).toEqual({ '@id': PERSON_ID });
  });

  it('references the exact @id limicreatives.com already publishes', () => {
    // Verified live 2026-09-12. A trailing slash or a www prefix here would
    // silently create a second, unrelated entity instead of merging.
    expect(LIMI_ORG_ID).toBe('https://limicreatives.com/#organization');
    expect(PERSON_ID).toBe('https://www.ashimkafle.com.np/#person');
  });

  it('declares no second local business at Limi’s phone number', () => {
    const graph = buildGraph({ ...base, path: '/contact', title: 'Contact' });
    expect(typesOf(graph)).not.toContain('LocalBusiness');
    expect(typesOf(graph)).not.toContain('ProfessionalService');
  });

  it('adds breadcrumbs for nested pages but not the home page', () => {
    expect(typesOf(buildGraph({ ...base, path: '/services/web-design', title: 'Web Design' })))
      .toContain('BreadcrumbList');
    expect(typesOf(buildGraph({ ...base, path: '/', title: 'Home' })))
      .not.toContain('BreadcrumbList');
  });

  it('emits FAQPage only when there are faqs', () => {
    const withFaqs = buildGraph({
      ...base, path: '/services/branding', title: 'Branding',
      faqs: [{ id: 'f1', question: 'How long?', answer: 'Four weeks.' }],
    });
    expect(nodeOf(withFaqs, 'FAQPage').mainEntity[0].acceptedAnswer.text).toBe('Four weeks.');
    expect(typesOf(buildGraph({ ...base, path: '/services/branding', title: 'Branding' })))
      .not.toContain('FAQPage');
  });

  it('credits the person as author and the agency as publisher on posts', () => {
    const graph = buildGraph({
      ...base, path: '/blog/x', title: 'X',
      article: { headline: 'X', published: '2026-01-01' },
    });
    const post = nodeOf(graph, 'BlogPosting');
    expect(post.author).toEqual({ '@id': PERSON_ID });
    expect(post.publisher).toEqual({ '@id': LIMI_ORG_ID });
  });

  it('resolves image paths against the site origin', () => {
    const graph = buildGraph({ ...base, path: '/', title: 'Home' });
    expect(nodeOf(graph, 'Person').image).toBe('https://www.ashimkafle.com.np/ashim-portrait.png');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/seoGraph.test.ts`
Expected: FAIL — `Failed to resolve import "./seoGraph"`.

- [ ] **Step 3: Implement `lib/seoGraph.ts`**

```ts
import { breadcrumbTrail } from './routes';
import { Faq, PortfolioData, SeoDefaults } from '../types';

/**
 * The @id limicreatives.com already publishes on its own Organization node,
 * verified live on 2026-09-12. Referencing it byte-for-byte is what lets
 * Google merge "this person founded that org" with the agency's own schema
 * into a single entity relationship. A trailing slash, a www prefix or an
 * http scheme here silently produces a second, unrelated node instead.
 */
export const LIMI_ORG_ID = 'https://limicreatives.com/#organization';
export const PERSON_ID = 'https://www.ashimkafle.com.np/#person';

export const absolute = (siteUrl: string, value: string): string =>
  /^https?:\/\//.test(value)
    ? value
    : `${siteUrl.replace(/\/$/, '')}${value.startsWith('/') ? '' : '/'}${value}`;

export interface GraphInput {
  seo: SeoDefaults;
  data: PortfolioData;
  path: string;
  title: string;
  description?: string;
  faqs?: Faq[];
  /** Set for blog posts and case studies. */
  article?: { headline: string; image?: string; published?: string; tags?: string[] };
  /** Set for /services/:slug. */
  service?: { name: string; description: string };
}

/**
 * Builds one @graph per page rather than several loose JSON-LD blocks.
 *
 * Two entity nodes and no more: the Person (defined authoritatively here) and
 * the agency Organization (referenced, not redefined — limicreatives.com owns
 * that definition). Deliberately no LocalBusiness or ProfessionalService: the
 * agency's schema publishes the same phone number this site would use, and two
 * local businesses at one number degrades local trust signals for both.
 */
export const buildGraph = ({
  seo, data, path, title, description, faqs, article, service,
}: GraphInput) => {
  const origin = seo.siteUrl.replace(/\/$/, '');
  const url = absolute(origin, path);
  const desc = description || seo.description;

  const nodes: Array<Record<string, unknown>> = [
    {
      '@type': 'Person',
      '@id': PERSON_ID,
      name: data.name,
      jobTitle: data.company.role || data.role,
      url: `${origin}/about`,
      image: absolute(origin, seo.ogImage),
      description: data.heroIntro,
      email: data.contact.email ? `mailto:${data.contact.email}` : undefined,
      telephone: data.contact.phone || undefined,
      homeLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: seo.geo.city,
          addressRegion: seo.geo.region,
          addressCountry: seo.geo.country,
        },
      },
      knowsAbout: data.ticker,
      worksFor: { '@id': LIMI_ORG_ID },
      sameAs: data.social.map((link) => link.url).filter(Boolean),
    },
    {
      // A reference, not a redefinition. Only what is needed to assert the
      // relationship — limicreatives.com owns the full definition.
      '@type': 'Organization',
      '@id': LIMI_ORG_ID,
      name: data.company.name,
      url: data.company.url || undefined,
      founder: { '@id': PERSON_ID },
    },
  ];

  const trail = breadcrumbTrail(path, title);
  if (trail.length > 1) {
    nodes.push({
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: absolute(origin, crumb.path),
      })),
    });
  }

  if (service) {
    nodes.push({
      '@type': 'Service',
      name: service.name,
      description: service.description,
      url,
      provider: { '@id': PERSON_ID },
      areaServed: seo.geo.areaServed,
    });
  }

  if (article) {
    nodes.push({
      '@type': 'BlogPosting',
      headline: article.headline,
      description: desc,
      image: absolute(origin, article.image || seo.ogImage),
      url,
      datePublished: article.published || undefined,
      author: { '@id': PERSON_ID },
      publisher: { '@id': LIMI_ORG_ID },
      keywords: article.tags?.length ? article.tags.join(', ') : undefined,
    });
  }

  if (faqs?.length) {
    nodes.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }

  // Stripping undefined keeps the emitted JSON small and the Rich Results
  // Test output clean.
  const prune = (node: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(node).filter(([, value]) => value !== undefined));

  return { '@context': 'https://schema.org', '@graph': nodes.map(prune) };
};
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run lib/seoGraph.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/seoGraph.ts lib/seoGraph.test.ts
git commit -m "Assert Ashim as founder of Limi Creatives in a linked entity graph"
```

---

## Task 5: Breadcrumbs component and the Seo rewire

**Files:**
- Create: `components/Breadcrumbs.tsx`
- Modify: `components/Seo.tsx`

- [ ] **Step 1: Write `components/Breadcrumbs.tsx`**

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { breadcrumbTrail } from '../lib/routes';

/**
 * Visible breadcrumb trail. The matching BreadcrumbList schema is emitted
 * separately by lib/seoGraph.ts — Google wants both, and it is the visible
 * trail that earns the breadcrumb display in the SERP.
 */
const Breadcrumbs: React.FC<{ path: string; title: string }> = ({ path, title }) => {
  const trail = breadcrumbTrail(path, title);
  if (trail.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className="mono mb-8 text-[var(--grey-1)]">
      <ol className="flex flex-wrap items-center gap-2">
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-2">
              {isLast ? (
                <span aria-current="page" className="text-[var(--ink)]">{crumb.name}</span>
              ) : (
                <Link to={crumb.path} className="link-wipe hover:text-[var(--ink)]">{crumb.name}</Link>
              )}
              {!isLast && <span aria-hidden="true" className="opacity-40">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
```

- [ ] **Step 2: Rewire `components/Seo.tsx`**

Replace the inline JSON-LD construction inside `upsertJsonLd(...)` with a call to `buildGraph`. Add `data`, `faqs` and `service` to `SeoProps`. Delete the local `absolute` helper in favour of the one exported from `lib/seoGraph.ts`. The `author` prop becomes unused — `buildGraph` resolves the author by `@id` — so remove it from `SeoProps` and from every call site.

Everything else stays; the meta upserts are correct as written. Serialise the graph once and depend on the string, so a fresh-but-equal object does not retrigger the effect on every render:

```ts
const graph = useMemo(
  () => JSON.stringify(buildGraph({
    seo: defaults, data, path, title: title || defaults.siteName,
    description: desc, faqs, service, article,
  })),
  [defaults, data, path, title, desc, faqs, service, article],
);
```

`upsertJsonLd` then takes the string directly rather than re-stringifying.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/Breadcrumbs.tsx components/Seo.tsx
git commit -m "Show a breadcrumb trail and emit the shared graph at runtime"
```

---

## Task 6: The four new pages

**Files:**
- Create: `pages/ServiceDetailPage.tsx`, `pages/AboutPage.tsx`, `pages/ContactPage.tsx`, `pages/BlogCategoryPage.tsx`
- Modify: `App.tsx`

Model each on `pages/BlogDetailPage.tsx` — it already does the `useParams` lookup, the `Seo` call, the `Markdown` render and the not-found fallback. Match its structure and its visual language (`card-physical`, `mega`, `display`, `surface-inset`) rather than inventing new markup.

**Non-negotiables for all four:**

- Exactly one `<h1>`, carrying the target query and the geo modifier where it reads naturally.
- `<Breadcrumbs path={...} title={...} />` directly under the nav.
- `<Seo ... data={data} />`, with `service` set on service pages and `faqs` passed through.
- An unmatched slug renders `<NotFoundPage />` — not a blank page — and that branch must not emit an indexable `Seo` call.
- Links out. Every page links somewhere useful; orphan pages do not rank.

**`AboutPage` — the most important page in this plan.** It exists to make "Ashim Kafle" and "Limi Creatives founder" resolve to this site.

- `<h1>Ashim Kafle — Product Designer & Digital Marketer in Kathmandu</h1>`
- A founder paragraph naming **Limi Creatives** and the role **Co-founder & CMO** as visible text, with a plain `<a href="https://limicreatives.com">` link. Schema without matching visible text is discounted.
- Genuine biography: background, what he does at Limi, what he did before. This is the E-E-A-T surface.
- The portrait with real `alt` text naming him.

**`ServiceDetailPage`** — resolve the slug against `data.services.filter((s) => s.mode === 'page' && s.published)`. A slug belonging to a `pointer` service must 404 rather than render an empty page. Render `service.body` through `Markdown`, then the FAQs as visible `<h3>`/`<p>` pairs (the FAQ schema is ignored without them). Link to the two sibling owned services and to `/contact`.

**`ContactPage`** — the NAP block as real visible text: name, `Kathmandu, Nepal`, the phone, the email. No `LocalBusiness` schema, per the entity model.

**`BlogCategoryPage`** — resolve against `data.blogCategories`, list that category's published posts.

`App.tsx` gains these, with the category route before `/blog/:slug` so it matches first:

```tsx
<Route path="/about" element={<AboutPage data={data} />} />
<Route path="/contact" element={<ContactPage data={data} />} />
<Route path="/services/:slug" element={<ServiceDetailPage data={data} />} />
<Route path="/blog/category/:slug" element={<BlogCategoryPage data={data} />} />
```

- [ ] **Step 1: Create the four page components** per the constraints above.
- [ ] **Step 2: Add the routes to `App.tsx`.**
- [ ] **Step 3: Typecheck.** Run: `npx tsc --noEmit` — expect no errors.
- [ ] **Step 4: Verify in the browser.** Start the dev server and load `/about`, `/contact`, `/services/web-design`, `/blog/category/design`, and two deliberately bad slugs: `/services/nope` and `/services/seo` (a pointer service — must 404, not render). Confirm `document.querySelectorAll('h1').length === 1` on each real page and a visible breadcrumb trail.
- [ ] **Step 5: Commit**

```bash
git add pages/ServiceDetailPage.tsx pages/AboutPage.tsx pages/ContactPage.tsx pages/BlogCategoryPage.tsx App.tsx
git commit -m "Add the about, contact, service and category pages"
```

---

## Task 7: Give the hub pages an h1, and link them together

**Files:**
- Modify: `pages/WorksPage.tsx`, `pages/ServicesPage.tsx`, `pages/BlogPage.tsx`, `pages/VibePage.tsx`, `components/Footer.tsx`

Four hub pages ship no `<h1>` at all — confirmed by `grep -rn "<h1" pages`, which finds them only in `BlogDetailPage`, `GalleryPage`, `LandingPage`, `NotFoundPage` and the dashboard. Each hub has a large display heading rendered as a `div` or `h2`; promote it, keeping the existing classes so nothing shifts visually.

- [ ] **Step 1: Promote the display heading on each of the four pages to `<h1>`,** with copy that carries the query: `Work` → `Design & Marketing Work from Nepal`; `Services` → `Design Services in Nepal`.
- [ ] **Step 2: Render pointer services as outbound cards on `ServicesPage`.** Owned services link to `/services/:slug`; pointer services link to `externalUrl` with a visible label making it clear the work happens through Limi Creatives. These are genuine editorial links to a site Ashim owns — plain `<a href>`, no `nofollow`.
- [ ] **Step 3: Add a link column to `components/Footer.tsx`** listing the three owned service pages, `/about` and `/contact`, plus one link to `limicreatives.com`. This is the internal-linking backbone — it is how link equity reaches the money pages from every URL on the site.
- [ ] **Step 4: Verify.** On the dev server, confirm `document.querySelectorAll('h1').length === 1` on each of `/works`, `/services`, `/blog`, `/vibe`.
- [ ] **Step 5: Commit**

```bash
git add pages components/Footer.tsx
git commit -m "Give every hub page a single h1 and link the money pages sitewide"
```

---

## Task 8: Prerender real HTML for every route

**Files:**
- Modify: `scripts/prerender.mjs`, `scripts/_prerender-entry.ts`

The highest-impact task in the plan. Today `/`, `/works`, `/services`, `/blog`, `/gallery` and `/vibe` ship `<div id="root"></div>` — no heading, no text, no links. Verified live: `curl https://www.ashimkafle.com.np/services` returns a title and a meta description and nothing else. Only `/works/:slug` and `/blog/:slug` get a body, because `writeRoute` injects one only when `options.body` is set and the static routes never set it.

- [ ] **Step 1: Import the shared modules.** The script already bundles app code through `scripts/_prerender-entry.ts` and esbuild. Extend that entry to re-export `buildGraph`, `breadcrumbTrail` and `STATIC_ROUTES`. Then delete the duplicated `absolute` helper and the inline JSON-LD construction in `buildTags`, replacing both with the imports. Two copies of this logic is exactly how the runtime and the static HTML drift apart.

- [ ] **Step 2: Give every static route a body.** Replace the `staticRoutes` array so each entry carries body markup — at minimum an `<h1>`, the intro paragraph, and a `<ul>` of links to its children:

```js
const linkList = (items) =>
  `<ul>${items
    .map((item) => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`)
    .join('')}</ul>`;

const owned = (data.services ?? []).filter((s) => s.mode === 'page' && s.published !== false);
const pointers = (data.services ?? []).filter((s) => s.mode === 'pointer');
const serviceLinks = [
  ...owned.map((s) => ({ href: `/services/${s.slug}`, label: s.title })),
  ...pointers.map((s) => ({ href: s.externalUrl, label: `${s.title} — via Limi Creatives` })),
];

const staticRoutes = [
  {
    path: '/', title: '', description: data.tagline,
    body:
      `<h1>${escapeHtml(data.name)} — ${escapeHtml(data.role)}</h1>` +
      `<p>${escapeHtml(data.heroIntro)}</p>` +
      linkList(serviceLinks),
  },
  {
    path: '/about', title: 'About Ashim Kafle', description: /* the about intro */ '',
    body:
      `<h1>${escapeHtml(data.name)} — ${escapeHtml(data.role)} in ${escapeHtml(data.seo.geo.city)}</h1>` +
      `<p>${escapeHtml(data.heroIntro)}</p>` +
      `<p>${escapeHtml(data.company.role)} at <a href="${escapeHtml(data.company.url)}">` +
      `${escapeHtml(data.company.name)}</a>. ${escapeHtml(data.company.description)}</p>`,
  },
  // …the same shape for /contact, /services, /works, /blog, /gallery, /vibe
];
```

The `/about` body must contain the founder sentence as real text, because that page is the whole point of the entity work in Task 4.

- [ ] **Step 3: Emit the owned service pages only.** Loop `owned` — **not** all services. A pointer service must get no file and no sitemap entry, or the site ends up with a page competing with limicreatives.com after all. Use `markdownToHtml(service.body)` for the body, pass `service` to `buildGraph`, and append the FAQs as visible `<h3>`/`<p>` pairs.

- [ ] **Step 4: Emit the blog category pages.** One per `data.blogCategories`, at `/blog/category/${category.slug}`, listing that category's published posts as links. Skip categories with no published posts — an empty listing is thin content.

- [ ] **Step 5: Add `lastmod` to the sitemap.** Use the post or project date where there is one, otherwise the build date. Read priorities from `STATIC_ROUTES` rather than the current hardcoded `route.path === '/' ? '1.0' : '0.8'` ternary, which is what currently gives `/vibe` the same weight as `/services`.

- [ ] **Step 6: Build and verify the output is no longer hollow.**

```bash
npm run build
```

```bash
grep -c "<h1>" dist/index.html dist/about/index.html dist/services/index.html dist/services/web-design/index.html dist/works/index.html dist/blog/index.html
```

Expected: `1` for each. Then confirm the founder claim and the absence of pointer pages:

```bash
grep -c "limicreatives.com/#organization" dist/about/index.html
test ! -d dist/services/seo && echo "no pointer page: ok"
grep -c "lastmod" dist/sitemap.xml
```

Expected: at least `1`, then `no pointer page: ok`, then a count equal to the number of `<loc>` entries.

- [ ] **Step 7: Commit**

```bash
git add scripts/prerender.mjs scripts/_prerender-entry.ts
git commit -m "Ship crawler-visible markup, breadcrumbs and lastmod on every route"
```

---

## Task 9: Drop the Tailwind CDN

**Files:**
- Modify: `index.html`, `index.tsx`, `package.json`
- Create: `src/index.css`, `tailwind.config.js`, `postcss.config.js`

`index.html` loads `https://cdn.tailwindcss.com`, which compiles Tailwind in the browser on every page view. It is render-blocking, it is explicitly documented as not for production, and it costs LCP on exactly the mobile connections most Nepali visitors are on.

- [ ] **Step 1: Install.**

```bash
npm install -D tailwindcss@^3 postcss autoprefixer
```

- [ ] **Step 2: Create `tailwind.config.js`.**

```js
export default {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './{pages,components,lib}/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
```

A wrong `content` glob silently purges classes rather than erroring, so step 5 verifies against the built CSS.

- [ ] **Step 3: Create `postcss.config.js`.**

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

- [ ] **Step 4: Move the inline styles.** Create `src/index.css` with the three `@tailwind` directives, then the entire existing `<style>` block from `index.html` below them, verbatim — the custom properties, `.mono`, `.card-physical`, `.glass-card`, `.invert-row` and the rest are hand-written CSS and carry over unchanged. Remove the `<style>` block and the `<script src="https://cdn.tailwindcss.com"></script>` line from `index.html`, and add `import './src/index.css';` at the top of `index.tsx`.

- [ ] **Step 5: Build and verify nothing was purged.**

```bash
npm run build && ls -la dist/assets/*.css
```

Load the built output and compare against the dev server. The classes most likely to be purged are those referenced only from string concatenation or from the prerenderer: `invert-row`, `blend-difference`, `marquee-mask`, `bracket`, `no-scrollbar`, `animate-drift`. Check each renders.

- [ ] **Step 6: Commit**

```bash
git add index.html index.tsx src/index.css tailwind.config.js postcss.config.js package.json package-lock.json
git commit -m "Compile Tailwind at build time instead of in the visitor's browser"
```

---

## Task 10: Verify the whole thing

- [ ] **Step 1: Full suite.** Run: `npx vitest run` — expect all green.
- [ ] **Step 2: Typecheck.** Run: `npx tsc --noEmit` — expect no errors.
- [ ] **Step 3: Build.** Run: `npm run build` — expect the prerender summary to report 8 static pages, 3 services, the categories, the projects and the posts.
- [ ] **Step 4: Audit every built page.** For each `dist/**/index.html`: exactly one `<h1>`, a `<title>` at or under 60 characters, a `<meta name="description">` at or under 160, a canonical matching the path, and a JSON-LD `@graph`.
- [ ] **Step 5: Confirm no page competes with Limi.** No `dist/services/seo/`, `dist/services/content-creation/` or `dist/services/paid-advertising/` directory exists, and `sitemap.xml` contains no such URL.
- [ ] **Step 6: Validate the schema.** Paste `dist/about/index.html` into Google's Rich Results Test. Confirm `Person`, `Organization` and `BreadcrumbList` parse with no errors, and that `worksFor` and `founder` resolve to the two `@id`s.
- [ ] **Step 7: Commit and deploy.**

---

## After the code: what actually makes it rank

This restructure buys rankable surface area and asserts the founder relationship. It does not by itself produce rankings, and it is worth being blunt about that. Four things sit outside this plan and matter more than any task in it:

1. **Replace the seed content.** Five fake projects — `Vortex Crypto`, `Solstice Fashion`, `Nova Dashboard`, `Zenith Banking`, `Aura Skincare` — are still live, with case studies of 61 to 82 characters, alongside two blog posts of 91 and 61 characters. Meanwhile limicreatives.com has six real case studies. Porting even three of them here, written from Ashim's perspective as the designer, is the highest-value change available.
2. **The Limi side of the founder link.** `limicreatives.com` contains zero links to ashimkafle.com.np and its `Organization` schema has no `founder`. Until that changes, Google has one uncorroborated claim from the weaker domain. Spec is written and waiting at `docs/superpowers/specs/limi-creatives-founder-linkage.md`.
3. **Google Search Console.** Verify the domain, submit `sitemap.xml`, watch Coverage. A month with no rankings and no GSC property means there is no evidence Google has crawled the site at all. Ten minutes, and it should happen before anything else here.
4. **Fill in the empty `sameAs` profiles.** `social` currently has LinkedIn filled and Dribbble and Instagram as empty strings. `sameAs` is a primary entity-resolution signal and it is currently one URL long.
