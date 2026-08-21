import React, { useState, useEffect, useCallback } from 'react';
import Seo from '../components/Seo';
import { motion, useReducedMotion } from 'motion/react';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { PortfolioData, GalleryItem } from '../types';
import { PageShell, Reveal, Stagger, StaggerItem, EASE } from '../components/Motion';
import { ClipReveal, ScrollHint } from '../components/MotionExtras';

interface GalleryPageProps {
  data: PortfolioData;
}

/** Column count is fixed so the masonry columns stay balanced and predictable. */
const COLUMNS = 3;

const toColumns = (items: GalleryItem[]) => {
  const cols: GalleryItem[][] = Array.from({ length: COLUMNS }, () => []);
  items.forEach((item, i) => cols[i % COLUMNS].push(item));
  return cols;
};

const GalleryPage: React.FC<GalleryPageProps> = ({ data }) => {
  const items = (data?.gallery || []).filter(Boolean);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduced = useReducedMotion();

  const active = openIndex !== null ? items[openIndex] : null;

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current === null || items.length === 0) return current;
        // Wrap around at both ends.
        return (current + delta + items.length) % items.length;
      });
    },
    [items.length],
  );

  // Lightbox keyboard controls + scroll lock.
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenIndex(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [active, step]);

  const columns = toColumns(items);

  return (
    <PageShell className="min-h-screen bg-[var(--paper)]">
      <Seo defaults={data.seo} title="Gallery" path="/gallery" description={data.pageIntros.gallery} />
      {/* ---------- Masthead ---------- */}
      <header className="px-5 pb-16 pt-36 md:px-10 md:pt-44">
        <div className="mx-auto max-w-[1600px]">
          <Reveal>
            <span className="mono bracket mb-8 block text-[var(--grey-1)]">Gallery</span>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="mega mb-10 text-[15vw] leading-[0.8] md:text-[9vw]">
              Off
              <br />
              the{' '}
              <span
                style={{ WebkitTextStroke: '1.5px #0a0a0a', WebkitTextFillColor: 'transparent' }}
              >
                clock
              </span>
            </h1>
          </Reveal>

          <div className="flex flex-col justify-between gap-6 border-t border-[var(--ink)] pt-8 md:flex-row md:items-end">
            <Reveal delay={0.2}>
              <p className="max-w-md text-base font-light leading-relaxed text-[var(--grey-1)]">
                Studio shots, workshops, whiteboards and late nights — the unglamorous half of the
                job that never makes it into a case study.
              </p>
            </Reveal>
            <Reveal delay={0.3} className="flex items-center gap-8">
              <p className="mono whitespace-nowrap text-[var(--grey-2)]">
                {String(items.length).padStart(2, '0')} photographs
              </p>
              <ScrollHint className="text-[var(--ink)]" />
            </Reveal>
          </div>
        </div>
      </header>

      {/* ---------- Masonry ---------- */}
      <section className="px-5 pb-32 md:px-10">
        <div className="mx-auto max-w-[1600px]">
          {items.length === 0 ? (
            <p className="mono py-24 text-center text-[var(--grey-2)]">
              No photographs yet — add some to the gallery.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-5">
              {columns.map((col, colIdx) => (
                <Stagger
                  key={colIdx}
                  // Offsetting alternate columns turns a plain grid into a mosaic.
                  className={`flex flex-col gap-4 md:gap-5 ${colIdx === 1 ? 'md:mt-14' : ''} ${
                    colIdx === 2 ? 'md:mt-6' : ''
                  }`}
                  stagger={0.09}
                  delay={colIdx * 0.05}
                >
                  {col.map((item) => {
                    const index = items.findIndex((i) => i.id === item.id);
                    return (
                      <StaggerItem key={item.id}>
                        <ClipReveal from={index % 2 === 0 ? 'bottom' : 'left'}>
                        <motion.button
                          onClick={() => setOpenIndex(index)}
                          whileHover={reduced ? undefined : { y: -6 }}
                          transition={{ duration: 0.5, ease: EASE }}
                          className="group relative block w-full overflow-hidden bg-neutral-200 text-left"
                          aria-label={`Open ${item.caption}`}
                        >
                          <img
                            src={item.image}
                            alt={item.caption}
                            loading="lazy"
                            className="w-full object-cover grayscale transition-all duration-[1.1s] group-hover:scale-[1.04] group-hover:grayscale-0"
                          />
                          <span className="mono absolute bottom-3 left-3 text-white mix-blend-difference">
                            {item.caption}
                          </span>
                          <span className="mono absolute right-3 top-3 text-white mix-blend-difference">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </motion.button>
                        </ClipReveal>
                      </StaggerItem>
                    );
                  })}
                </Stagger>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- Lightbox ----------
          Rendered directly rather than through AnimatePresence: in testing,
          AnimatePresence's exit-completion signal proved unreliable in this
          environment, which left the lightbox stuck open with no way to
          close it. Entrance still animates on mount; closing is immediate
          rather than an animated dismiss. */}
      {active && (
          <motion.div
            className="fixed inset-0 z-[160] flex flex-col bg-[#0a0a0a]/95 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            role="dialog"
            aria-modal="true"
            aria-label={active.caption}
          >
            {/* Top bar */}
            <div className="flex shrink-0 items-center justify-between px-5 py-5 md:px-10">
              <span className="mono text-white/60">
                {String((openIndex ?? 0) + 1).padStart(2, '0')} /{' '}
                {String(items.length).padStart(2, '0')}
              </span>
              <button
                onClick={() => setOpenIndex(null)}
                aria-label="Close gallery"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors duration-300 hover:bg-white hover:text-[#0a0a0a]"
              >
                <X size={17} />
              </button>
            </div>

            {/* Image stage — clicking the backdrop closes */}
            <div
              className="flex min-h-0 flex-1 items-center justify-center px-5 pb-4 md:px-10"
              onClick={() => setOpenIndex(null)}
            >
              {/* key remount still plays the entrance transition on every
                  prev/next step, just without an AnimatePresence-driven
                  crossfade of the outgoing image. */}
              <motion.img
                key={active.id}
                src={active.image}
                alt={active.caption}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: EASE }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Bottom bar */}
            <div className="flex shrink-0 items-center justify-between gap-6 px-5 py-6 md:px-10">
              <p className="mono truncate text-white/70">{active.caption}</p>
              <div className="flex shrink-0 gap-3">
                <button
                  onClick={() => step(-1)}
                  aria-label="Previous photograph"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors duration-300 hover:bg-white hover:text-[#0a0a0a]"
                >
                  <ArrowLeft size={17} />
                </button>
                <button
                  onClick={() => step(1)}
                  aria-label="Next photograph"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors duration-300 hover:bg-white hover:text-[#0a0a0a]"
                >
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </motion.div>
      )}
    </PageShell>
  );
};

export default GalleryPage;
