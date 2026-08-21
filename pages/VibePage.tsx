import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { Quote, Heart } from 'lucide-react';
import DynamicIcon from '../components/DynamicIcon';
import { PortfolioData, ProcessStep } from '../types';
import {
  PageShell,
  Reveal,
  SplitText,
  SectionLabel,
  Stagger,
  StaggerItem,
  Parallax,
  Marquee,
  EASE,
} from '../components/Motion';

interface VibePageProps {
  data: PortfolioData;
}

/**
 * Vertical timeline whose accent line fills as the section scrolls past.
 */
const ProcessTimeline: React.FC<{ steps: ProcessStep[] }> = ({ steps }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.75', 'end 0.6'],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className="relative">
      {/* Rail — static track plus the progress fill on top of it */}
      <div className="absolute left-[19px] top-4 bottom-4 hidden w-px bg-black/[0.07] md:block" />
      <motion.div
        className="absolute left-[19px] top-4 bottom-4 hidden w-px origin-top bg-[var(--ink)] md:block"
        style={reduced ? { scaleY: 1 } : { scaleY }}
      />

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <Reveal key={step.id} delay={idx * 0.1} direction="right" distance={24}>
            <div className="group flex gap-8">
              <div className="relative z-10 hidden shrink-0 md:block">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.07] bg-white text-neutral-300 shadow-sm transition-all duration-500 group-hover:border-[var(--ink)] group-hover:bg-[var(--ink)] group-hover:text-white">
                  <DynamicIcon name={step.iconName} size={16} />
                </div>
              </div>

              <div className="flex-1 rounded-none border border-black/[0.05] bg-white p-8 transition-all duration-500 group-hover:border-[var(--ink)]/20 group-hover:shadow-[0_20px_45px_rgba(0,0,0,0.05)]">
                <div className="mb-4 flex items-center gap-4">
                  <span className="text-[11px] font-bold tabular-nums text-[var(--grey-1)]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h4 className="text-2xl font-medium tracking-tight text-neutral-900">
                    {step.title}
                  </h4>
                </div>
                <p className="max-w-md text-sm font-light leading-relaxed text-neutral-500">
                  {step.description}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
};

const VibePage: React.FC<VibePageProps> = ({ data }) => {
  const vibe = data?.vibe || { title: 'The Approach', description: 'Design with intent.', philosophy: [] };
  const philosophy = (vibe.philosophy || []).filter(Boolean);
  const steps = (data?.process || []).filter(Boolean);
  const tools = (data?.tools || []).filter(Boolean);
  const reduced = useReducedMotion();

  return (
    <PageShell className="min-h-screen bg-[var(--paper)]">
      {/* ---------- Masthead with oversized ghost word ---------- */}
      <header className="grain relative overflow-hidden bg-white px-6 pb-32 pt-40">
        <div className="pointer-events-none absolute -right-32 top-0 h-[560px] w-[560px] animate-drift rounded-full bg-[var(--ink)]/[0.04] blur-[130px]" />

        {/* Ghost wordmark drifts slower than the page for depth */}
        <Parallax
          offset={-40}
          className="pointer-events-none absolute inset-x-0 top-24 select-none text-center"
        >
          <span className="display text-[22vw] font-medium leading-none text-black/[0.028]">
            APPROACH
          </span>
        </Parallax>

        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <SectionLabel className="mb-8">{vibe.title || 'The Approach'}</SectionLabel>
          </Reveal>

          <SplitText
            as="h1"
            text="The crimson vibe."
            accent={['vibe.']}
            className="display mb-14 text-[3.5rem] text-neutral-900 md:text-[8rem]"
          />

          <Reveal delay={0.3} className="max-w-xl">
            <p className="text-lg font-light leading-relaxed text-neutral-500 md:text-xl">
              A working philosophy, not a style guide. Here's how I think about the craft — and what
              you can expect when we build together.
            </p>
          </Reveal>
        </div>
      </header>

      {/* ---------- Manifesto quote + portrait ---------- */}
      <section className="px-6 py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="order-2 lg:order-1">
            <Reveal>
              <div className="glass-card relative mb-14 overflow-hidden rounded-none p-10 md:p-14">
                <span className="absolute left-0 top-0 h-full w-1 bg-[var(--ink)]" />
                <Quote size={40} className="mb-8 text-[var(--grey-1)]" />
                <p className="text-2xl font-normal italic leading-snug tracking-tight text-neutral-900 md:text-4xl">
                  “{vibe.description || 'Design is how it works.'}”
                </p>
              </div>
            </Reveal>

            {/* Numbered philosophy statements */}
            <Stagger className="space-y-0" stagger={0.1}>
              {philosophy.map((item, idx) => (
                <StaggerItem key={idx}>
                  <div className="group flex items-baseline gap-6 border-b border-black/[0.06] py-7 first:border-t">
                    <span className="text-[11px] font-bold tabular-nums text-[var(--grey-2)] transition-colors duration-500 group-hover:text-[var(--ink)]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <p className="flex-1 text-xl font-normal leading-snug tracking-tight text-neutral-900 transition-colors duration-500 group-hover:text-[var(--ink)] md:text-2xl">
                      {item}
                    </p>
                  </div>
                </StaggerItem>
              ))}
              {philosophy.length === 0 && (
                <p className="py-8 text-neutral-400">No philosophy points defined yet.</p>
              )}
            </Stagger>
          </div>

          {/* Portrait */}
          <div className="order-1 lg:order-2">
            <Reveal direction="left" delay={0.2}>
              <div className="relative">
                <div className="border-t border-[var(--ink)]">
                  <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                    <Parallax offset={-24} className="absolute inset-[-10%]">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop"
                        alt={data?.name || 'Designer portrait'}
                        loading="lazy"
                        className="h-full w-full object-cover grayscale contrast-[1.08] transition-all duration-[1.4s] hover:grayscale-0"
                      />
                    </Parallax>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                  </div>
                </div>

                {/* Floating credential card */}
                <motion.div
                  className="glass-card absolute -bottom-8 -left-8 hidden max-w-[260px] rounded-none p-7 md:block"
                  initial={{ opacity: 0, y: 24, rotate: -4 }}
                  whileInView={{ opacity: 1, y: 0, rotate: -2 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
                  whileHover={reduced ? undefined : { rotate: 0, y: -4 }}
                >
                  <p className="mb-2 text-xl font-medium tracking-tight text-[var(--grey-1)]">Authentic</p>
                  <p className="text-sm font-light italic leading-relaxed text-neutral-600">
                    “Designing with intent and pulse.”
                  </p>
                </motion.div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Process ---------- */}
      <section className="border-y border-black/[0.05] bg-white px-6 py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 max-w-2xl">
            <Reveal>
              <SectionLabel className="mb-8">Methodology</SectionLabel>
            </Reveal>
            <SplitText
              as="h2"
              text="The process."
              accent={['process.']}
              className="display mb-6 text-4xl text-neutral-900 md:text-6xl"
            />
            <Reveal delay={0.3}>
              <p className="text-lg font-light leading-relaxed text-neutral-500">
                Four phases, run in order, with a review gate between each one. No surprises at the
                end.
              </p>
            </Reveal>
          </div>

          <ProcessTimeline steps={steps} />
        </div>
      </section>

      {/* ---------- Toolbox marquee ---------- */}
      <section className="py-24">
        <Reveal className="mb-14 px-6">
          <div className="mx-auto max-w-7xl">
            <SectionLabel className="mb-8">Arsenal</SectionLabel>
            <SplitText
              as="h2"
              text="The toolbox."
              accent={['toolbox.']}
              className="display text-4xl text-neutral-900 md:text-6xl"
            />
          </div>
        </Reveal>

        <div className="marquee-mask space-y-4">
          <Marquee speed={34}>
            {tools.map((tool) => (
              <span
                key={tool.id}
                className="mx-2 whitespace-nowrap rounded-full border border-black/[0.05] bg-white px-8 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500 shadow-sm"
              >
                {tool.name}
              </span>
            ))}
          </Marquee>
          <Marquee speed={40} reverse>
            {[...tools].reverse().map((tool) => (
              <span
                key={tool.id}
                className="mx-2 whitespace-nowrap rounded-full border border-black/[0.05] bg-white px-8 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500 shadow-sm"
              >
                {tool.name}
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ---------- Why work together ---------- */}
      <section className="px-6 pb-32">
        <Reveal className="mx-auto max-w-7xl">
          <div data-nav-theme="dark" className="grain relative overflow-hidden rounded-none bg-neutral-900 p-12 md:p-20">
            <div className="pointer-events-none absolute -bottom-32 -left-32 h-[420px] w-[420px] animate-drift rounded-full bg-white/10 blur-[120px]" />

            <div className="relative z-10 grid gap-16 lg:grid-cols-2 lg:gap-24">
              <div>
                <Heart className="mb-8 text-[var(--grey-1)]" size={28} />
                <SplitText
                  as="h2"
                  text="Why work together?"
                  accent={['together?']}
                  className="display mb-8 text-4xl text-white md:text-5xl"
                />
                <Reveal delay={0.3}>
                  <p className="max-w-md text-lg font-light leading-relaxed text-neutral-400">
                    I don't just deliver files; I deliver impact. The goal is to make your product
                    the most desirable asset in its niche by leveraging deep psychology and
                    cutting-edge visual craft.
                  </p>
                </Reveal>
              </div>

              <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2" stagger={0.1}>
                {[
                  { k: 'Senior only', v: 'You work directly with me — no handoffs to juniors.' },
                  { k: 'Systems first', v: 'Everything ships as reusable components, not one-offs.' },
                  { k: 'Fast loops', v: 'Reviewable work in your hands within days, not weeks.' },
                  { k: 'Built to ship', v: 'Designs that respect real engineering constraints.' },
                ].map((item) => (
                  <StaggerItem key={item.k}>
                    <div className="glass-card-dark h-full rounded-none p-7 transition-colors duration-500 hover:border-white/25">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                        {item.k}
                      </p>
                      <p className="text-sm font-light leading-relaxed text-neutral-300">{item.v}</p>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </div>
        </Reveal>
      </section>
    </PageShell>
  );
};

export default VibePage;
