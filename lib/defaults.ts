import { PortfolioData } from '../types.js';

/**
 * The fallback shape every sanitized document is built against.
 *
 * Scalar and site-level values here are the real ones for the site, because
 * they are genuine defaults rather than placeholders. Collections are empty on
 * purpose: if a stored document is missing its `projects` key entirely, the
 * honest result is no projects, not a resurrection of seed content the owner
 * may have deliberately deleted.
 *
 * Lives apart from `constants.ts` so the sanitizer can depend on it without a
 * cycle — `constants.ts` runs its seed content *through* the sanitizer.
 */
export const DEFAULT_DATA: PortfolioData = {
  name: 'Ashim Kafle',
  role: 'Product Designer & Digital Marketer',
  tagline: 'Design that looks sharp and marketing that makes it sell.',
  heroIntro:
    'A product designer and digital marketer building brands that look considered and campaigns that actually convert.',
  company: {
    name: 'Limi Creatives',
    role: 'Co-founder & CMO',
    description: 'A creative agency delivering design, branding, and full-service marketing.',
    url: '',
  },
  availability: 'available',
  contact: {
    email: 'ashimkaflebiz@gmail.com',
    phone: '+977 9805 812 718',
    location: 'Kathmandu, Nepal',
  },
  stats: [
    { id: 'stat-projects', value: '50', suffix: '+', label: 'Projects' },
    { id: 'stat-years', value: '6', suffix: 'y', label: 'Practising' },
  ],
  ticker: [
    'Product Design',
    'Performance Marketing',
    'Brand Identity',
    'SEO & Content',
    'Design Systems',
    'Paid Social',
    'Motion',
    'Go-to-market',
  ],
  disciplines: [
    {
      id: 'discipline-design',
      key: 'Design',
      blurb: 'Making the product and the brand look like they deserve the price.',
      items: ['Product & UI/UX', 'Brand Identity', 'Design Systems', 'Motion & Animation'],
    },
    {
      id: 'discipline-marketing',
      key: 'Marketing',
      blurb: 'Making sure the right people actually see it, and then buy.',
      items: ['Performance / Paid', 'SEO & Content', 'Social Strategy', 'Analytics & CRO'],
    },
  ],
  pageIntros: {
    works:
      'Deep dives into challenging design systems for visionary products — from first principles through to shipped interface.',
    services:
      'Design and marketing under one roof, so the thing that looks good is also the thing that sells.',
    gallery: 'Selected frames, studies and offcuts from the work.',
    blog: 'Notes on design, marketing and the space where they overlap.',
    vibe: 'How the work gets made, and what it is trying to be.',
  },
  seo: {
    siteName: 'Ashim Kafle',
    titleSuffix: ' | Ashim Kafle',
    description:
      'Ashim Kafle — product designer and digital marketer. Design that looks sharp and marketing that makes it sell.',
    ogImage: '/ashim-portrait.png',
    twitterHandle: '',
    siteUrl: 'https://www.ashimkafle.com.np',
  },
  projects: [],
  services: [],
  blogs: [],
  process: [],
  tools: [],
  gallery: [],
  social: [],
  vibe: {
    title: 'The Crimson Approach',
    description:
      'I believe design is about how it makes you feel, rooted in clarity and resonance.',
    philosophy: [],
  },
};
