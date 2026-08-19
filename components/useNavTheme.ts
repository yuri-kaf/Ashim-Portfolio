import { useEffect, useState } from 'react';

/**
 * Works out whether the fixed header is currently sitting over a dark surface,
 * so its type can flip between paper and ink.
 *
 * This replaces a `mix-blend-mode: difference` header. That approach silently
 * failed: the header's wrapper is `position: fixed` with a z-index, which
 * creates a stacking context and isolates the blend from the page behind it —
 * so the type stayed pure white and vanished against the light subpage
 * mastheads.
 *
 * Instead we hit-test what's actually painted behind the header and look for an
 * ancestor marked `data-nav-theme="dark"`.
 */
export type NavTheme = 'dark' | 'light';

/**
 * @param routeKey Changing this re-samples — a route swap replaces the whole
 * page under a stationary header without firing a scroll event.
 */
export const useNavTheme = (routeKey?: string): NavTheme => {
  const [theme, setTheme] = useState<NavTheme>('light');

  useEffect(() => {
    let frame = 0;

    const sample = () => {
      frame = 0;

      // Probe just below the header's vertical centre, at a third across —
      // clear of the wordmark and the menu button. The header wrapper is
      // pointer-events:none, so it doesn't intercept the hit test.
      const x = Math.round(window.innerWidth / 3);
      const y = 40;

      const el = document.elementFromPoint(x, y);
      if (!el) return;

      const marked = el.closest('[data-nav-theme]');
      setTheme(marked?.getAttribute('data-nav-theme') === 'dark' ? 'dark' : 'light');
    };

    const onScroll = () => {
      // Coalesce to one measurement per frame.
      if (!frame) frame = requestAnimationFrame(sample);
    };

    sample();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    /* A route swap doesn't paint immediately: AnimatePresence mode="wait" holds
       the outgoing page for its exit (~0.6s) before the new one mounts, and the
       curtain runs over the top of that. A single delayed read lands on the old
       page, so poll briefly until things have settled. */
    const burst = window.setInterval(sample, 120);
    const stopBurst = window.setTimeout(() => window.clearInterval(burst), 1600);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.clearInterval(burst);
      window.clearTimeout(stopBurst);
    };
  }, [routeKey]);

  return theme;
};
