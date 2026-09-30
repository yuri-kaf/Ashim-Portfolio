import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { PortfolioData } from '../types';
import { DEFAULT_DATA } from '../lib/defaults.js';
import Seo from '../components/Seo';
import { aboutMeta } from '../lib/pageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import {
  PageShell,
  Reveal,
  SplitText,
  SectionLabel,
  Stagger,
  StaggerItem,
  Magnetic,
} from '../components/Motion';

interface AboutPageProps {
  data: PortfolioData;
}

/**
 * The page this restructure exists for.
 *
 * Its job is to make "Ashim Kafle" and "Limi Creatives founder" resolve here.
 * The founder paragraph below is load-bearing: lib/seoGraph.ts asserts the
 * Person → Organization relationship in schema, and Google discounts a schema
 * claim that has no matching visible text on the page. Every fact on this page
 * comes out of the content document — nothing here is written from memory.
 */
const AboutPage: React.FC<AboutPageProps> = ({ data }) => {
  const name = data?.name || DEFAULT_DATA.name;
  const company = data?.company || DEFAULT_DATA.company;
  const companyUrl = company.url?.trim() || DEFAULT_DATA.company.url || '';
  const disciplines = data?.disciplines ?? [];
  const stats = data?.stats ?? [];
  const city = data?.seo?.geo?.city || DEFAULT_DATA.seo.geo.city;
  const location = data?.contact?.location || DEFAULT_DATA.contact.location;
  const areaServed = data?.seo?.geo?.areaServed ?? [];
  const heroIntro = data?.heroIntro || DEFAULT_DATA.heroIntro;

  const title = `${name} — ${data.role} in ${city}`;

  return (
    <PageShell className="min-h-screen bg-[var(--paper)]">
      <Seo defaults={data.seo} data={data} {...aboutMeta(data)} />

      {/* ---------- Masthead ---------- */}
      <header className="grain relative overflow-hidden bg-white px-6 pb-24 pt-32 md:pt-40">
        <div className="pointer-events-none absolute -left-40 top-20 h-[560px] w-[560px] animate-drift rounded-full bg-[var(--ink)]/[0.04] blur-[130px]" />

        <div className="relative mx-auto max-w-7xl">
          <Breadcrumbs path="/about" title="About" />

          <Reveal>
            <SectionLabel className="mb-8">About</SectionLabel>
          </Reveal>

          <SplitText
            as="h1"
            text={title}
            accent={[city]}
            className="display mb-12 max-w-5xl text-[2.5rem] leading-[1.02] text-neutral-900 md:text-[5.5rem]"
          />

          <Reveal delay={0.3} className="max-w-2xl">
            <p className="text-lg font-light leading-relaxed text-neutral-500 md:text-2xl">
              {data.tagline}
            </p>
          </Reveal>
        </div>
      </header>

      {/* ---------- Portrait + biography ---------- */}
      <section className="border-t border-black/[0.05] px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[440px_1fr] lg:gap-20">
          <Reveal>
            {/* Fixed plate, matching the 4:5 image ratio the cards use. The
                portrait is a cutout on transparency, so it is contained and
                bottom-aligned rather than cropped. */}
            <div className="relative aspect-[4/5] overflow-hidden border-t border-[var(--ink)] bg-neutral-100">
              <picture>
                <source srcSet="/ashim-portrait.webp" type="image/webp" />
                <img
                  src="/ashim-portrait.png"
                  alt={`${name}, ${data.role} based in ${location}`}
                  className="absolute inset-0 h-full w-full object-contain object-bottom grayscale contrast-[1.15]"
                />
              </picture>
            </div>
            <div className="mono mt-4 flex items-center justify-between text-[var(--grey-1)]">
              <span>{name}</span>
              <span className="bracket">{location}</span>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <SectionLabel className="mb-8">The short version</SectionLabel>
            </Reveal>

            <Reveal delay={0.05}>
              <p className="mb-8 text-xl font-light leading-relaxed text-neutral-700 md:text-2xl">
                {heroIntro}
              </p>
            </Reveal>

            {/* The founder paragraph. Visible text, plain link, matching the
                Organization/founder claim in the JSON-LD graph. */}
            <Reveal delay={0.1}>
              <p className="mb-8 text-base font-light leading-[1.85] text-[var(--grey-1)] md:text-lg">
                I am <strong className="font-medium text-neutral-900">{company.role}</strong> of{' '}
                {companyUrl ? (
                  <a
                    href={companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-wipe font-medium text-[var(--ink)]"
                  >
                    {company.name}
                  </a>
                ) : (
                  <strong className="font-medium text-neutral-900">{company.name}</strong>
                )}
                {' — '}
                {company.description.charAt(0).toLowerCase() + company.description.slice(1)} That
                is the same practice as this site, seen from the other side: there as part of the
                agency, here under my own name.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <p className="mb-8 text-base font-light leading-[1.85] text-[var(--grey-1)] md:text-lg">
                I work from {location}. Design and marketing sit under one roof here on purpose — an
                interface that tests well and a campaign that converts are the same problem answered
                twice, and splitting them across two suppliers is how the thing that looks good
                stops being the thing that sells.
              </p>
            </Reveal>

            {/* The served places, listed rather than folded into a sentence —
                a comma list ending in "Nepal" reads badly in prose. */}
            {areaServed.length > 0 && (
              <Reveal delay={0.2}>
                <p className="mono mb-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-[var(--grey-1)]">
                  <span className="bracket">Working in</span>
                  {areaServed.map((place) => (
                    <span key={place}>{place}</span>
                  ))}
                </p>
              </Reveal>
            )}

            {stats.length > 0 && (
              <Stagger className="mb-12 flex flex-wrap gap-10 border-t border-[var(--hairline)] pt-8" stagger={0.1}>
                {stats.map((stat) => (
                  <StaggerItem key={stat.id}>
                    <p className="mb-1 text-3xl font-medium tabular-nums text-neutral-900 md:text-4xl">
                      {stat.value}
                      {stat.suffix}
                    </p>
                    <p className="mono text-[var(--grey-1)]">{stat.label}</p>
                  </StaggerItem>
                ))}
              </Stagger>
            )}

            <Reveal delay={0.2}>
              <Link to="/works" className="mono group inline-flex items-center gap-3">
                <span className="link-wipe">See the work</span>
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Disciplines ---------- */}
      {disciplines.length > 0 && (
        <section className="border-t border-black/[0.05] bg-white px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <SectionLabel className="mb-8">The practice</SectionLabel>
            </Reveal>

            <SplitText
              as="h2"
              text="Design and marketing, one desk."
              accent={['desk.']}
              className="display mb-16 text-4xl text-neutral-900 md:text-6xl"
            />

            <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2" stagger={0.12}>
              {disciplines.map((discipline) => (
                <StaggerItem key={discipline.id}>
                  <div className="grain h-full border border-black/[0.06] bg-[var(--paper)] p-9">
                    <h3 className="mb-4 text-2xl font-medium tracking-tight text-neutral-900">
                      {discipline.key}
                    </h3>
                    <p className="mb-8 text-sm font-light leading-relaxed text-neutral-500">
                      {discipline.blurb}
                    </p>
                    <ul className="space-y-3">
                      {discipline.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500"
                        >
                          <span className="h-1 w-1 rounded-full bg-[var(--ink)]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal delay={0.3} className="mt-12">
              <Link to="/services" className="mono group inline-flex items-center gap-3">
                <span className="link-wipe">What I take on</span>
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------- CTA ---------- */}
      <section className="px-6 py-24">
        <Reveal className="mx-auto max-w-7xl">
          <div
            data-nav-theme="dark"
            className="grain relative overflow-hidden bg-neutral-900 p-12 md:p-20"
          >
            <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] animate-drift rounded-full bg-white/10 blur-[120px]" />

            <div className="relative z-10 flex flex-col items-center justify-between gap-10 md:flex-row">
              <div className="max-w-xl text-center md:text-left">
                <SplitText
                  as="h2"
                  text="Working on something in Nepal?"
                  accent={['Nepal?']}
                  className="display mb-6 text-4xl text-white md:text-5xl"
                />
                <Reveal delay={0.3}>
                  <p className="text-lg font-light text-neutral-400">
                    Tell me what you are building and I will tell you what it needs.
                  </p>
                </Reveal>
              </div>

              <Reveal delay={0.4} direction="left">
                <Magnetic strength={0.3}>
                  <Link
                    to="/contact"
                    className="group inline-flex items-center gap-5 rounded-full bg-white py-4 pl-9 pr-3 shadow-2xl transition-colors duration-500 hover:bg-[var(--ink)]"
                  >
                    <span className="mono text-neutral-900 transition-colors duration-500 group-hover:text-white">
                      Get in touch
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 transition-colors duration-500 group-hover:bg-white">
                      <ArrowUpRight size={16} className="text-neutral-900" />
                    </span>
                  </Link>
                </Magnetic>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </section>
    </PageShell>
  );
};

export default AboutPage;
