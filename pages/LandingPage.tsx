import React, { useRef, useState, useEffect } from 'react';
import Seo from '../components/Seo';
import { homeTitle } from '../lib/titles';
import { Link } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import {
  PortfolioData,
  Project,
  Service,
  GalleryItem,
  SocialLink,
  Discipline,
  Contact as ContactDetails,
} from '../types';
import { INITIAL_DATA } from '../constants';
import { Reveal, Stagger, StaggerItem, Marquee, Magnetic, Counter, EASE } from '../components/Motion';
import EditorialCard from '../components/EditorialCard';
import { VelocityMarquee, ClipReveal, Pulse, HoverSwap } from '../components/MotionExtras';
import { smoothScrollTo } from '../components/SmoothScroll';

interface LandingPageProps {
  data: PortfolioData;
}

/**
 * Scrolls to a section by id.
 *
 * The app runs on HashRouter, so a plain `href="#work"` anchor rewrites the
 * route hash and lands on an unmatched path — a blank page. Any in-page jump
 * has to be handled programmatically instead.
 */
const jumpTo = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  const el = document.getElementById(id);
  // Route through Lenis when it's driving the scroll, otherwise it fights the
  // native smooth scroll and the jump stutters.
  if (el) smoothScrollTo(el);
};

/** Placeholder social link — inert until a real URL is filled in. */

/* ================================================================== *
 * HERO
 *
 * The cutout portrait sits mid-canvas; the headline lies on top of it
 * in `mix-blend-mode: difference`, so the type inverts itself wherever
 * it crosses the photograph. Pure black and white, no accent colour.
 * ================================================================== */

const Hero: React.FC<{ data: PortfolioData }> = ({ data }) => {
  const stats = data.stats ?? [];
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const portraitY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const typeY = useTransform(scrollYProgress, [0, 1], ['0%', '-32%']);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const firstName = (data?.name || 'Ashim Kafle').split(' ')[0];
  const company = data?.company || {
    name: 'Limi Creatives',
    role: 'Co-founder & CMO',
    description: '',
  };

  return (
    <section
      ref={ref}
      data-nav-theme="dark" className="relative min-h-[100svh] overflow-hidden bg-[#0a0a0a] pb-6 pt-24 md:pt-28"
    >
      {/* ---- micro header rail ---- */}
      {/* nowrap keeps the ::before/::after brackets from orphaning onto a
          second line when a label is too long for the viewport. */}
      <div className="relative z-30 mx-auto flex max-w-[1600px] items-start justify-between gap-6 px-5 md:px-10">
        <span className="mono flex items-center gap-2 whitespace-nowrap text-white/70">
          {/* Infinite breathing dot — signals the page is live */}
          <Pulse className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
          Available for work
        </span>
        <span className="mono bracket hidden whitespace-nowrap text-white/70 lg:inline">
          {company.role} — {company.name}
        </span>
        <span className="mono bracket whitespace-nowrap text-white/70">Est. 2018</span>
      </div>

      {/* ---- portrait ----
           Anchored hard right and allowed to bleed off-canvas, which keeps the
           left column clear for the small copy. Only the headline is meant to
           cross the photograph. */}
      <motion.div
        style={reduced ? undefined : { y: portraitY }}
        className="pointer-events-none absolute bottom-0 right-[-22%] z-10 sm:right-[-10%] md:right-[2%]"
      >
        <picture>
          <source srcSet="/ashim-portrait.webp" type="image/webp" />
          <img
            src="/ashim-portrait.png"
            alt={data?.name || 'Ashim Kafle'}
            /* Hard grayscale + lifted contrast is what makes the difference
               blend read as a graphic device rather than a photo effect. */
            className="h-[62svh] w-auto object-contain object-bottom grayscale contrast-[1.25] brightness-[1.05] sm:h-[74svh] md:h-[88svh]"
          />
        </picture>
      </motion.div>

      {/* ---- headline over the portrait ---- */}
      <motion.div
        style={reduced ? undefined : { y: typeY }}
        className="relative z-20 mx-auto mt-[4svh] max-w-[1600px] px-5 md:mt-[6svh] md:px-10"
      >
        {/* Both disciplines named outright, at equal scale — design alone
            undersold half the practice. Solid = design, outlined = marketing.
            Sized so four lines clear a 900px-tall laptop viewport. */}
        <h1 className="blend-difference mega text-[11vw] leading-[0.84] md:text-[9.5vw]">
          {[
            { text: 'Design', outlined: false },
            { text: 'that sells.', outlined: false },
            { text: 'Marketing', outlined: true },
            { text: 'that scales.', outlined: true },
          ].map((line, i) => (
            <span key={line.text} className="block overflow-hidden">
              <motion.span
                className="block"
                initial={reduced ? undefined : { y: '108%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 1.1, delay: 0.15 + i * 0.1, ease: EASE }}
                style={
                  line.outlined
                    ? { WebkitTextStroke: '1.5px #ffffff', WebkitTextFillColor: 'transparent' }
                    : undefined
                }
              >
                {line.text}
              </motion.span>
            </span>
          ))}
        </h1>
      </motion.div>

      {/* ---- bottom rail ----
           Held to a narrow left column so it never sits over the portrait. */}
      <motion.div
        style={reduced ? undefined : { opacity: fade }}
        className="relative z-30 mx-auto mt-[4svh] max-w-[1600px] px-5 md:mt-[4svh] md:px-10"
      >
        <div className="flex max-w-[200px] flex-col gap-6 sm:max-w-[300px] md:max-w-[380px] md:gap-7">
          <Reveal delay={0.7}>
            <p className="text-[13px] font-light leading-relaxed text-white/60 md:text-sm">
              {data.heroIntro}{' '}
              <span className="text-white">
                {company.role} at {company.name}
              </span>
              .
            </p>
          </Reveal>

          <Reveal delay={0.8}>
            <div className="flex items-end gap-8 border-t border-white/15 pt-5 md:gap-12">
              {stats.map((stat) => (
                <div key={stat.id}>
                  <p className="mb-1 text-2xl font-medium tabular-nums text-white md:text-4xl">
                    {/* Counter animates a number; a non-numeric value is shown
                        as-is so a stat like "24/7" still renders. */}
                    {Number.isFinite(Number(stat.value)) && stat.value.trim() !== '' ? (
                      <Counter to={Number(stat.value)} suffix={stat.suffix} />
                    ) : (
                      <>
                        {stat.value}
                        {stat.suffix}
                      </>
                    )}
                  </p>
                  <p className="mono mono-sm text-white/45">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.9}>
            <Magnetic strength={0.3} className="w-fit">
              <a
                href="#work"
                onClick={jumpTo('work')}
                className="group flex items-center gap-4 rounded-full border border-white/20 py-2.5 pl-5 pr-2.5 transition-colors duration-500 hover:bg-white"
              >
                <span className="mono text-white transition-colors duration-500 group-hover:text-[#0a0a0a]">
                  See the work
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition-colors duration-500 group-hover:bg-[#0a0a0a]">
                  <ArrowRight
                    size={14}
                    className="text-[#0a0a0a] transition-colors duration-500 group-hover:text-white"
                  />
                </span>
              </a>
            </Magnetic>
          </Reveal>
        </div>
      </motion.div>
    </section>
  );
};

/* ================================================================== *
 * TICKER — the seam between hero and work
 * ================================================================== */

/** Alternates design and marketing terms so neither discipline dominates. */
const Ticker: React.FC<{ items: string[] }> = ({ items }) => (
  <div className="overflow-hidden border-y border-[var(--hairline)] bg-[var(--paper)] py-5">
    {/* Shears with scroll momentum, so the seam feels physically connected
        to the reader's gesture. */}
    <VelocityMarquee baseSpeed={38}>
      {items.map((item) => (
        <span key={item} className="flex items-center whitespace-nowrap">
          <span className="mega px-8 text-3xl text-[var(--ink)] md:text-5xl">{item}</span>
          <span className="h-2 w-2 rounded-full bg-[var(--ink)]" />
        </span>
      ))}
    </VelocityMarquee>
  </div>
);

/* ================================================================== *
 * DISCIPLINES — the two halves of the practice, side by side
 * ================================================================== */

const Disciplines: React.FC<{ disciplines: Discipline[] }> = ({ disciplines }) => (
  <section className="border-b border-[var(--hairline)] bg-[var(--paper)]">
    <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
      <Reveal>
        <span className="mono bracket mb-12 block text-[var(--grey-1)]">Two halves, one job</span>
      </Reveal>

      <div className="grid grid-cols-1 gap-px bg-[var(--hairline)] md:grid-cols-2">
        {disciplines.map((d, idx) => (
          <Reveal key={d.id} delay={idx * 0.12} className="bg-[var(--paper)]">
            <div className="h-full px-0 py-8 md:px-10 md:py-4">
              <div className="mb-6 flex items-baseline gap-4">
                <span className="mono text-[var(--grey-2)]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h3
                  className="mega text-[13vw] leading-none md:text-[5.5vw]"
                  /* Marketing outlined, mirroring the hero's device. */
                  style={
                    idx === 1
                      ? { WebkitTextStroke: '1.5px #0a0a0a', WebkitTextFillColor: 'transparent' }
                      : undefined
                  }
                >
                  {d.key}
                </h3>
              </div>

              <p className="mb-8 max-w-sm text-base font-light leading-relaxed text-[var(--grey-1)]">
                {d.blurb}
              </p>

              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {d.items.map((item) => (
                  <li key={item} className="mono flex items-center gap-2 text-[var(--ink)]">
                    <span className="h-1 w-1 rounded-full bg-[var(--ink)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

/* ================================================================== *
 * WORK — vertical scroll drives a horizontal filmstrip
 * ================================================================== */

const WorkCard: React.FC<{ project: Project; idx: number }> = ({ project, idx }) => (
  <EditorialCard
    to={`/works/${project.slug}`}
    image={project.image}
    title={project.title || 'Untitled'}
    meta={project.category}
    submeta={project.year}
    index={idx}
    className="w-[78vw] shrink-0 sm:w-[52vw] lg:w-[34vw]"
  />
);

const Work: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  /* How far the track must travel to bring its right edge flush with the
     viewport. Measured rather than guessed — a hardcoded percentage overshot
     and left a screen of dead space after the last card. */
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      setShift(Math.max(0, track.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener('resize', measure);
    // Card widths are in vw and images load late, so re-measure once settled.
    const t = window.setTimeout(measure, 600);
    return () => {
      window.removeEventListener('resize', measure);
      window.clearTimeout(t);
    };
  }, [projects.length]);

  const raw = useTransform(scrollYProgress, [0, 1], [0, -shift]);
  const x = useSpring(raw, { stiffness: 90, damping: 26, restDelta: 0.001 });

  // Below lg (and under reduced-motion) this degrades to a normal swipe strip.
  const pinned = !reduced;

  return (
    <section id="work" className="bg-[var(--paper)]">
      {/* Section head */}
      <div className="mx-auto max-w-[1600px] px-5 pb-14 pt-24 md:px-10 md:pt-32">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <span className="mono bracket mb-6 block text-[var(--grey-1)]">Selected work</span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="mega text-[13vw] leading-[0.82] md:text-[7vw]">
                Things
                <br />
                I&apos;ve built
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.2} className="flex items-end gap-8">
            <p className="mono max-w-[200px] text-[var(--grey-1)]">
              {String(projects.length).padStart(2, '0')} case studies — drag or scroll sideways
            </p>
            <Link
              to="/works"
              className="group mono shrink-0 whitespace-nowrap text-[var(--ink)]"
            >
              <HoverSwap>View all →</HoverSwap>
            </Link>
          </Reveal>
        </div>
      </div>

      {/* Desktop: pinned horizontal scroll */}
      {pinned && (
        <div
          ref={ref}
          className="relative hidden lg:block"
          /* Pin for exactly as long as the track needs to travel, so one pixel
             of vertical scroll moves one pixel horizontally. */
          style={{ height: `calc(100vh + ${shift}px)` }}
        >
          <div className="sticky top-0 flex h-screen items-center overflow-hidden">
            <motion.div ref={trackRef} style={{ x }} className="flex gap-8 pl-10">
              {projects.map((p, i) => (
                <WorkCard key={p.id} project={p} idx={i} />
              ))}
              {/* End card keeps the track from ending on a hard edge */}
              <div className="flex w-[26vw] shrink-0 flex-col justify-center pr-10">
                <p className="mega mb-6 text-4xl">More in the archive.</p>
                <Link to="/works" className="group mono self-start">
                  <HoverSwap>Open archive →</HoverSwap>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Mobile / reduced-motion: native swipe strip */}
      <div
        className={`no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-6 md:px-10 ${
          pinned ? 'lg:hidden' : ''
        }`}
      >
        {projects.map((p, i) => (
          <div key={p.id} className="snap-start">
            <WorkCard project={p} idx={i} />
          </div>
        ))}
      </div>
    </section>
  );
};

/* ================================================================== *
 * SERVICES — brutalist list, each row inverts to solid ink
 * ================================================================== */

const Services: React.FC<{ services: Service[] }> = ({ services }) => (
  <section id="services" className="border-t border-[var(--hairline)] bg-[var(--paper)]">
    <div className="mx-auto max-w-[1600px] px-5 pb-24 pt-24 md:px-10 md:pt-32">
      <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Reveal>
            <span className="mono bracket mb-6 block text-[var(--grey-1)]">What I do</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mega text-[13vw] leading-[0.82] md:text-[7vw]">Services</h2>
          </Reveal>
        </div>
        <Reveal delay={0.2}>
          <Link to="/services" className="group mono whitespace-nowrap">
            <HoverSwap>Full scope →</HoverSwap>
          </Link>
        </Reveal>
      </div>

      <div className="border-t border-[var(--ink)]">
        {services.map((service, idx) => (
          <Reveal key={service.id} delay={idx * 0.06}>
            <Link
              to="/services"
              className="invert-row group flex items-center gap-5 border-b border-[var(--hairline)] py-7 md:gap-10 md:py-9"
            >
              <span className="mono invert-dim w-8 shrink-0 text-[var(--grey-2)]">
                {String(idx + 1).padStart(2, '0')}
              </span>

              <h3 className="mega flex-1 text-[7vw] leading-none md:text-[4vw]">
                {service.title}
              </h3>

              <p className="invert-dim hidden max-w-[280px] text-sm font-light leading-snug text-[var(--grey-1)] lg:block">
                {service.description}
              </p>

              <ArrowUpRight
                size={26}
                className="shrink-0 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

/* ================================================================== *
 * GALLERY — offset mosaic of candid working shots
 * ================================================================== */

const spanFor = (size: GalleryItem['size']) => {
  switch (size) {
    case 'lg': return 'md:col-span-7 aspect-[16/11]';
    case 'md': return 'md:col-span-5 aspect-[4/5]';
    default: return 'md:col-span-4 aspect-square';
  }
};

const Gallery: React.FC<{ items: GalleryItem[] }> = ({ items }) => {
  const reduced = useReducedMotion();

  return (
    <section id="gallery" data-nav-theme="dark" className="bg-[#0a0a0a] py-24 md:py-32">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <span className="mono bracket mb-6 block text-white/45">Behind the work</span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="mega text-[13vw] leading-[0.82] text-white md:text-[7vw]">
                The
                <br />
                process
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <Link to="/gallery" className="group mono whitespace-nowrap text-white/70 hover:text-white">
              <HoverSwap>Open gallery →</HoverSwap>
            </Link>
          </Reveal>
        </div>

        <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5" stagger={0.08}>
          {items.slice(0, 6).map((item, idx) => (
            <StaggerItem
              key={item.id}
              className={`${spanFor(item.size)} ${idx % 3 === 1 ? 'md:mt-12' : ''}`}
            >
              <ClipReveal
                className="h-full w-full"
                from={idx % 2 === 0 ? 'bottom' : 'left'}
                delay={idx * 0.04}
              >
                <motion.figure
                  whileHover={reduced ? undefined : { y: -6 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="group relative h-full w-full overflow-hidden bg-neutral-800"
                >
                  <img
                    src={item.image}
                    alt={item.caption}
                    loading="lazy"
                    className="h-full w-full object-cover grayscale transition-all duration-[1.1s] group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <figcaption className="mono absolute bottom-3 left-3 text-white mix-blend-difference">
                    {item.caption}
                  </figcaption>
                </motion.figure>
              </ClipReveal>
            </StaggerItem>
          ))}
        </Stagger>

        {items.length === 0 && (
          <p className="mono py-16 text-center text-white/40">No photos yet.</p>
        )}
      </div>
    </section>
  );
};

/* ================================================================== *
 * CONTACT
 * ================================================================== */

const Contact: React.FC<{ social: SocialLink[]; contact: ContactDetails }> = ({ social, contact }) => (
  <section
    id="contact"
    className="border-t border-[var(--hairline)] bg-[var(--paper)] pb-20 pt-24 md:pt-32"
  >
    <div className="mx-auto max-w-[1600px] px-5 md:px-10">
      <Reveal>
        <span className="mono bracket mb-10 block text-[var(--grey-1)]">Contact</span>
      </Reveal>

      <Reveal delay={0.1}>
        <h2 className="mega mb-16 text-[14vw] leading-[0.8] md:text-[9vw]">
          Let&apos;s
          <br />
          make{' '}
          <span
            style={{ WebkitTextStroke: '1.5px #0a0a0a', WebkitTextFillColor: 'transparent' }}
          >
            something
          </span>
        </h2>
      </Reveal>

      {/* Two columns until lg — three at this scale squeezed the email address
          into a mid-word wrap. */}
      <div className="grid grid-cols-1 gap-12 border-t border-[var(--ink)] pt-12 sm:grid-cols-2 lg:grid-cols-3">
        <Reveal>
          <p className="mono mb-4 text-[var(--grey-1)]">Email</p>
          <a
            href={`mailto:${contact.email}`}
            className="link-wipe break-words text-lg font-medium md:text-2xl"
          >
            {contact.email}
          </a>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mono mb-4 text-[var(--grey-1)]">Phone / WhatsApp</p>
          <a
            href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}
            className="link-wipe text-xl font-medium md:text-2xl"
          >
            {contact.phone}
          </a>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mono mb-4 text-[var(--grey-1)]">Elsewhere</p>
          <div className="flex flex-col gap-2">
            {(social?.length ? social : INITIAL_DATA.social).map((s) =>
              s.url ? (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-wipe w-fit text-xl font-medium md:text-2xl"
                >
                  {s.label}
                </a>
              ) : (
                <span
                  key={s.id}
                  aria-disabled="true"
                  title="Link coming soon"
                  className="w-fit cursor-default text-xl font-medium text-[var(--grey-2)] md:text-2xl"
                >
                  {s.label}
                </span>
              ),
            )}
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.3} className="mt-20">
        <Magnetic strength={0.25} className="inline-block">
          <a
            href={`mailto:${contact.email}?subject=Project%20enquiry`}
            className="group flex items-center gap-5 rounded-full bg-[var(--ink)] py-5 pl-10 pr-4 transition-colors duration-500 hover:bg-[var(--grey-1)]"
          >
            <span className="mono text-[var(--paper)]">Start a project</span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--paper)]">
              <ArrowUpRight size={20} className="text-[var(--ink)]" />
            </span>
          </a>
        </Magnetic>
      </Reveal>
    </div>
  </section>
);

/* ================================================================== *
 * PAGE
 * ================================================================== */

const LandingPage: React.FC<LandingPageProps> = ({ data }) => {
  const projects = Array.isArray(data?.projects) ? data.projects.filter(Boolean) : [];
  const services = Array.isArray(data?.services) ? data.services.filter(Boolean) : [];
  const gallery = Array.isArray(data?.gallery) ? data.gallery.filter(Boolean) : [];
  const ticker = Array.isArray(data?.ticker) ? data.ticker.filter(Boolean) : [];
  const disciplines = Array.isArray(data?.disciplines) ? data.disciplines.filter(Boolean) : [];

  return (
    <div className="bg-[var(--paper)]">
      <Seo
        defaults={data.seo}
        data={data}
        path="/"
        exactTitle={homeTitle(data)}
        description={data.tagline}
      />
      <Hero data={data} />
      <Ticker items={ticker} />
      <Disciplines disciplines={disciplines} />
      <Work projects={projects} />
      <Services services={services} />
      <Gallery items={gallery} />
      <Contact social={data.social} contact={data.contact} />
    </div>
  );
};

export default LandingPage;
