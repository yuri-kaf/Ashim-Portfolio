---
title: "Designing Websites in Nepali: The Right Nepali Font, Devanagari Sizes and Bilingual Layouts"
slug: "nepali-devanagari-fonts-for-websites"
seoTitle: "Nepali Font for Website: A Devanagari Web Font Guide"
metaDescription: "How to choose a Nepali font for your website in Nepal: why Unicode beats Preeti, four free Devanagari web fonts, CSS sizes and bilingual layout tips."
excerpt: "Why Preeti breaks your website, which Devanagari web fonts to use, and the sizing, spacing and bilingual details that make Nepali text read properly on a phone."
categoryId: "design"
tags: ["Nepali Font", "Devanagari Web Font", "Nepali Unicode Font", "Bilingual Website Nepal", "Web Design Nepal", "Typography"]
readTime: "9 min"
---
A lot of the Nepali-language websites I'm asked to look at have the same problem, and it's rarely the colours. The Nepali text is a picture, or it's typed in Preeti because that's what the print designer had, or it's proper Unicode set at exactly the same size and spacing as the English, so every ि and ु scrapes against the line above it. None of this shows up in a Figma mockup. All of it shows up on a phone.

This is what I tell clients and their developers when choosing a Nepali font for a website. It applies to a website fully in the Nepali language and to a bilingual website in Nepal where Nepali and English share the page. Fonts first, then sizing, then the details people skip: language tags, the switcher, numbers and dates.

## Use Unicode, not Preeti

Preeti looks like a Nepali font. It isn't one, really. It draws Devanagari shapes over ordinary Latin keys: you press a key, the file stores a normal English letter or symbol, and Preeti paints it as a Nepali character. On a printed banner, nobody can tell. The moment that text leaves the design file, it breaks.

- **Copy and paste.** A customer copies your address into Viber or Messenger. The other app doesn't use Preeti, so it shows what's actually stored: a line of random English letters and punctuation.
- **Search.** Google reads the characters that are stored, not the shapes you see. A restaurant page typed in Preeti contains no Nepali at all as far as a search engine is concerned, so nobody searching in Nepali will find it.
- **Screen readers** read out the same gibberish.
- **Anywhere the font fails to load,** visitors see raw Latin letters instead of Nepali.

A Nepali Unicode font fixes all of this, because in Unicode every Devanagari character has its own code that means the same thing in every app, font and search engine. Phones already type Unicode Nepali, so text a client sends you on Viber is usually fine. The Preeti problem mostly comes from old print files and office documents.

If you're handed Preeti text, run it through one of the free Preeti-to-Unicode converters online, then check the result by eye. Watch the ि matra and the reph (the small र् that sits on top of the next letter). Preeti types those in the order you see them, Unicode stores them in the order you say them, and that is where conversions tend to slip.

And don't dodge the problem by putting Nepali text in images. You get the same search and copy-paste issues, plus text that blurs on large screens and can't be changed without a designer.

## Choosing a Devanagari web font

Google Fonts has several Devanagari families released under the SIL Open Font License. In plain terms, you can use them on a commercial website, self-host them and embed them in an app without paying a licence fee. These four cover most projects:

| Family | Style | Weights on Google Fonts | Good for |
|---|---|---|---|
| Mukta | Sans serif, by Ek Type | 7 weights, 200 to 800 | Interfaces, body text, and headings that need a real weight range |
| Hind | Sans serif, by Indian Type Foundry | 5 weights, 300 to 700 | Plain body copy, forms, tables, dashboards |
| Noto Sans Devanagari | Sans serif, by Google | Variable, weight 100 to 900, plus a width axis | Apps and larger sites; one file for every weight, narrower widths for tight spaces |
| Tiro Devanagari Hindi | Serif, by Tiro Typeworks | Regular and italic | Editorial headlines, heritage and cultural brands, invitations |

Weights are as listed on Google Fonts at the time of writing.

**Mukta** is a sensible default for interfaces. Seven weights cover headings, labels and body text without faking anything.

**Hind** is plainer and a little more conservative. It's comfortable in forms, tables and anything that needs to feel official.

**Noto Sans Devanagari** is a variable font, so one file covers the whole weight range, and the width axis helps in tabs, table headers and other tight spots.

**Tiro Devanagari Hindi** is the only serif here: bookish, with a designed italic. Good for headlines and long reads, less so for 14px form labels. It was made with Hindi conventions in mind, so test it with your actual Nepali copy before committing.

Whatever you pick, test it with real Nepali sentences, not lorem ipsum. Set a few conjunct-heavy words such as राष्ट्रिय, स्वास्थ्य, कार्यालय and क्षेत्र at your real body size. Fonts that look alike in a specimen can behave very differently once the stacked forms get small.

### Pairing Devanagari with a Latin typeface

All four families include Latin letters, and using the family's own Latin is the easiest way to keep both scripts looking related. If your brand already has an English typeface, choose the Devanagari partner by character: a clean geometric or grotesque Latin sits better with Mukta or Hind than with Tiro. Then match the visual size, not the number in the CSS, which usually means nudging the Devanagari up.

Decide this once and write it down. Any [brand identity](/services/branding) that will appear in both languages should name its Nepali typeface as clearly as its English one, so the next designer isn't guessing.

## Give Devanagari more size and more line-height

Devanagari hangs from a headstroke, the shirorekha, the line that runs along the top of a word. Vowel signs (matras) and other marks sit above it, like ि ी े ै ं ँ and the reph, and below the baseline, like ु ू ृ and the halant ्. Latin has ascenders and descenders too, but Devanagari stacks more above and below, and at the same font size its main letter shapes usually look smaller than Latin lowercase.

Set Nepali at the same size and line-height as your English and two things happen. The Nepali looks a size smaller than the English beside it, and the marks under one line collide with the marks above the next. A slightly larger size and noticeably looser line-height fixes both.

Here's where I'd start. These are starting points, not rules. The right values depend on the font, so check them with real paragraphs on a real phone.

```css
/* English defaults */
body {
  font-family: "Inter", system-ui, sans-serif;
  font-size: 1rem;          /* 16px */
  line-height: 1.5;
}

/* Anything marked lang="ne", and everything inside it */
:lang(ne) {
  font-family: "Mukta", "Noto Sans Devanagari", sans-serif;
  letter-spacing: normal;   /* never track Devanagari */
  font-synthesis: none;     /* no fake bold or italic */
}

/* Body copy: a little larger, a lot more leading */
p:lang(ne),
li:lang(ne) {
  font-size: 1.125rem;      /* about 18px next to 16px English */
  line-height: 1.75;
}

/* Headings: English often sits at 1.1 to 1.2 */
h1:lang(ne),
h2:lang(ne),
h3:lang(ne) {
  line-height: 1.4;
}

/* Keep underlines clear of ु and ू */
a:lang(ne) {
  text-underline-offset: 0.3em;
}
```

The `:lang(ne)` selector does the work. Mark your Nepali content with `lang="ne"` (more on that below) and it picks up these styles automatically, even on a page that's mostly English.

Two smaller things. Default link underlines cut straight through ु and ू, which is what the last rule is for. And Devanagari has no capital letters, so if your English design uses uppercase labels for hierarchy, the Nepali version loses it. Build hierarchy from size and weight instead.

## Don't letter-space Devanagari

Tracking is a habit designers bring over from English, especially on buttons, navigation and small labels. On Devanagari it breaks the shirorekha into separate pieces, so words stop reading as words and start looking like a row of loose letters. Leave `letter-spacing` at `normal` for Nepali text, including the places your English style guide says to track.

## Don't fake bold or italic

If your CSS asks for bold and you've only loaded the regular weight, the browser invents a bold by thickening the outlines. On Devanagari that fills in small counters and smudges conjuncts. Load the weights you actually use, usually two (a regular and a semibold or bold), and nothing else.

Italic is worse. Mukta, Hind and Noto Sans Devanagari have no italic on Google Fonts, so an `<em>` tag makes the browser slant upright letters, and it looks broken rather than emphasised. Use weight or colour for emphasis in Nepali. Tiro Devanagari Hindi is the exception, with a real italic. The `font-synthesis: none` line above stops the browser faking either.

## Keep Nepali fonts light on mobile data

Most people will read your Nepali site on a phone, and not always on a good connection. Nepal Telecommunications Authority figures [reported by the Kathmandu Post](https://kathmandupost.com/science-technology/2026/04/14/4g-keeps-growing-fast-in-nepal-while-users-still-face-slow-speeds-and-patchy-coverage) show 4G makes up 86.24% of broadband subscriptions, but users still face slow speeds and patchy coverage outside the cities. Devanagari fonts carry far more glyphs than Latin ones because of all the conjuncts, so every weight you add costs more.

- **Load two weights, not seven.** Each weight is a separate download.
- **Use `font-display: swap`** by adding `&display=swap` to the Google Fonts URL. Text appears straight away in the device's own Devanagari system font and switches when the web font arrives. Android, iOS and Windows all ship one, so the fallback is readable.
- **Let subsetting do its job.** Google Fonts splits each family into script subsets with `unicode-range`, so the browser only downloads the Devanagari file when the page actually contains Devanagari. If you self-host, keep that split rather than bundling everything into one file.
- **For a display font used only in a logo or one heading,** the `text=` parameter serves just the characters you list, which [Google says](https://developers.google.com/fonts/docs/css2) can cut the file by up to 90%.

Font loading is one of the first things worth checking on any [web design project](/services/web-design) with Nepali content. It takes minutes at the start and hours once the site is live.

## Tell the browser which language it's reading

Put `lang="ne"` on the `<html>` tag of Nepali pages and `lang="en"` on English ones. On a bilingual page, mark the Nepali parts individually: `<p lang="ne">` for a paragraph, `<span lang="ne">` for a phrase inside an English sentence. It tells screen readers to switch to a Nepali voice where one is installed, helps the browser apply the right text rules, and makes the `:lang(ne)` CSS above work.

What it doesn't do is help Google work out the language. Google [says it uses the visible content](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites) of a page for that and ignores `lang` attributes, which is one more reason text typed in Preeti is invisible to Nepali searches.

If you run separate Nepali and English pages, connect them with `hreflang` so Google knows they're versions of the same page. Each version lists every version, including itself:

```html
<link rel="alternate" hreflang="ne" href="https://example.com.np/ne/about/">
<link rel="alternate" hreflang="en" href="https://example.com.np/en/about/">
```

## Designing the language switcher

A bilingual website lives or dies on a switcher people can find.

- **Label each language in its own script:** नेपाली and English. Not "Nepali" and "अंग्रेजी". The person hunting for the switch is exactly the person who can't read the current page.
- **Skip flags.** English isn't one country, and Nepali is spoken well beyond Nepal.
- **Keep it in the same place on every page,** usually the header, and have it open the same page in the other language, not the home page.
- **Don't redirect automatically** based on location or browser language. A Nepali reader abroad on an English-language phone may still want the Nepali page, and Google [advises against these redirects](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites) too.
- **Remember the choice** so people don't have to switch again on every page.

The two versions will rarely be the same length. Design buttons, cards and menus to grow with their text instead of fixing widths around the English copy, and review the Nepali version of every screen, not just the home page.

## Numbers and dates

Nepali has its own digits, ० १ २ ३ ४ ५ ६ ७ ८ ९, and people in Nepal use both those and 0 to 9 every day. Either is fine. Mixing them on one screen isn't: a menu with रु ४५० on one item and Rs 450 on the next looks careless. A rule that works well is Devanagari digits in Nepali running text, and 0 to 9 for anything people copy or type, like phone numbers and order IDs. Whatever you choose, make forms accept both. Someone typing ९८४१ into a phone field shouldn't get an error.

Dates need more care. Bikram Sambat is Nepal's official calendar and the one most people use for rent, school fees and government offices, while flights, foreign clients and most software run on AD. Where a date has consequences, such as an event, a deadline, a booking or an office notice, show both: १५ असोज २०८३ (1 October 2026). And don't convert with arithmetic. BS month lengths change from year to year, so conversion needs a tested library or lookup table.

## Frequently asked questions

### What is the best Nepali font for a website?

There isn't one best font, but for most sites a Unicode sans serif like Mukta, Hind or Noto Sans Devanagari is the safe choice. They're free on Google Fonts and stay readable at small sizes on a phone. Pick a serif like Tiro Devanagari Hindi when you want a more editorial voice for headings.

### Can I still use Preeti on my website?

You can make it display, but you shouldn't. Preeti stores Latin letters, so your Nepali text can't be searched, copied into other apps or read properly by screen readers. Convert it to Unicode and use a Unicode Devanagari web font.

### What font size should Nepali text be on a website?

Start about one step larger than your English body text, roughly 18px against 16px, with a line-height around 1.7 to 1.8. Treat those as starting points and adjust for the font you chose after testing real paragraphs on a phone.

### Do I need separate pages for Nepali and English?

Not always. A small site can mix both on one page, as long as each Nepali passage is marked with `lang="ne"`. If you want each language to show up for its own searches, separate pages linked with `hreflang` are the cleaner setup.

### Are Google's Devanagari fonts free for commercial use?

The four families here are released under the SIL Open Font License, which allows commercial use, self-hosting and embedding in apps. The main thing it doesn't allow is selling the fonts on their own.

If you're planning a Nepali or bilingual site and want the type sorted before it turns into a problem, [send over what you're building](/contact) and we'll look at it properly.
