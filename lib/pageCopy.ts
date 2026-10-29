/**
 * Fixed copy that a page prints in the browser and lib/renderHtml.ts prints
 * in the HTML a crawler reads first.
 *
 * It used to live inline in the page components, so the server-rendered
 * /services and /vibe carried none of it and the audit of 2026-10-29 counted
 * them as near-empty shells. One copy here means the two cannot drift.
 */

export interface Engagement {
  name: string;
  meta: string;
  desc: string;
  points: string[];
  featured?: boolean;
}

/** "Three ways to engage" on /services. */
export const ENGAGEMENTS: Engagement[] = [
  {
    name: 'Sprint',
    meta: '2–3 weeks',
    desc: 'A focused burst on one surface — a landing page, an onboarding flow, a brand refresh.',
    points: ['Single deliverable', 'Async updates', 'Fixed scope'],
  },
  {
    name: 'Partner',
    meta: 'Monthly retainer',
    desc: 'Embedded design capacity. I work as your design team across whatever ships next.',
    points: ['Priority access', 'Weekly calls', 'Rolling backlog'],
    featured: true,
  },
  {
    name: 'Advisory',
    meta: 'Hourly',
    desc: 'Critique, design direction, and systems review for teams that already have designers.',
    points: ['Design reviews', 'Systems audit', 'Team coaching'],
  },
];

/** The closing pitch on /vibe. */
export const VIBE_PROMISE =
  "I don't just deliver files; I deliver impact. The goal is to make your product the most desirable asset in its niche by leveraging deep psychology and cutting-edge visual craft.";

export const VIBE_PRINCIPLES: Array<{ k: string; v: string }> = [
  { k: 'Senior only', v: 'You work directly with me — no handoffs to juniors.' },
  { k: 'Systems first', v: 'Everything ships as reusable components, not one-offs.' },
  { k: 'Fast loops', v: 'Reviewable work in your hands within days, not weeks.' },
  { k: 'Built to ship', v: 'Designs that respect real engineering constraints.' },
];
