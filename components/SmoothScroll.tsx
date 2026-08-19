import { useEffect } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from 'motion/react';

/**
 * Inertial smooth scrolling.
 *
 * Lenis drives the real scroll position (rather than transforming a wrapper),
 * so motion's `useScroll` and every IntersectionObserver on the page keep
 * working untouched. Disabled outright under `prefers-reduced-motion`, where
 * hijacking the scroll would be actively unpleasant.
 */
const SmoothScroll: React.FC = () => {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.05,
      // Gentle exponential ease-out — no bounce at the end of a fling.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
    });

    // Expose it so in-page jumps can scroll through Lenis instead of fighting it.
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    // The CSS `scroll-behavior: smooth` on <html> conflicts with Lenis.
    const root = document.documentElement;
    const previousBehaviour = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
      root.style.scrollBehavior = previousBehaviour;
    };
  }, [reduced]);

  return null;
};

/**
 * Scrolls to an element or offset, routing through Lenis when it's active.
 *
 * Calling `window.scrollTo` directly while Lenis is running leaves Lenis's
 * internal target stale, which can snap the page back mid-gesture.
 */
export const smoothScrollTo = (
  target: HTMLElement | number,
  { offset = 0, immediate = false }: { offset?: number; immediate?: boolean } = {},
) => {
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (lenis) {
    lenis.scrollTo(target, { offset, immediate });
    return;
  }
  const top =
    typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: top + offset, behavior: 'auto' });
};

export default SmoothScroll;
