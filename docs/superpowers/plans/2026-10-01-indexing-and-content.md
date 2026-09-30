# Indexing fix and first content batch (2026-10-01)

## What Search Console showed on 2026-10-01

- **Indexed:** 2 pages, the home page and a seed placeholder post.
- **"Discovered – currently not indexed":** 13 pages that Google found in the sitemap and never crawled. They include `/about`, `/services`, `/services/web-design` and `/blog`.
- **"Page with redirect":** 2. These are the http and non-www variants, and are expected.
- **The real post:** `/blog/ui-ux-in-nepal-what-it-actually-costs` shows as "URL is unknown to Google". It had no sitemap entry and no referring page.
- **Traffic:** 29 impressions and 9 clicks since 11 Sept, all for branded queries.
- **Sitemap:** submitted 12 Sept, last read 27 Sept.
- **Cloudflare:** DNS only. www is a CNAME to Vercel and isn't proxied, so there's nothing to change there.

## Root causes

1. **Pages were baked once per deploy.** The UI/UX post was published from the dashboard on 14 Sept, after the 12 Sept deploy. It was served the home page's HTML: home title, `canonical=/`. It was also missing from the sitemap. Every dashboard post would have gone the same way.
2. **Unknown URLs got the same HTML with a 200.** That's a soft 404 that also claims to be the home page.
3. **Thin content across the site:** two seed placeholder posts (61–91 characters, and Google indexed one of them) and five placeholder case studies. The home and hub titles and descriptions also named no service and no place.
4. **Weak internal links:** the home page linked to no posts, service rows didn't link to service pages, and posts had one "read next" link and nothing else.

## What shipped (branch `seo/indexing-and-content`)

- **`api/page.ts` renders every route from live content at request time**, with edge caching (2 min fresh, then stale-while-revalidate).
  - Real 404s, 503 on storage failure, and a 308 redirect for a trailing slash.
  - `/sitemap.xml` is now `api/sitemap.ts`, built from the same content.
- **One page model, `lib/pageMeta.ts`,** shared by the SPA and the server.
- **Placeholder-thin posts** (under 1,200 characters) are noindexed and left out of the sitemap, and the dashboard flags them.
- **Structured data:** a WebSite node and ProfilePage on `/about`, plus ISO dates on BlogPosting.
- **Titles:** the home title ends "in Nepal", hub titles name their query, and a long SEO title drops the " | Ashim Kafle" suffix instead of being truncated.
- **Home page:** a what-and-where line above the headline, service rows link to their pages, and the three newest posts are listed.
- **Posts:** an author box, related posts and service links. Service pages list the posts that link to them.
- **Favicon set.**
- **Repo-written posts:** Markdown in `content/posts/` is merged into the content (see `content/README.md`). One is published and six are drafts.

## Dashboard edits that could not be made from here

These are content, not code, and the dashboard needs your password. Copy and paste:

- **Profile → Role:** `UI/UX Designer & Digital Marketer`.
  - The home title becomes "Ashim Kafle — UI/UX Designer & Digital Marketer in Nepal" (56 characters).
  - Search volume in Nepal is for "ui ux designer", not "product designer".
- **SEO → Description** (153 characters): `UI/UX designer and digital marketer in Kathmandu, Nepal. Websites, product design and branding for Nepali businesses. Co-founder & CMO of Limi Creatives.`
- **Page intros → Blog:** `Practical notes on web design, UI/UX and digital marketing for businesses in Nepal: pricing, payments, platforms and what actually brings enquiries.`
- **Page intros → Services:** `Web design, UI/UX, branding and motion for businesses in Nepal, with SEO, content and ads run through Limi Creatives.`
- **The UI/UX pricing post:**
  - Add the excerpt: `What UI/UX design costs in Nepal, when a business genuinely needs it, and why skipping it usually costs more later. Typical NPR price ranges inside.`
  - Delete its first line (`# UI/UX in Nepal: …`). The page already prints the title, so it shows twice.
  - Link the last paragraph's "Send over what you're building" to `/contact` and link "UI/UX design" to `/services/web-design`.
- **Blog categories → SEO titles:**
  - Design: `Web Design & UI/UX Articles`
  - Marketing: `Digital Marketing Articles`
  - The Nepal Market: `Doing Business Online in Nepal`
- **Delete or unpublish the two seed posts:** "The Future of Minimalist Design" and "Why Red is the Color of 2025".
- **Replace the five placeholder projects** (Vortex Crypto etc.) with real case studies, even two or three. They are noindexed, but they are the first thing visitors see under "Work".
- **Social:** fill in the Instagram, Dribbble and Behance URLs, or delete the empty entries. They feed `sameAs`, which ties your profiles into one entity.

## Publishing the drafts

1. Open each draft in the dashboard and read it.
2. Fix anything that isn't true for you.
3. Set the date and publish.

Posting one a week gives Google a steady reason to recrawl. The suggested order:

1. `how-to-hire-a-web-designer-in-nepal`
2. `esewa-khalti-fonepay-connectips-website-payments`
3. `static-wordpress-or-custom-website-nepal`
4. `nepali-devanagari-fonts-for-websites`
5. `trekking-tour-website-design-nepal`
6. `digital-marketing-bhaneko-k-ho`. Have a Nepali reader check it first.

## Off-site (the part code cannot do)

- **Limi Creatives:** link to ashimkafle.com.np from the Limi about page as the founder. This is spec'd in `docs/superpowers/specs/limi-creatives-founder-linkage.md` and is the strongest single signal available.
- **LinkedIn:** put the site in the LinkedIn profile's website field.
- **Other profiles:** put the site in the bios of Instagram, Behance and Dribbble.
- **Directories:** list the site where Nepali freelancers and designers are listed, such as Clutch and GoodFirms profiles, via Limi.
