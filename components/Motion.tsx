import React, { useRef, useEffect, useState } from 'react';
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useReducedMotion,
  animate,
  type Transition,
  type Variants,
} from 'motion/react';

/**
 * Shared motion vocabulary for the site.
 *
 * Every page composes these instead of hand-rolling transitions, so the whole
 * portfolio moves with one personality: soft, weighty, never bouncy.
 */

/** The house easing curve — matches the cubic-bezier used across index.html. */
export const EASE = [0.16, 1, 0.3, 1] as const;

export const SPRING: Transition = { type: 'spring', stiffness: 140, damping: 20, mass: 0.6 };

/* ------------------------------------------------------------------ *
 * Reveal — the workhorse. Fades + lifts content as it enters view.
 * ------------------------------------------------------------------ */

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

// Takes a widened `string`: motion.div's own prop union also carries a
// `direction` attribute, so the value arriving here isn't narrowed to Direction.
const offsetFor = (direction: string, distance: number) => {
  switch (direction) {
    case 'up': return { y: distance };
    case 'down': return { y: -distance };
    case 'left': return { x: distance };
    case 'right': return { x: -distance };
    default: return {};
  }
};

/** motion.div already declares `direction`, so drop it before redeclaring. */
type DivMotionProps = Omit<React.ComponentProps<typeof motion.div>, 'direction'>;

interface RevealProps extends DivMotionProps {
  delay?: number;
  duration?: number;
  direction?: Direction;
  distance?: number;
  once?: boolean;
  amount?: number;
  blur?: boolean;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  duration = 0.8,
  direction = 'up',
  distance = 28,
  once = true,
  amount = 0.2,
  blur = false,
  ...rest
}) => {
  const reduced = useReducedMotion();

  if (reduced) return <motion.div {...rest}>{children}</motion.div>;

  return (
    <motion.div
      initial={{ opacity: 0, ...offsetFor(direction, distance), ...(blur ? { filter: 'blur(8px)' } : {}) }}
      whileInView={{ opacity: 1, x: 0, y: 0, ...(blur ? { filter: 'blur(0px)' } : {}) }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ *
 * Stagger — parent/child pair for cascading lists and grids.
 * ------------------------------------------------------------------ */

interface StaggerProps extends React.ComponentProps<typeof motion.div> {
  stagger?: number;
  delay?: number;
  amount?: number;
  once?: boolean;
}

export const Stagger: React.FC<StaggerProps> = ({
  children,
  stagger = 0.09,
  delay = 0,
  amount = 0.15,
  once = true,
  ...rest
}) => (
  <motion.div
    initial="hidden"
    whileInView="show"
    viewport={{ once, amount }}
    variants={{
      hidden: {},
      show: { transition: { staggerChildren: stagger, delayChildren: delay } },
    }}
    {...rest}
  >
    {children}
  </motion.div>
);

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

export const StaggerItem: React.FC<React.ComponentProps<typeof motion.div>> = ({
  children,
  ...rest
}) => {
  const reduced = useReducedMotion();
  return (
    <motion.div variants={reduced ? undefined : staggerItemVariants} {...rest}>
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ *
 * SplitText — masked, word-by-word headline entrance.
 * ------------------------------------------------------------------ */

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  /** Words drawn as outlines instead of solids, matched case-insensitively. */
  accent?: string[];
  as?: React.ElementType;
}

/**
 * Emphasis in a monochrome system can't come from hue, so accented words are
 * rendered as outlined type — the same device the hero and footer use.
 */
const OUTLINE_STYLE: React.CSSProperties = {
  // currentColor so the same component works on paper and on ink panels.
  WebkitTextStroke: '1.2px currentColor',
  WebkitTextFillColor: 'transparent',
};

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 0,
  stagger = 0.045,
  accent = [],
  as: Tag = 'span',
}) => {
  const reduced = useReducedMotion();
  const words = text.split(' ');
  const accentSet = new Set(accent.map((w) => w.toLowerCase().replace(/[.,!?]/g, '')));

  if (reduced) {
    return (
      <Tag className={className}>
        {words.map((word, i) => (
          <span
            key={i}
            style={accentSet.has(word.toLowerCase().replace(/[.,!?]/g, '')) ? OUTLINE_STYLE : undefined}
          >
            {word}{i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={className}>
      <motion.span
        className="inline"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      >
        {words.map((word, i) => {
          const bare = word.toLowerCase().replace(/[.,!?]/g, '');
          return (
            <span
              key={i}
              // The clip is what makes words rise out of nothing rather than fade.
              className="inline-block overflow-hidden align-bottom"
              style={{ paddingBottom: '0.12em', marginBottom: '-0.12em' }}
            >
              <motion.span
                className="inline-block"
                style={accentSet.has(bare) ? OUTLINE_STYLE : undefined}
                variants={{
                  hidden: { y: '110%', opacity: 0 },
                  show: { y: '0%', opacity: 1, transition: { duration: 0.9, ease: EASE } },
                }}
              >
                {word}
              </motion.span>
              {i < words.length - 1 && <span>&nbsp;</span>}
            </span>
          );
        })}
      </motion.span>
    </Tag>
  );
};

/* ------------------------------------------------------------------ *
 * Magnetic — element drifts toward the cursor, then springs home.
 * ------------------------------------------------------------------ */

interface MagneticProps extends React.ComponentProps<typeof motion.div> {
  strength?: number;
}

export const Magnetic: React.FC<MagneticProps> = ({ children, strength = 0.35, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);

  const handleMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div ref={ref} onMouseMove={handleMove} onMouseLeave={reset} style={{ x, y }} {...rest}>
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ *
 * TiltCard — subtle 3D parallax on pointer move.
 * ------------------------------------------------------------------ */

interface TiltCardProps extends React.ComponentProps<typeof motion.div> {
  max?: number;
}

export const TiltCard: React.FC<TiltCardProps> = ({ children, max = 7, style, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const rx = useSpring(useMotionValue(0), { stiffness: 180, damping: 22 });
  const ry = useSpring(useMotionValue(0), { stiffness: 180, damping: 22 });

  const handleMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * max * 2);
    rx.set(-py * max * 2);
  };

  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200, transformStyle: 'preserve-3d', ...style }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ *
 * Parallax — scroll-linked vertical drift.
 * ------------------------------------------------------------------ */

interface ParallaxProps extends React.ComponentProps<typeof motion.div> {
  /** Pixels of travel across the element's full scroll pass. Negative moves up. */
  offset?: number;
}

export const Parallax: React.FC<ParallaxProps> = ({ children, offset = -60, style, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);

  return (
    <motion.div ref={ref} style={reduced ? style : { y, ...style }} {...rest}>
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ *
 * Counter — counts up to a value when scrolled into view.
 * ------------------------------------------------------------------ */

interface CounterProps {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

export const Counter: React.FC<CounterProps> = ({ to, suffix = '', duration = 1.8, className }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setValue(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => setValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, to, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
};

/* ------------------------------------------------------------------ *
 * Marquee — seamless infinite ticker.
 * ------------------------------------------------------------------ */

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number;
  reverse?: boolean;
  className?: string;
}

export const Marquee: React.FC<MarqueeProps> = ({ children, speed = 30, reverse = false, className = '' }) => {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={`flex overflow-hidden ${className}`}>{children}</div>;
  }

  return (
    <div className={`flex overflow-hidden ${className}`}>
      {/* Two identical tracks: the first scrolls out exactly as the second scrolls in. */}
      {[0, 1].map((track) => (
        <motion.div
          key={track}
          className="flex shrink-0 items-center"
          aria-hidden={track === 1}
          animate={{ x: reverse ? ['-100%', '0%'] : ['0%', '-100%'] }}
          transition={{ duration: speed, ease: 'linear', repeat: Infinity }}
        >
          {children}
        </motion.div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * ScrollProgress — thin accent bar pinned to the top of the viewport.
 * ------------------------------------------------------------------ */

export const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-[var(--ink)] origin-left z-[200]"
      style={{ scaleX }}
      aria-hidden
    />
  );
};

/* ------------------------------------------------------------------ *
 * PageShell — wraps each route for a consistent enter transition.
 * ------------------------------------------------------------------ */

export const PageShell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      /* `exit` must always be defined. Passing undefined under reduced motion
         left AnimatePresence mode="wait" with nothing to await, so it never
         fired onExitComplete and the next route never mounted — the site
         became unnavigable. A zero-duration exit still resolves. */
      exit={{ opacity: 0, y: reduced ? 0 : -12 }}
      transition={{ duration: reduced ? 0 : 0.6, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ *
 * SectionLabel — the recurring "— LABEL" eyebrow above section titles.
 * ------------------------------------------------------------------ */

export const SectionLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <motion.div
      className="h-px bg-current origin-left opacity-40"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: EASE }}
      style={{ width: 48 }}
    />
    <span className="mono">{children}</span>
  </div>
);
