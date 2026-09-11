
import { PortfolioData } from './types.js';
import { DIGITAL_MARKETING_LOTTIE } from './assets/lottieData.js';
import { sanitizePortfolioData } from './lib/sanitize.js';

/**
 * Seed content for a fresh install, and the fallback the site renders when the
 * content API is unreachable.
 *
 * Written as a partial and normalised below rather than spelled out field by
 * field: the sanitizer fills in every field each record's type requires, so
 * adding a field to `types.ts` does not mean editing every literal here.
 */
const SEED = {
  name: "Ashim Kafle",
  role: "Product Designer & Digital Marketer",
  tagline: "Design that looks sharp and marketing that makes it sell.",
  availability: 'available',
  company: {
    name: "Limi Creatives",
    role: "Co-founder & CMO",
    description: "A creative agency delivering design, branding, and full-service marketing.",
    url: "https://limicreatives.com"
  },
  vibe: {
    title: "The Crimson Approach",
    description: "I believe design is about how it makes you feel, rooted in clarity and resonance.",
    philosophy: [
      "Simplicity is the ultimate sophistication.",
      "Every pixel must justify its existence.",
      "Design for humans, not for algorithms.",
      "Bold choices create lasting impressions."
    ]
  },
  projects: [
    {
      id: "1",
      title: "Vortex Crypto",
      category: "Fintech",
      description: "Secure digital asset management with high-speed feedback cycles.",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop",
      caseStudy: "Simplifying blockchain data for the average user using high-contrast visuals.",
      year: "2024",
      client: "Vortex Labs"
    },
    {
      id: "2",
      title: "Solstice Fashion",
      category: "E-Commerce",
      description: "Luxury fashion minimalist experience for the modern aesthetic.",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop",
      caseStudy: "Aggressive whitespace and elegant typography to elevate brand presence.",
      year: "2023",
      client: "Solstice Group"
    },
    {
      id: "3",
      title: "Nova Dashboard",
      category: "SaaS",
      description: "Real-time global logistics analytics and deep data visualization.",
      image: "https://images.unsplash.com/photo-1543286386-713bdd548da4?q=80&w=1200&auto=format&fit=crop",
      caseStudy: "A 'layers of detail' strategy zooming from global metrics to individual shipments.",
      year: "2024",
      client: "Nova Logistics"
    },
    {
      id: "4",
      title: "Zenith Banking",
      category: "Fintech",
      description: "Next-gen multi-currency banking built for digital nomads.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop",
      caseStudy: "Focused on frictionless cross-border transactions and UX security.",
      year: "2024",
      client: "Zenith Corp"
    },
    {
      id: "5",
      title: "Aura Skincare",
      category: "Branding",
      description: "Premium identity design communicating purity and scientific rigor.",
      image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?q=80&w=1200&auto=format&fit=crop",
      caseStudy: "Creating a visual language that communicates organic quality.",
      year: "2023",
      client: "Aura Beauty"
    }
  ],
  // Three services get a page here. The other three point at limicreatives.com,
  // which already has a page ranking for each of them — building a second one
  // on this domain would only split the effort.
  services: [
    {
      id: "s1",
      slug: "web-design",
      mode: "page",
      deliverables: ["Interactive Prototypes", "Design Systems", "User Research", "Wireframing"],
      title: "Web Design & UI/UX",
      description: "Websites and product interfaces designed around what the visitor is actually trying to do.",
      image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1200&auto=format&fit=crop",
      icon: "Layers",
      seoTitle: "Web Design & UI/UX in Nepal",
      metaDescription:
        "Website and product interface design from Kathmandu — research, wireframes, a design system and a build-ready Figma file. Get in touch for a quote.",
      body: `## What you get

Wireframes that settle the structure before anyone argues about colour. Interactive prototypes you can click through and hand to a colleague, so the layout gets tested by a person rather than approved on a hunch. A design system — type scale, spacing, colour, buttons, form states — so the tenth screen still looks like it belongs with the first. And user research where there is something real to research: existing analytics, support enquiries, and conversations with the people who already use what you have.

What you end up holding is a Figma file a developer can build from without guessing at spacing, hover states or what happens at 360 pixels wide. Every screen comes with its empty state, its loading state and its error state, because those are the screens users hit on their worst day.

## How it works

**Strategy.** A deep dive into goals, user personas and the competitive landscape. Who is the site for, what do you want them to do, and what are the businesses you are being compared against already doing? This is also where we agree what counts as success — enquiries, bookings, signups, demo requests — so the design has something to aim at.

**Wireframe.** Architecting the core user flow and low-fidelity skeletons. Grey boxes and real words, no styling. It is much cheaper to discover that the pricing page needs a comparison table now than after the visuals are signed off, and grey boxes keep the conversation on structure instead of shades of red.

**Visuals.** High-fidelity screens, built on a system rather than drawn one at a time. Typography, spacing and imagery get set here, along with the responsive behaviour, so nobody discovers on launch day that the hero was only ever designed for a laptop.

**Deploy.** The transition from design files to a live product. Developer handoff, spec notes, asset export, and review of the build against the designs before it goes public. If you do not have a developer, I can build it.

## Who this is for

Nepali businesses whose website is doing less than it should. SaaS and software teams in Kathmandu who have an engineering-led product and a marketing site that looks like an afterthought. Hotels, lodges and trekking operators competing for direct bookings against the aggregators. Retail and D2C brands whose Instagram converts better than their store. NGOs and development organisations that need donors and partners to understand their work in one scroll rather than in a PDF.

It is also for teams who already have a site and need it reorganised rather than replaced — a clearer structure, honest page copy and a service page per thing you actually sell.

## What it costs

There is no one number, because a five-page brochure site and a twenty-screen product dashboard are not the same job. What moves the range: how many unique screens or templates are needed, whether a brand and content already exist or have to be created, how many rounds of revision you want built into the schedule, and whether you need design only or design and build. Ongoing work — new landing pages, seasonal campaigns — is quoted separately from the initial project.

Send over the scope and I will quote it properly rather than guess in public. [Tell me what you are building](/contact).`,
      faqs: [
        {
          id: "web-faq-1",
          question: "How long does a website take?",
          answer:
            "It depends almost entirely on scope and how quickly feedback comes back. A small brochure site moves faster than a product interface with a dozen unique screens. The biggest delay on most projects is not design time — it is waiting on content, photos and approvals, so I set those deadlines with you at the strategy stage."
        },
        {
          id: "web-faq-2",
          question: "Do you work with businesses outside Kathmandu?",
          answer:
            "Yes. I am based in Kathmandu, and plenty of the work happens over calls and shared files regardless of where the client sits. For businesses elsewhere in Nepal or abroad, the process is the same — the only difference is that reviews happen on a call instead of across a table."
        },
        {
          id: "web-faq-3",
          question: "Do you build the site, or just design it?",
          answer:
            "Either. Some clients have a developer or an agency and only need the design files and a clear handoff. Others want the whole thing delivered live. Say which you need up front, because it changes both the scope and the quote."
        },
        {
          id: "web-faq-4",
          question: "Will the site be good for SEO?",
          answer:
            "The design side of it, yes — a clear page structure, one page per thing you sell, proper headings, fast-loading images and a layout that works on a phone. Ongoing search and content work is handled by Limi Creatives rather than here."
        }
      ]
    },
    {
      id: "s2",
      slug: "branding",
      mode: "page",
      deliverables: ["Logo Systems", "Brand Guidelines", "Visual Language", "Typography"],
      title: "Branding",
      description: "Visual identity systems — logo, type, colour and the rules that keep them consistent.",
      image: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1200&auto=format&fit=crop",
      icon: "Zap",
      seoTitle: "Branding & Logo Design in Nepal",
      metaDescription:
        "Logo systems, brand guidelines, typography and visual language for businesses in Kathmandu and across Nepal. Get in touch for a quote on your identity.",
      body: `## What you get

A logo system rather than a single logo — primary, secondary and a mark small enough to survive as a favicon or a profile picture. A typographic and colour palette with the reasoning written down, so the next person who touches the brand knows why those choices were made. A visual language: how photography is treated, how graphics and patterns behave, what the brand looks like when it is not a logo on a white background.

And brand guidelines a non-designer can actually follow. Clear spacing rules, minimum sizes, what to do and what not to do, and files in every format the printer, the developer and the person running your Instagram will ask for. A brand nobody can apply without you in the room is a brand that decays within a year.

## How it works

**Strategy.** A deep dive into goals, audience and the competitive landscape. What does the business do, who is it for, and what does everyone else in the category already look like? In a market as tightly clustered as Nepal's — where whole categories share the same blues and the same stock photography — knowing what to avoid is half the value.

**Wireframe.** For identity work this is the structural pass: naming and territory, a moodboard, and two or three distinct directions sketched roughly rather than one polished option presented as a fait accompli. The point is to choose a direction while changing it is still cheap.

**Visuals.** The chosen direction is built out properly — the logo drawn and optically corrected at every size, colour and type finalised, and the system applied to the things you will genuinely use. Signage, packaging, a deck, a shopfront, a delivery bag, an ad frame, a website header.

**Deploy.** Final files, the guidelines document, and a walkthrough so your team can use it without asking permission. If a website or motion work follows, the identity carries straight into it.

## Who this is for

Businesses in Kathmandu and across Nepal that have outgrown a logo somebody's cousin made in a hurry. Hospitality — cafés, hotels, lodges — where the identity is doing a lot of the selling before anybody reads a word. Retail and D2C brands that need to look credible on a shelf and in a feed at the same time. SaaS and tech teams whose product is sharper than their brand. NGOs and development organisations that need to look trustworthy to donors and legible to the communities they work with.

It suits new businesses about to launch, and established ones that have changed what they do without changing how they look.

## What it costs

The range depends on how much of the system you need. A single business with one mark, a colour palette, type and a short guideline document sits at one end; a group with sub-brands, packaging across a product line, signage and a full applications set sits at the other. Number of initial directions explored and rounds of revision affect it too, as does whether you need print-ready artwork and production supervision or just the digital files.

I would rather quote your actual scope than publish a number that fits nobody. [Tell me about the business](/contact).`,
      faqs: [
        {
          id: "brand-faq-1",
          question: "How many logo options do I get?",
          answer:
            "A small number of genuinely different directions, not a page of variations on the same idea. We pick one together and then refine it properly — that produces a better mark than choosing between twenty half-finished ones. The exact number of directions and revision rounds is agreed in the quote."
        },
        {
          id: "brand-faq-2",
          question: "Do I own the logo and the files?",
          answer:
            "Handover includes the editable source files along with exports in the formats printers and developers ask for, so you are never tied to me to use your own identity. Ownership and transfer terms are written into the agreement before work starts, so there is nothing to argue about at the end."
        },
        {
          id: "brand-faq-3",
          question: "Can you refresh our existing brand instead of starting over?",
          answer:
            "Often that is the right call. If the mark has recognition in the market, redrawing it cleanly and rebuilding the system around it keeps that equity while fixing what is broken. We look at what you have first and decide honestly whether it is worth keeping."
        },
        {
          id: "brand-faq-4",
          question: "Do you handle printing and signage production?",
          answer:
            "I prepare print-ready artwork and can work with your printer or fabricator on specification and proofing. The production itself is done by vendors, and their cost is separate from the design fee."
        }
      ]
    },
    {
      id: "s6",
      slug: "motion-animation",
      mode: "page",
      deliverables: ["2D/3D Sculpting", "Character Rigging", "Motion Graphics", "Storyboarding"],
      title: "Motion & Animation",
      description: "Characters and motion work that give a brand a personality people remember.",
      image: "https://images.unsplash.com/photo-1635322966219-b75ed372eb01?q=80&w=1200&auto=format&fit=crop",
      icon: "Sparkles",
      seoTitle: "Motion Graphics & Animation in Nepal",
      metaDescription:
        "2D and 3D motion graphics, character animation, explainers and ad creative for brands in Kathmandu and across Nepal. Get in touch for a quote.",
      body: `## What you get

Storyboards first, so the idea is agreed before anyone spends a week rendering the wrong one. Motion graphics — logo builds, lower thirds, UI animation, explainer sequences, social and ad cuts sized for the placement they are actually running in. 2D and 3D sculpting where a scene or a product needs to exist in three dimensions rather than be faked. Character rigging, so a mascot can be reused across a campaign instead of being redrawn from scratch every time.

Delivery is in the formats and aspect ratios you need — vertical for Reels and TikTok, square for feed, wide for YouTube and presentations, and lightweight web formats such as Lottie where the animation belongs inside a product interface rather than in a video player.

## How it works

**Strategy.** A deep dive into goals, audience and the competitive landscape. What is this piece for — explaining a product, opening a video, carrying an ad, giving an interface some life? Where will it be watched, and will the sound be on? Motion made for a cinema screen and motion made for a muted phone feed are different pieces of work.

**Wireframe.** Storyboard and animatic. The beats, the timing and the script are set here in rough form, and revisions at this stage cost hours rather than days. Nothing gets modelled, rigged or rendered until the sequence makes sense on paper.

**Visuals.** Design frames, then animation. Style frames establish the look, then the sequence is built out — modelling and rigging where the work calls for it, then animation, sound and colour. This is where an existing brand identity gets translated into movement rather than decorated with it.

**Deploy.** Final renders in every ratio and format required, plus source files and any loop or transition variants. If the work runs as paid creative, it is cut into the versions the ad platforms want.

## Who this is for

Nepali brands that need to compete in a feed, where a still image is scrolled past and motion is not. Product and SaaS teams who need an explainer that makes a complicated tool understandable before the viewer scrolls away. Hospitality and travel businesses with strong footage and no idea how to cut it. Retail and D2C brands running ad creative that has to stop a thumb. NGOs presenting data and programme outcomes to donors in something more watchable than a slide deck.

It also suits businesses that have just finished a rebrand and want the identity to move — a logo build, animated social templates, and a motion language their in-house team can reuse.

## What it costs

The range is driven by length, complexity and technique. Seconds of finished animation is the blunt measure, but a simple 2D graphic sequence and a 3D character shot of the same length are nowhere near the same amount of work. Rigging, custom illustration, licensed or original music, voiceover, and the number of aspect-ratio versions all add to it. Revision rounds are agreed in advance, because motion revisions after render are the expensive kind.

Tell me the length, the format and where it will run, and I will quote it. [Start there](/contact).`,
      faqs: [
        {
          id: "motion-faq-1",
          question: "How long does an animation take to produce?",
          answer:
            "Longer than most people expect, because storyboarding and approvals take up as much of the schedule as the animation itself. The honest answer depends on length and technique — a short logo build and a full 3D explainer are different projects. I give a timeline with the quote once I know the scope."
        },
        {
          id: "motion-faq-2",
          question: "Can you animate our existing logo and brand?",
          answer:
            "Yes, and that is a common starting point. If you have brand guidelines and source artwork, the motion is built from those so it matches the rest of your identity. If the artwork is not in a usable format, it may need redrawing first."
        },
        {
          id: "motion-faq-3",
          question: "Do you provide voiceover, music and Nepali-language versions?",
          answer:
            "Voiceover and music typically come from external artists or licensed libraries, and those costs are quoted separately from the animation itself. Nepali, English or dual-language versions are straightforward to produce if you plan for them before the animation is locked, since subtitle and lip-timing changes are much harder afterwards."
        },
        {
          id: "motion-faq-4",
          question: "What formats will I receive?",
          answer:
            "Whatever the placement needs — vertical, square and wide video exports, plus web formats such as Lottie for animations that live inside a website or app. Say up front where the piece will run so the right ratios are built into the project instead of cropped in afterwards."
        }
      ]
    },
    {
      id: "s5",
      mode: "pointer",
      externalUrl: "https://limicreatives.com/services/seo",
      deliverables: ["Keyword Research", "Technical SEO", "Content Strategy", "Link Acquisition"],
      title: "SEO",
      description: "Search work that compounds into traffic you don't have to keep paying for. Run through Limi Creatives.",
      image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1200&auto=format&fit=crop",
      icon: "Search"
    },
    {
      id: "s3",
      mode: "pointer",
      externalUrl: "https://limicreatives.com/services/content-creation",
      deliverables: ["Go-to-market Strategy", "Campaign Planning", "Social Strategy", "Analytics & Reporting"],
      title: "Content Creation",
      description: "Content and social programmes, planned and produced by the team at Limi Creatives.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop",
      icon: "Globe",
      lottieData: DIGITAL_MARKETING_LOTTIE
    },
    {
      id: "s4",
      mode: "pointer",
      externalUrl: "https://limicreatives.com/services/paid-advertising",
      deliverables: ["Meta & Google Ads", "Creative Testing", "Funnel Optimisation", "Attribution"],
      title: "Meta & Google Ads",
      description: "Paid acquisition across Meta and Google, run through Limi Creatives.",
      image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?q=80&w=1200&auto=format&fit=crop",
      icon: "TrendingUp"
    }
  ],
  process: [
    { id: "p1", title: "Strategy", description: "Deep dive into goals, user personas, and competitive landscape.", iconName: "Target" },
    { id: "p2", title: "Wireframe", description: "Architecting the core user flow and low-fidelity skeletons.", iconName: "Shield" },
    { id: "p3", title: "Visuals", description: "Applying the crimson vibe and high-fidelity aesthetics.", iconName: "Palette" },
    { id: "p4", title: "Deploy", description: "Seamless transition from design files to a live product.", iconName: "Rocket" }
  ],
  tools: [
    { id: "t1", name: "Figma", iconName: "figma" },
    { id: "t2", name: "Framer", iconName: "framer" },
    { id: "t3", name: "Blender", iconName: "box" },
    { id: "t4", name: "Notion", iconName: "book" },
    { id: "t5", name: "React", iconName: "code" },
    { id: "t6", name: "Webflow", iconName: "globe" }
  ],
  // PLACEHOLDERS — swap the `image` values for real photos of you working.
  // Drop files into /public and reference them as "/my-photo.jpg", or paste any URL.
  gallery: [
    { id: "g1", image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1400&auto=format&fit=crop", caption: "Studio session", size: "lg" },
    { id: "g2", image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1000&auto=format&fit=crop", caption: "Client workshop", size: "sm" },
    { id: "g3", image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000&auto=format&fit=crop", caption: "Late-night wireframes", size: "md" },
    { id: "g4", image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1000&auto=format&fit=crop", caption: "The desk", size: "sm" },
    { id: "g5", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1400&auto=format&fit=crop", caption: "Sketching the system", size: "md" },
    { id: "g6", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop", caption: "Reviewing the numbers", size: "sm" },
    { id: "g7", image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1400&auto=format&fit=crop", caption: "Pinning up the work", size: "lg" },
    { id: "g8", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1400&auto=format&fit=crop", caption: "Team sync", size: "md" }
  ],
  blogs: [
    {
      id: "b1",
      title: "The Future of Minimalist Design",
      excerpt: "Why less is becoming even more in the age of content overload.",
      content: "As we move into 2025, the noise level in digital interfaces is reaching a breaking point...",
      date: "Oct 12, 2024",
      readTime: "5 min",
      categoryId: "design",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: "b2",
      title: "Why Red is the Color of 2025",
      excerpt: "Exploring the impact of bold crimson in modern interfaces.",
      content: "Red has always been a color of passion, urgency, and power...",
      date: "Nov 05, 2024",
      readTime: "4 min",
      categoryId: "branding",
      image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=800&auto=format&fit=crop"
    }
  ],
  // Topic cluster heads. Each one is an indexable page at /blog/category/<slug>
  // that collects the posts pointing at it.
  blogCategories: [
    {
      id: "design",
      slug: "design",
      title: "Design",
      description: "Notes on interface design, design systems and the decisions behind how a thing looks.",
      seoTitle: "Design Notes",
      metaDescription:
        "Writing on interface design, design systems and visual decisions, from a product designer based in Kathmandu, Nepal."
    },
    {
      id: "branding",
      slug: "branding",
      title: "Branding",
      description: "On identity, naming, and what makes a brand hold together past the logo.",
      seoTitle: "Branding Notes",
      metaDescription:
        "Writing on brand identity, logo systems and visual language, from a designer working with businesses in Nepal."
    },
    {
      id: "marketing",
      slug: "marketing",
      title: "Marketing",
      description: "Getting the right people in front of the work, and what happens after they arrive.",
      seoTitle: "Marketing Notes",
      metaDescription:
        "Writing on digital marketing, campaigns and conversion, from a product designer and digital marketer in Kathmandu."
    },
    {
      id: "nepal-market",
      slug: "nepal-market",
      title: "The Nepal Market",
      description: "How design and marketing actually behave in Kathmandu and the wider Nepali market.",
      seoTitle: "The Nepal Market",
      metaDescription:
        "Notes on design and digital marketing in Nepal — what works for businesses in Kathmandu and beyond, and what does not."
    }
  ],
  social: [
    {
      id: 'linkedin',
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/ashim-kafle-676a312a5/',
    },
    { id: 'dribbble', label: 'Dribbble', url: '' },
    { id: 'instagram', label: 'Instagram', url: '' },
  ],
};

export const INITIAL_DATA: PortfolioData = sanitizePortfolioData(SEED);
