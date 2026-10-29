import React from 'react';
import Seo from '../components/Seo';
import { privacyMeta } from '../lib/pageMeta';
import { PRIVACY_UPDATED, privacySections } from '../lib/privacy';
import { PortfolioData } from '../types';

interface PrivacyPageProps {
  data: PortfolioData;
}

/** Plain on purpose: a notice people read once, linked from every footer. */
const PrivacyPage: React.FC<PrivacyPageProps> = ({ data }) => (
  <div data-nav-theme="light" className="min-h-screen bg-[var(--paper)] px-6 pb-32 pt-40">
    <Seo defaults={data.seo} data={data} {...privacyMeta(data)} />
    <article className="mx-auto max-w-2xl">
      <p className="mono mb-8 text-[var(--grey-1)]">Last updated {PRIVACY_UPDATED}</p>
      <h1 className="mega mb-14 text-5xl md:text-7xl">Privacy</h1>
      {privacySections(data).map((section) => (
        <section key={section.heading} className="mb-12">
          <h2 className="mb-4 text-xl font-medium md:text-2xl">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mb-4 text-base font-light leading-relaxed text-neutral-600">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  </div>
);

export default PrivacyPage;
