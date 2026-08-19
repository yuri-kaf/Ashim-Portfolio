import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ArrowUpRight, LayoutGrid, Rows3 } from 'lucide-react';
import { PortfolioData, Project } from '../types';
import {
  PageShell,
  Reveal,
  SplitText,
  SectionLabel,
  Magnetic,
  Counter,
  EASE,
} from '../components/Motion';
import EditorialCard from '../components/EditorialCard';
import { ClipReveal } from '../components/MotionExtras';

interface WorksPageProps {
  data: PortfolioData;
}

/* ---------------------------------------------------------------- *
 * Grid card
 * ---------------------------------------------------------------- */

const GridCard: React.FC<{ project: Project; idx: number }> = ({ project, idx }) => {
  const reduced = useReducedMotion();
  // Nudge every second card down so the grid reads as an editorial spread
  // rather than a table of rows.
  const stagger = idx % 2 === 1 ? 'md:mt-24' : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      transition={{ duration: 0.7, delay: reduced ? 0 : idx * 0.07, ease: EASE }}
      className={stagger}
    >
      <ClipReveal from={idx % 2 === 0 ? 'bottom' : 'left'}>
      <EditorialCard
        to={`/works/${project.id}`}
        image={project.image}
        title={project.title || 'Untitled'}
        meta={project.category}
        submeta={project.year}
        description={project.description}
        index={idx}
        aspect="aspect-[4/3]"
      />
      </ClipReveal>
    </motion.div>
  );
};

/* ---------------------------------------------------------------- *
 * List row — hover surfaces a floating thumbnail
 * ---------------------------------------------------------------- */

const ListRow: React.FC<{ project: Project; idx: number }> = ({ project, idx }) => {
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, delay: reduced ? 0 : idx * 0.05, ease: EASE }}
    >
      <Link
        to={`/works/${project.id}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative flex items-center gap-8 border-b border-black/[0.06] py-9 transition-colors duration-500 hover:border-[var(--ink)]"
      >
        {/* Accent bar wipes in from the left edge */}
        <motion.span
          className="absolute left-0 bottom-[-1px] h-px origin-left bg-[var(--ink)]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: hovered ? 1 : 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          style={{ width: '100%' }}
        />

        <span className="w-12 shrink-0 text-[11px] font-medium tabular-nums text-neutral-300">
          {String(idx + 1).padStart(2, '0')}
        </span>

        <motion.h3
          className="min-w-0 flex-1 truncate text-2xl font-medium tracking-tight text-neutral-900 md:text-4xl lg:text-5xl"
          animate={reduced ? {} : { x: hovered ? 18 : 0, color: hovered ? '#6b6b6b' : '#0a0a0a' }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          {project.title || 'Untitled'}
        </motion.h3>

        {/* Thumbnail only exists while hovered — cheap and keeps the row clean.
            Direct render, not AnimatePresence: exit-completion proved
            unreliable in this environment, which left the thumbnail stuck
            visible after the mouse left. It still animates in on hover. */}
        <div className="relative hidden h-20 w-32 shrink-0 lg:block">
          {hovered && !reduced && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
                animate={{ opacity: 1, scale: 1, rotate: -3 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="absolute inset-0 overflow-hidden rounded-2xl shadow-xl"
              >
                <img src={project.image || ''} alt="" className="h-full w-full object-cover" />
              </motion.div>
          )}
        </div>

        <span className="hidden w-40 shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 md:block">
          {project.category}
        </span>

        <span className="w-14 shrink-0 text-right text-[11px] font-medium tabular-nums text-neutral-400">
          {project.year}
        </span>

        <ArrowUpRight
          size={20}
          className="shrink-0 text-neutral-300 transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--ink)]"
        />
      </Link>
    </motion.div>
  );
};

/* ---------------------------------------------------------------- *
 * Page
 * ---------------------------------------------------------------- */

const WorksPage: React.FC<WorksPageProps> = ({ data }) => {
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const projects = useMemo(
    () => (Array.isArray(data?.projects) ? data.projects : []).filter(Boolean),
    [data?.projects],
  );

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(projects.map((p) => p.category).filter(Boolean)))],
    [projects],
  );

  const filteredProjects = useMemo(
    () => (filter === 'All' ? projects : projects.filter((p) => p.category === filter)),
    [filter, projects],
  );

  const clientCount = useMemo(
    () => new Set(projects.map((p) => p.client).filter(Boolean)).size,
    [projects],
  );

  return (
    <PageShell className="min-h-screen bg-[var(--paper)]">
      {/* ---------- Masthead ---------- */}
      <header className="grain relative overflow-hidden bg-white px-6 pb-24 pt-40">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] animate-drift rounded-full bg-[var(--ink)]/[0.04] blur-[120px]" />

        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <SectionLabel className="mb-8">Portfolio</SectionLabel>
          </Reveal>

          <SplitText
            as="h1"
            text="Selected cases."
            accent={['cases.']}
            className="display mb-12 text-[3.5rem] text-neutral-900 md:text-[8.5rem]"
          />

          <div className="flex flex-col justify-between gap-12 md:flex-row md:items-end">
            <Reveal delay={0.3} className="max-w-lg">
              <p className="text-lg font-light leading-relaxed text-neutral-500 md:text-xl">
                Deep dives into challenging design systems for visionary products — from first
                principles through to shipped interface.
              </p>
            </Reveal>

            {/* Stat strip */}
            <Reveal delay={0.4} direction="left">
              <div className="flex gap-12">
                {[
                  { value: projects.length, suffix: '', label: 'Case studies' },
                  { value: clientCount, suffix: '', label: 'Clients' },
                  { value: 6, suffix: 'y', label: 'Practising' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="mb-1 text-3xl font-medium tabular-nums text-neutral-900 md:text-4xl">
                      <Counter to={stat.value} suffix={stat.suffix} />
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </header>

      {/* ---------- Controls ---------- */}
      <div className="sticky top-0 z-40 border-y border-black/[0.05] bg-[var(--paper)]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`relative rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors duration-300 ${
                  filter === cat ? 'text-white' : 'text-neutral-400 hover:text-neutral-900'
                }`}
              >
                {/* Shared layout id makes the pill slide between filters */}
                {filter === cat && (
                  <motion.span
                    layoutId="works-filter-pill"
                    className="absolute inset-0 rounded-full bg-neutral-900"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            ))}
          </div>

          <div className="btn-container-physical" style={{ padding: '3px' }}>
            {([
              { key: 'grid', Icon: LayoutGrid },
              { key: 'list', Icon: Rows3 },
            ] as const).map(({ key, Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                aria-label={`${key} view`}
                aria-pressed={view === key}
                className={`relative flex h-8 w-9 items-center justify-center rounded-full transition-colors duration-300 ${
                  view === key ? 'text-white' : 'text-neutral-400 hover:text-neutral-900'
                }`}
              >
                {view === key && (
                  <motion.span
                    layoutId="works-view-pill"
                    className="absolute inset-0 rounded-full bg-[var(--ink)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon size={14} className="relative z-10" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Results ---------- */}
      <section className="px-6 py-14 md:py-24">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence mode="popLayout">
            {view === 'grid' ? (
              <motion.div
                key="grid"
                layout
                className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-10 md:gap-y-4"
              >
                {filteredProjects.map((project, idx) => (
                  <GridCard key={project.id} project={project} idx={idx} />
                ))}
              </motion.div>
            ) : (
              <motion.div key="list" layout className="border-t border-black/[0.06]">
                {filteredProjects.map((project, idx) => (
                  <ListRow key={project.id} project={project} idx={idx} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {filteredProjects.length === 0 && (
            <Reveal className="py-24 text-center">
              <p className="text-neutral-400">Nothing here yet under “{filter}”.</p>
              <button
                onClick={() => setFilter('All')}
                className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--grey-1)] link-wipe"
              >
                Show everything
              </button>
            </Reveal>
          )}
        </div>
      </section>

      {/* ---------- Tail CTA ---------- */}
      <section className="px-6 pb-32">
        <Reveal className="mx-auto max-w-7xl">
          <div data-nav-theme="dark" className="grain relative overflow-hidden bg-neutral-900 p-12 text-center md:p-20">
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 animate-drift rounded-full bg-white/10 blur-[110px]" />
            <div className="relative z-10">
              <SplitText
                as="h2"
                text="Your project could be next."
                accent={['next.']}
                className="display mx-auto mb-8 max-w-2xl text-4xl text-white md:text-6xl"
              />
              <Reveal delay={0.3}>
                <Magnetic strength={0.25} className="inline-block">
                  <a
                    href="mailto:ashimkaflebiz@gmail.com"
                    className="inline-flex items-center gap-4 rounded-full bg-white px-9 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900 shadow-2xl transition-colors duration-300 hover:bg-[var(--ink)] hover:text-white"
                  >
                    Start a conversation
                    <ArrowUpRight size={16} />
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

export default WorksPage;
