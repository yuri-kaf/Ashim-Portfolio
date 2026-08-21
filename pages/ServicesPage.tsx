import React, { useState } from 'react';
import { DEFAULT_DATA } from '../lib/defaults.js';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Plus, Check } from 'lucide-react';
import SafeLottie from '../components/SafeLottie';
import { PortfolioData, Service } from '../types';
import {
  PageShell,
  Reveal,
  SplitText,
  SectionLabel,
  Stagger,
  StaggerItem,
  Magnetic,
  Marquee,
  EASE,
} from '../components/Motion';

interface ServicesPageProps {
  data: PortfolioData;
}

/** Rendered inside the sticky panel — a Lottie loop when present, else the still. */
const ServiceVisual: React.FC<{ service: Service }> = ({ service }) => {
  const still = (
    <img
      src={service.image}
      alt={service.title}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  );

  if (service.lottieData) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-50 p-12">
        <SafeLottie
          animationData={service.lottieData}
          className="h-full w-full"
          fallback={still}
        />
      </div>
    );
  }

  return still;
};

const ServicesPage: React.FC<ServicesPageProps> = ({ data }) => {
  const services = (data?.services || []).filter(Boolean);
  const email = data?.contact?.email || DEFAULT_DATA.contact.email;
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  const activeService = services[active];

  return (
    <PageShell className="min-h-screen bg-[var(--paper)]">
      {/* ---------- Masthead ---------- */}
      <header className="grain relative overflow-hidden bg-white px-6 pb-28 pt-40">
        <div className="pointer-events-none absolute -left-40 top-20 h-[560px] w-[560px] animate-drift rounded-full bg-[var(--ink)]/[0.04] blur-[130px]" />

        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <SectionLabel className="mb-8">Service Suite</SectionLabel>
          </Reveal>

          <SplitText
            as="h1"
            text="Crafting the unforgettable."
            accent={['unforgettable.']}
            className="display mb-14 max-w-5xl text-[3.25rem] text-neutral-900 md:text-[7.5rem]"
          />

          <Reveal delay={0.3} className="max-w-2xl">
            <p className="text-lg font-light leading-relaxed text-neutral-500 md:text-2xl">
              I bridge the gap between complex technology and human emotion through strategic design
              and marketing.
            </p>
          </Reveal>
        </div>
      </header>

      {/* ---------- Scrolling capability marquee ---------- */}
      <div className="marquee-mask border-y border-black/[0.05] bg-[var(--paper)] py-6">
        <Marquee speed={38}>
          {['Product Design', 'Brand Identity', 'Design Systems', 'Motion', 'Growth Marketing', 'Webflow Build'].map(
            (item) => (
              <span key={item} className="flex items-center whitespace-nowrap px-8">
                <span className="text-2xl font-normal tracking-tight text-neutral-300 md:text-4xl">
                  {item}
                </span>
                <span className="ml-8 h-1.5 w-1.5 rounded-full bg-[var(--ink)]/60" />
              </span>
            ),
          )}
        </Marquee>
      </div>

      {/* ---------- Accordion + sticky preview ---------- */}
      <section className="px-6 py-28">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1fr_460px] lg:gap-24">
          {/* Accordion */}
          <div>
            {services.map((service, idx) => {
              const isOpen = active === idx;
              const deliverables = service.deliverables ?? [];

              return (
                <Reveal
                  key={service.id}
                  delay={idx * 0.08}
                  className="border-b border-black/[0.07] first:border-t"
                >
                  <button
                    onClick={() => setActive(isOpen ? -1 : idx)}
                    onMouseEnter={() => !reduced && setActive(idx)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center gap-6 py-8 text-left"
                  >
                    <span
                      className={`text-[11px] font-bold tabular-nums transition-colors duration-500 ${
                        isOpen ? 'text-[var(--grey-1)]' : 'text-neutral-300'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    <h3
                      className={`flex-1 text-3xl font-medium tracking-tight transition-colors duration-500 md:text-5xl ${
                        isOpen ? 'text-[var(--grey-1)]' : 'text-neutral-900 group-hover:text-neutral-500'
                      }`}
                    >
                      {service.title}
                    </h3>

                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-500 ${
                        isOpen
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                          : 'border-black/10 text-neutral-400'
                      }`}
                    >
                      <Plus size={16} />
                    </motion.span>
                  </button>

                  {/* Rendered directly rather than through AnimatePresence: in
                      testing, AnimatePresence's exit-completion signal proved
                      unreliable in this environment, which left the panel
                      stuck open and unable to collapse or switch services.
                      Entrance still animates on open. */}
                  {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        transition={{ duration: 0.55, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <div className="pb-10 pl-0 md:pl-[3.25rem]">
                          {/* Mobile-only visual — the sticky panel is hidden below lg */}
                          <div className="mb-8 aspect-[16/10] overflow-hidden bg-neutral-100 lg:hidden">
                            <ServiceVisual service={service} />
                          </div>

                          <p className="mb-8 max-w-xl text-base font-light leading-relaxed text-neutral-500 md:text-lg">
                            {service.description}
                          </p>

                          <Stagger className="mb-10 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2" stagger={0.06}>
                            {deliverables.map((item) => (
                              <StaggerItem
                                key={item}
                                className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500"
                              >
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ink)]/10">
                                  <Check size={10} className="text-[var(--grey-1)]" />
                                </span>
                                {item}
                              </StaggerItem>
                            ))}
                          </Stagger>

                          <a
                            href={`mailto:${email}?subject=${encodeURIComponent(
                              `Enquiry — ${service.title}`,
                            )}`}
                            className="group/cta inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--grey-1)]"
                          >
                            <span className="link-wipe">Enquire about this service</span>
                            <ArrowRight
                              size={14}
                              className="transition-transform duration-300 group-hover/cta:translate-x-1"
                            />
                          </a>
                        </div>
                      </motion.div>
                  )}
                </Reveal>
              );
            })}

            {services.length === 0 && (
              <div className="surface-inset py-20 text-center text-neutral-400">
                No services defined yet.
              </div>
            )}
          </div>

          {/* Sticky preview */}
          <div className="hidden lg:block">
            <div className="sticky top-32">
              <div className="border-t border-[var(--ink)]">
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                  {/* Direct render, not AnimatePresence mode="wait" — see the
                      note on the accordion above for why. The key still
                      forces a remount (and its entrance transition) on
                      every service switch, it just isn't crossfaded with the
                      outgoing image. */}
                  {activeService ? (
                    <motion.div
                      key={activeService.id}
                      initial={{ opacity: 0, scale: 1.06 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, ease: EASE }}
                      className="absolute inset-0"
                    >
                      <ServiceVisual service={activeService} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center bg-neutral-50"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-300">
                        Select a service
                      </p>
                    </motion.div>
                  )}
                </div>

                <div className="px-6 pb-6 pt-5">
                  <motion.div
                    key={activeService?.id ?? 'none'}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                  >
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--grey-1)]">
                      {activeService ? `Service 0${active + 1}` : 'Overview'}
                    </p>
                    <h4 className="text-xl font-medium tracking-tight text-neutral-900">
                      {activeService?.title ?? 'Full service suite'}
                    </h4>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Engagement models ---------- */}
      <section className="border-t border-black/[0.05] bg-white px-6 py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionLabel className="mb-8">How we work</SectionLabel>
          </Reveal>
          <SplitText
            as="h2"
            text="Three ways to engage."
            accent={['engage.']}
            className="display mb-16 text-4xl text-neutral-900 md:text-6xl"
          />

          <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-3" stagger={0.12}>
            {[
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
            ].map((tier) => (
              <StaggerItem key={tier.name}>
                <motion.div
                  whileHover={reduced ? undefined : { y: -8 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className={`grain relative flex h-full flex-col overflow-hidden rounded-none p-9 ${
                    tier.featured
                      ? 'bg-neutral-900 text-white'
                      : 'border border-black/[0.06] bg-[var(--paper)]'
                  }`}
                >
                  {tier.featured && (
                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 animate-drift rounded-full bg-white/10 blur-[80px]" />
                  )}

                  <div className="relative z-10 flex flex-1 flex-col">
                    <div className="mb-8 flex items-baseline justify-between">
                      <h3
                        className={`text-2xl font-medium tracking-tight ${
                          tier.featured ? 'text-white' : 'text-neutral-900'
                        }`}
                      >
                        {tier.name}
                      </h3>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-[0.2em] ${
                          tier.featured ? 'text-white/70' : 'text-[var(--grey-1)]'
                        }`}
                      >
                        {tier.meta}
                      </span>
                    </div>

                    <p
                      className={`mb-8 flex-1 text-sm font-light leading-relaxed ${
                        tier.featured ? 'text-neutral-300' : 'text-neutral-500'
                      }`}
                    >
                      {tier.desc}
                    </p>

                    <ul className="space-y-3">
                      {tier.points.map((point) => (
                        <li
                          key={point}
                          className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] ${
                            tier.featured ? 'text-neutral-400' : 'text-neutral-500'
                          }`}
                        >
                          <span className="h-1 w-1 rounded-full bg-[var(--ink)]" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="px-6 py-28">
        <Reveal className="mx-auto max-w-7xl">
          <div data-nav-theme="dark" className="grain relative overflow-hidden bg-neutral-900 p-12 md:p-24">
            <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] animate-drift rounded-full bg-white/10 blur-[120px]" />

            <div className="relative z-10 flex flex-col items-center justify-between gap-12 md:flex-row">
              <div className="max-w-xl text-center md:text-left">
                <SplitText
                  as="h2"
                  text="Ready to evolve your digital presence?"
                  accent={['digital', 'presence?']}
                  className="display mb-6 text-4xl text-white md:text-6xl"
                />
                <Reveal delay={0.3}>
                  <p className="text-lg font-light text-neutral-400">
                    Let's discuss how we can scale your project with precision and soul.
                  </p>
                </Reveal>
              </div>

              <Reveal delay={0.4} direction="left">
                <Magnetic strength={0.3}>
                  <a
                    href={`mailto:${email}?subject=Booking%20a%20consult`}
                    className="group inline-flex items-center gap-5 rounded-full bg-white py-4 pl-9 pr-3 shadow-2xl transition-colors duration-500 hover:bg-[var(--ink)]"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900 transition-colors duration-500 group-hover:text-white">
                      Book a consult
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 transition-colors duration-500 group-hover:bg-white">
                      <ArrowRight
                        size={16}
                        className="text-neutral-900 transition-transform duration-500 group-hover:translate-x-0.5"
                      />
                    </span>
                  </a>
                </Magnetic>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </section>
    </PageShell>
  );
};

export default ServicesPage;
