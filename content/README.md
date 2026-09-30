# Posts written in the repo

`content/posts/*.md` are blog posts written and reviewed as files, then shipped with a deploy. `npm run posts` compiles them into `content/posts.generated.ts`, which is committed. A test fails if you forget to run it.

## How they reach the site

`lib/repoPosts.ts` merges them into the content everywhere the site reads it: the content API, the page renderer, the sitemap and the SPA.

The dashboard is still the source of truth:

- A repo post appears in the dashboard's post list like any other.
- The first time you save anything in the dashboard, the repo posts are written into the stored document.
- From then on the stored copy wins. Editing the `.md` file afterwards changes nothing.
- A stored post with the same id or slug always wins over the file.

To publish a draft, open it in the dashboard, set it to published, set the date, and save. To retire a post, unpublish it in the dashboard. If you delete it there while its file still exists, the file's copy comes back.

## Front matter

One `key: value` per line. Each value is JSON, so strings are quoted.

```
---
title: "Do You Need a Website If You Already Sell on Facebook, Instagram or TikTok?"
slug: "website-vs-facebook-page-nepal"
seoTitle: "Website vs Facebook Page for Nepali Businesses (2026)"
metaDescription: "…140–160 characters…"
excerpt: "…one or two sentences…"
categoryId: "nepal-market"
tags: ["…", "…"]
readTime: "9 min"
date: "Oct 1, 2026"
published: true
---
Body in Markdown. Start with the first paragraph, not a "# Title" line.
```

A post without `published: true` is a draft. It can be opened by direct link, but it is never listed or indexed.

`lib/repoPosts.test.ts` checks every file:

- the SEO title fits in 60 characters and the meta description is 100–160;
- the body is long enough to be indexed;
- it has a real category;
- it links to a service page and to `/contact`;
- every internal link resolves;
- a published post links to no drafts.
