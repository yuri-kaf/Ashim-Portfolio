import { PortfolioData } from '../types.js';

/**
 * The privacy notice, read by pages/PrivacyPage.tsx in the browser and by
 * lib/renderHtml.ts for the HTML crawlers get.
 *
 * Every statement here was checked against the code on 2026-10-29: the public
 * site has no forms, no analytics, no ad pixels and sets no cookies; the only
 * cookie is the dashboard sign-in (api/_lib/session.ts), which only the owner
 * ever receives. If any of that changes, say so here in the same commit.
 */

export const PRIVACY_UPDATED = '29 October 2026';

export interface PrivacySection {
  heading: string;
  paragraphs: string[];
}

export const privacySections = (data: PortfolioData): PrivacySection[] => {
  const email = data.contact?.email?.trim();
  const reach = email ? `email me at ${email}` : 'get in touch through the contact page';
  return [
    {
      heading: 'The short version',
      paragraphs: [
        `This is the personal website of ${data.name}. It has no contact forms, no analytics, no advertising trackers and no visitor cookies. I do not sell or share anything about you, because I do not collect anything about you beyond what any web server sees.`,
      ],
    },
    {
      heading: 'What the hosting sees',
      paragraphs: [
        'The site is hosted on Vercel. Like any web host, its servers process your IP address, your browser’s user agent and the page you asked for, to deliver the page, keep the site secure and stop abuse. Vercel keeps these request logs for a short time under its own privacy policy. I do not use them to identify visitors.',
      ],
    },
    {
      heading: 'Things your browser fetches from other services',
      paragraphs: [
        'The fonts load from Google Fonts, and some images load from Unsplash and Google’s image servers. When your browser fetches them, those services receive your IP address and browser details, as they would for any website that uses them. No account or cookie of yours is involved.',
      ],
    },
    {
      heading: 'When you contact me',
      paragraphs: [
        'If you email, call or message me on WhatsApp or Viber, I receive what you send: your name, your number or address, and your message. I use it only to reply and to do the work we agree on, keep it for as long as the conversation or project needs it, and never add you to a mailing list without asking.',
      ],
    },
    {
      heading: 'Links to other sites',
      paragraphs: [
        'Pages here link to other sites, including Limi Creatives, LinkedIn and the sources cited in posts. Those sites have their own privacy policies; this one stops at the link.',
      ],
    },
    {
      heading: 'Your choices',
      paragraphs: [
        `To ask what I hold about you, or to have it deleted, ${reach}. I will answer within 30 days.`,
      ],
    },
  ];
};
