import React, { useEffect, useState } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useMotionValue,
  useReducedMotion,
} from 'motion/react';
import { EASE } from './Motion';

/**
 * Second tier of the motion system: masks, per-character type, ambient infinite
 * loops, scroll-reactive marquees, the pointer follower and the route curtain.
 *
 * Kept separate from Motion.tsx so the core reveal/stagger vocabulary stays
 * easy to read. Every export degrades to a static render under
 * `prefers-reduced-motion`.
 */

/* ------------------------------------------------------------------ *
 * ClipReveal — content is unmasked rather than faded.
 * ------------------------------------------------------------------ */

export const ClipReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  /** Edge the mask retreats towards. */
  from?: 'bottom' | 'top' | 'left' | 'right';
}> = ({ children, className = '', delay = 0, duration = 1.1, from = 'bottom' }) => {
  const reduced = useReducedMotion();

  const closed = {
    bottom: 'inset(100% 0% 0% 0%)',
    top: 'inset(0% 0% 100% 0%)',
    left: 'inset(0% 100% 0% 0%)',
    right: 'inset(0% 0% 0% 100%)',
  }[from];

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ clipPath: closed }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ *
 * CharReveal — per-character rise. Use on short strings only.
 * ------------------------------------------------------------------ */

export const CharReveal: React.FC<{
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: React.ElementType;
}> = ({ text, className = '', delay = 0, stagger = 0.028, as: Tag = 'span' }) => {
  const reduced = useReducedMotion();

  if (reduced) return <Tag className={className}>{text}</Tag>;

  return (
    <Tag className={className} aria-label={text}>
      <motion.span
        className="inline-flex flex-wrap"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: stagger, delayChildren: delay } },
        }}
        aria-hidden
      >
        {text.split('').map((char, i) => (
          <motion.span
            key={i}
            className="inline-block"
            variants={{
              hidden: { y: '0.7em', opacity: 0 },
              show: { y: 0, opacity: 1, transition: { duration: 0.7, ease: EASE } },
            }}
          >
            {char === ' ' ? ' ' : char}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
};

/* ------------------------------------------------------------------ *
 * Float / Pulse — infinite ambient loops.
 * ------------------------------------------------------------------ */

export const Float: React.FC<{
  children: React.ReactNode;
  className?: string;
  distance?: number;
  duration?: number;
  delay?: number;
}> = ({ children, className = '', distance = 12, duration = 6, delay = 0 }) => {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      animate={{ y: [0, -distance, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
};

/** Slow breathing dot — availability indicators, idle states. */
export const Pulse: React.FC<{ className?: string }> = ({ className = '' }) => {
  const reduced = useReducedMotion();
  if (reduced) return <span className={className} />;

  return (
    <motion.span
      className={className}
      animate={{ opacity: [1, 0.3, 1], scale: [1, 0.75, 1] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
};

/* ------------------------------------------------------------------ *
 * VelocityMarquee — infinite ticker that shears with scroll momentum.
 * ------------------------------------------------------------------ */

export const VelocityMarquee: React.FC<{
  children: React.ReactNode;
  baseSpeed?: number;
  reverse?: boolean;
  className?: string;
}> = ({ children, baseSpeed = 34, reverse = false, className = '' }) => {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { stiffness: 280, damping: 60 });
  // Fast scrolling shears the type — reads as momentum rather than a glitch.
  const skewY = useTransform(smooth, [-2600, 0, 2600], [-5, 0, 5], { clamp: true });

  if (reduced) {
    return <div className={`flex overflow-hidden ${className}`}>{children}</div>;
  }

  return (
    <motion.div className={`flex overflow-hidden ${className}`} style={{ skewY }}>
      {[0, 1].map((track) => (
        <motion.div
          key={track}
          className="flex shrink-0 items-center"
          aria-hidden={track === 1}
          animate={{ x: reverse ? ['-100%', '0%'] : ['0%', '-100%'] }}
          transition={{ duration: baseSpeed, ease: 'linear', repeat: Infinity }}
        >
          {children}
        </motion.div>
      ))}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ *
 * Cursor — dot trailing the pointer, swelling over interactive targets.
 * ------------------------------------------------------------------ */

export const Cursor: React.FC = () => {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useSpring(useMotionValue(-100), { stiffness: 750, damping: 40, mass: 0.3 });
  const y = useSpring(useMotionValue(-100), { stiffness: 750, damping: 40, mass: 0.3 });

  useEffect(() => {
    // Pointer-follow is meaningless on touch and unhelpful under reduced motion.
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return;

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const el = e.target as HTMLElement | null;
      setActive(Boolean(el?.closest('a, button, [role="button"], input, textarea, select')));
    };
    const onLeave = () => setVisible(false);

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [reduced, x, y]);

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[300] hidden rounded-full bg-white md:block"
      style={{
        x,
        y,
        // difference keeps it legible on both paper and ink surfaces
        mixBlendMode: 'difference',
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{
        width: active ? 44 : 10,
        height: active ? 44 : 10,
        opacity: visible ? 1 : 0,
      }}
      transition={{ duration: 0.26, ease: EASE }}
    />
  );
};

/* ------------------------------------------------------------------ *
 * PageCurtain — ink panel that lifts away on every route change.
 * ------------------------------------------------------------------ */

export const PageCurtain: React.FC<{ routeKey: string }> = ({ routeKey }) => {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <motion.div
      key={routeKey}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[250] origin-top bg-[#0a0a0a]"
      initial={{ scaleY: 1 }}
      animate={{ scaleY: 0 }}
      transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
    />
  );
};

/* ------------------------------------------------------------------ *
 * ScrollHint — infinite nudge showing the page continues.
 * ------------------------------------------------------------------ */

export const ScrollHint: React.FC<{ className?: string; label?: string }> = ({
  className = '',
  label = 'Scroll',
}) => {
  const reduced = useReducedMotion();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="mono opacity-50">{label}</span>
      <div className="relative h-8 w-px overflow-hidden bg-current opacity-25">
        {!reduced && (
          <motion.div
            className="absolute inset-x-0 h-3 bg-current"
            animate={{ y: [-12, 32] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * HoverSwap — label slides out while a duplicate slides in.
 *
 * Driven by CSS `group-hover` rather than motion variants, so it works under
 * any parent — including react-router's <Link>, which would reject motion's
 * `whileHover`/`initial` props as unknown DOM attributes. The parent only needs
 * the `group` class.
 * ------------------------------------------------------------------ */

export const HoverSwap: React.FC<{ children: string; className?: string }> = ({
  children,
  className = '',
}) => (
  <span className={`relative inline-block overflow-hidden align-bottom ${className}`}>
    <span className="inline-block transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-[105%] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
      {children}
    </span>
    <span
      aria-hidden
      className="absolute left-0 top-0 inline-block translate-y-[105%] transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 motion-reduce:hidden"
    >
      {children}
    </span>
  </span>
);

/* ------------------------------------------------------------------ *
 * ScrollScale — element grows slightly as it crosses the viewport.
 * ------------------------------------------------------------------ */

export const ScrollScale: React.FC<{
  children: React.ReactNode;
  className?: string;
  from?: number;
  to?: number;
}> = ({ children, className = '', from = 0.92, to = 1 }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const scale = useTransform(scrollYProgress, [0, 1], [from, to]);
  const smooth = useSpring(scale, { stiffness: 120, damping: 30 });

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduced ? undefined : { scale: smooth }}>{children}</motion.div>
    </div>
  );
};
