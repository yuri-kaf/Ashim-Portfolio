# Limi Creatives — founder linkage spec (apply later)

**Status:** Not to be applied yet. `limicreatives.com` is under active development as of 2026-09-12; Ashim asked that we make no changes there for now. This document records the exact changes so they can be applied in one pass when that site is ready.

**Why this matters:** the goal is for Ashim Kafle to rank as the founder of Limi Creatives. Entity association is a two-way assertion. The work in `docs/superpowers/plans/2026-09-12-local-seo-restructure.md` makes ashimkafle.com.np assert "this person founded that organization". Until limicreatives.com asserts the reverse, Google has one uncorroborated claim from the weaker domain. The reciprocal link is the single strongest signal available for this goal, and it is worth more than anything on the personal site.

---

## Observed state (2026-09-12)

Captured by fetching the live site, so re-verify before applying — the site is being worked on.

- `https://limicreatives.com/` returns 200.
- Title: `Marketing That Helps You Grow | Limi Creatives`
- 26 URLs in `sitemap.xml`, including six real blog posts and six case studies.
- Two JSON-LD blocks. The first is:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://limicreatives.com/#organization",
  "name": "Limi Creatives",
  "url": "https://limicreatives.com/",
  "logo": "https://limicreatives.com/logos/limi-red.svg",
  "image": "https://limicreatives.com/og/limi-creatives.png",
  "description": "Limi Creatives is a digital marketing and creative agency in Kathmandu running content, social media, SEO and paid advertising as one strategy.",
  "email": "info@limicreatives.com",
  "telephone": "+9779805812718",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Kathmandu",
    "addressCountry": "NP"
  }
}
```

- **`grep -i ashimkafle` over the homepage returns nothing.** The site does not link to ashimkafle.com.np anywhere.
- The `Organization` node has **no `founder` property**.

---

## Change 1: Add `founder` to the Organization schema

The `@id` values below must match exactly — `https://limicreatives.com/#organization` is what Limi already publishes, and `https://www.ashimkafle.com.np/#person` is what the personal site will publish after the restructure. Matching `@id`s across two domains is what lets Google merge the assertions into one entity relationship. A near-miss (a trailing slash, `http` vs `https`, a missing `www`) silently produces two unrelated nodes.

Add to the existing Organization node:

```json
  "founder": {
    "@type": "Person",
    "@id": "https://www.ashimkafle.com.np/#person",
    "name": "Ashim Kafle",
    "jobTitle": "Co-founder & CMO",
    "url": "https://www.ashimkafle.com.np/about",
    "sameAs": [
      "https://www.ashimkafle.com.np/",
      "https://www.linkedin.com/in/ashim-kafle-676a312a5/"
    ]
  },
```

Do **not** duplicate the rest of the Person's properties here. One authoritative definition lives on the personal site; this is a reference plus the minimum needed to identify it.

---

## Change 2: A real founder bio on `/about`

Schema without matching visible content is discounted. `https://limicreatives.com/about` needs a founder section carrying, as visible text:

- Ashim Kafle, named, with the title **Co-founder & CMO**.
- Two to three sentences of genuine biography — background, what he does at Limi, what he did before.
- A link to `https://www.ashimkafle.com.np/` with **descriptive anchor text**. Use `Ashim Kafle` or `Ashim Kafle's portfolio`. Do not use "click here", and do not use an exact-match commercial phrase like "digital marketer in Nepal" — an exact-match anchor from a site you also own reads as manipulation.
- The link must be a plain `<a href>`. Not `rel="nofollow"`, not JavaScript-driven, not behind an interaction.

---

## Change 3: Reciprocal `sameAs`

Both sites should list the same set of profiles so the entity resolves consistently. Right now the personal site has only LinkedIn filled in; Dribbble and Instagram are empty strings in its content document.

Before applying this change, collect the real URLs for: LinkedIn (have it), Instagram, Facebook, Dribbble or Behance, and the Limi company LinkedIn page. Then:

- Limi's `Organization.sameAs` → the company's own profiles.
- Limi's `founder.sameAs` → Ashim's personal profiles (as in Change 1).
- The personal site's `Person.sameAs` → the same personal profiles, character-for-character identical.

Inconsistent `sameAs` sets across the two sites are worse than a short consistent one.

---

## Change 4: Do not add a second LocalBusiness

Limi's `Organization` publishes `telephone: "+9779805812718"`. That is also Ashim's personal number (`+977 9805 812 718` in the personal site's content document).

The personal site has been deliberately built to declare a `Person` and **no** `ProfessionalService` or `LocalBusiness`, precisely so there are not two local-business entities sharing one phone number in Kathmandu — which degrades local trust signals for both. Keep it that way. If a second business entity is ever genuinely needed, it needs its own phone number first.

---

## Change 5: Keep the service keyword split intact

The personal site has been scoped to avoid competing with Limi. Limi owns the commercial service queries; the personal site owns the person.

| Query family | Owned by |
|---|---|
| `seo services nepal`, `content creation nepal`, `facebook ads agency kathmandu`, `social media management nepal` | **limicreatives.com** — it already has pages for all four |
| `web design nepal`, `ui ux designer nepal`, `branding agency nepal`, `motion graphics nepal` | **ashimkafle.com.np** — Limi has no pages for these |
| `ashim kafle`, `limi creatives founder`, `ashim kafle cmo` | **ashimkafle.com.np** |

If Limi later adds `/services/web-design` or `/services/branding`, that split breaks and the personal site's two money pages start competing with it. Revisit this document before adding either.

---

## Verification once applied

1. `curl -s https://limicreatives.com/about | grep -i ashimkafle` returns at least one match.
2. Limi's homepage JSON-LD contains `"founder"` with `"@id": "https://www.ashimkafle.com.np/#person"`.
3. The personal site's JSON-LD contains `"worksFor"` with `"@id": "https://limicreatives.com/#organization"`.
4. Both `@id` strings match byte-for-byte across the two sites.
5. Google Rich Results Test on both homepages reports no errors.
