import React, { useRef } from 'react';
import Seo from '../components/Seo';
import { DEFAULT_DATA } from '../lib/defaults.js';
import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { PortfolioData } from '../types';
import {
  PageShell,
  Reveal,
  SplitText,
  SectionLabel,
  Stagger,
  StaggerItem,
  Parallax,
  Magnetic,
  EASE,
} from '../components/Motion';

interface WorkDetailPageProps {
  data: PortfolioData;
}

/**
 * Scroll-linked hero. Lives in its own component so `useScroll` is only ever
 * called once its ref is actually mounted — calling it above the parent's
 * "not found" early return left the target unhydrated and motion threw.
 */
const CinematicHero: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.14]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);

  return (
    <div ref={heroRef} className="relative overflow-hidden px-6 pb-24">
      <Reveal className="mx-auto max-w-7xl" blur>
        <div className="relative aspect-[16/9] overflow-hidden rounded-none bg-neutral-100 shadow-[0_40px_80px_rgba(0,0,0,0.09)]">
          <motion.img
            src={src}
            alt={alt}
            style={reduced ? undefined : { scale, opacity }}
            className="h-full w-full object-cover"
          />
        </div>
      </Reveal>
    </div>
  );
};

const WorkDetailPage: React.FC<WorkDetailPageProps> = ({ data }) => {
  const { id } = useParams<{ id: string }>();

  const projects = (data?.projects || []).filter(Boolean);
  const email = data?.contact?.email || DEFAULT_DATA.contact.email;
  // Slug first, id second: URLs use slugs now, but links shared before slugs
  // existed still point at ids and must keep resolving.
  const bySlug = projects.findIndex((p) => p.slug === id);
  const index = bySlug >= 0 ? bySlug : projects.findIndex((p) => p.id === id);
  const project = index >= 0 ? projects[index] : undefined;
  // Wrap around so there is always somewhere to go next.
  const next = projects.length > 1 ? projects[(index + 1) % projects.length] : undefined;

  if (!project) {
    return (
      <PageShell className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-6">
      <Seo
        defaults={data.seo}
        data={data}
        title={project.title}
        description={project.subtitle || project.description}
        image={project.image}
        path={`/works/${project.slug}`}
        type="article"
        schemaType="CreativeWork"
      />
        <div className="text-center">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--grey-1)]">404</p>
          <h2 className="display mb-8 text-4xl text-neutral-900 md:text-6xl">Project not found.</h2>
          <Link
            to="/works"
            className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 transition-colors hover:text-[var(--ink)]"
          >
            <ArrowLeft size={14} /> <span className="link-wipe">Back to works</span>
          </Link>
        </div>
      </PageShell>
    );
  }

  const metaItems = [
    { label: 'Client', value: project.client },
    { label: 'Year', value: project.year },
    { label: 'Category', value: project.category },
    { label: 'Services', value: 'UX/UI, Branding' },
  ];

  return (
    <PageShell className="min-h-screen bg-[var(--paper)]">
      {/* ---------- Title block ---------- */}
      <header className="grain relative overflow-hidden bg-white px-6 pb-20 pt-36">
        <div className="pointer-events-none absolute -right-40 -top-32 h-[520px] w-[520px] animate-drift rounded-full bg-[var(--ink)]/[0.04] blur-[130px]" />

        <div className="relative mx-auto max-w-6xl">
          <Reveal className="mb-12">
            <Link
              to="/works"
              className="group inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 transition-colors duration-300 hover:text-[var(--ink)]"
            >
              <ArrowLeft
                size={14}
                className="transition-transform duration-300 group-hover:-translate-x-1"
              />
              Back to projects
            </Link>
          </Reveal>

          <Reveal>
            <SectionLabel className="mb-8">{project.category}</SectionLabel>
          </Reveal>

          <SplitText
            as="h1"
            text={project.title}
            className="display mb-12 text-[3.25rem] text-neutral-900 md:text-[7rem]"
          />

          <Reveal delay={0.3} className="max-w-2xl">
            <p className="text-lg font-light leading-relaxed text-neutral-500 md:text-2xl">
              {project.description}
            </p>
          </Reveal>
        </div>
      </header>

      {/* ---------- Cinematic hero image ---------- */}
      <CinematicHero src={project.image} alt={project.title} />

      {/* ---------- Meta strip ---------- */}
      <section className="border-y border-black/[0.05] bg-white px-6 py-14">
        <Stagger className="mx-auto grid max-w-6xl grid-cols-2 gap-10 md:grid-cols-4" stagger={0.08}>
          {metaItems.map((item) => (
            <StaggerItem key={item.label}>
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.25em] text-neutral-400">
                {item.label}
              </p>
              <p className="text-lg font-medium tracking-tight text-neutral-900">{item.value}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ---------- Case study body ---------- */}
      <section className="px-6 py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[280px_1fr] lg:gap-24">
          {/* Sticky rail */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <Reveal>
              <h2 className="display mb-8 text-3xl text-neutral-900 md:text-4xl">
                The vision<span className="text-[var(--grey-1)]">.</span>
              </h2>
              <Magnetic strength={0.2} className="inline-block">
                {/* No live URL in the project data yet. A bare "#" href would
                    hijack HashRouter and navigate away, so this stays a button
                    until a real link exists. */}
                <button
                  type="button"
                  disabled
                  title="Live link coming soon"
                  className="group inline-flex cursor-default items-center gap-3 rounded-full bg-neutral-900 px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-xl opacity-60"
                >
                  Live site
                  <ExternalLink size={13} />
                </button>
              </Magnetic>
            </Reveal>
          </aside>

          {/* Copy */}
          <div>
            <Reveal>
              <p className="mb-14 text-2xl font-light italic leading-relaxed text-neutral-600 md:text-3xl">
                {project.description}
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <h3 className="mb-6 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--grey-1)]">
                Case study breakdown
              </h3>
              <p className="whitespace-pre-wrap text-lg font-light leading-[1.85] text-neutral-600">
                {project.caseStudy}
              </p>
            </Reveal>

            {/* Outcome figures */}
            <Stagger className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3" stagger={0.1}>
              {[
                { v: '+38%', k: 'Conversion lift' },
                { v: '2.1s', k: 'Load time' },
                { v: '4.8/5', k: 'User rating' },
              ].map((stat) => (
                <StaggerItem key={stat.k}>
                  <div className="surface-inset p-7">
                    <p className="mb-2 text-3xl font-medium tracking-tight text-neutral-900">
                      {stat.v}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                      {stat.k}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* ---------- Detail gallery ---------- */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-14">
            <SectionLabel>Gallery</SectionLabel>
          </Reveal>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {[1, 2].map((n) => (
              <Reveal
                key={n}
                delay={n * 0.12}
                className={n === 2 ? 'md:mt-20' : undefined}
              >
                <div className="overflow-hidden rounded-none bg-neutral-100 shadow-[0_20px_45px_rgba(0,0,0,0.06)]">
                  <div className="aspect-[4/5] overflow-hidden">
                    <Parallax offset={-26} className="h-full">
                      <img
                        src={`https://picsum.photos/seed/${project.id}-detail-${n}/900/1100`}
                        alt={`${project.title} detail ${n}`}
                        loading="lazy"
                        className="h-full w-full object-cover grayscale transition-all duration-[1.4s] hover:grayscale-0"
                      />
                    </Parallax>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Next project ---------- */}
      {next && (
        <section className="border-t border-black/[0.05] bg-white px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mb-10">
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400">
                Next project
              </span>
            </Reveal>

            <Reveal delay={0.1}>
              <Link to={`/works/${next.slug}`} className="group block">
                <div className="flex flex-col items-start gap-10 md:flex-row md:items-center">
                  <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-none bg-neutral-100 md:w-64">
                    <img
                      src={next.image}
                      alt={next.title}
                      loading="lazy"
                      className="h-full w-full object-cover grayscale transition-all duration-[1.2s] group-hover:scale-105 group-hover:grayscale-0"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--grey-1)]">
                      {next.category}
                    </p>
                    <h3 className="display text-4xl text-neutral-900 transition-colors duration-500 group-hover:text-[var(--ink)] md:text-6xl">
                      {next.title}
                    </h3>
                  </div>

                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-black/[0.08] text-neutral-400 transition-all duration-500 group-hover:border-[var(--ink)] group-hover:bg-[var(--ink)] group-hover:text-white">
                    <ArrowRight
                      size={20}
                      className="transition-transform duration-500 group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------- CTA ---------- */}
      <section className="px-6 py-28">
        <Reveal className="mx-auto max-w-6xl">
          <div data-nav-theme="dark" className="grain relative overflow-hidden rounded-none bg-neutral-900 p-12 text-center md:p-20">
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 animate-drift rounded-full bg-white/10 blur-[110px]" />
            <div className="relative z-10">
              <SplitText
                as="h2"
                text="Ready to start a similar project?"
                accent={['similar', 'project?']}
                className="display mx-auto mb-10 max-w-2xl text-4xl text-white md:text-6xl"
              />
              <Reveal delay={0.3}>
                <Magnetic strength={0.25} className="inline-block">
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-4 rounded-full bg-white px-9 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900 shadow-2xl transition-colors duration-500 hover:bg-[var(--ink)] hover:text-white"
                  >
                    Get in touch
                    <ArrowRight size={16} />
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

export default WorkDetailPage;
