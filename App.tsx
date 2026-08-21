
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { ScrollProgress } from './components/Motion';
import { Cursor, PageCurtain, HoverSwap } from './components/MotionExtras';
import SmoothScroll, { smoothScrollTo } from './components/SmoothScroll';
import { useNavTheme } from './components/useNavTheme';
import { INITIAL_DATA } from './constants';
import { sanitizePortfolioData } from './lib/sanitize';
import { PortfolioData } from './types';
import LandingPage from './pages/LandingPage';
import WorksPage from './pages/WorksPage';
import WorkDetailPage from './pages/WorkDetailPage';
import ServicesPage from './pages/ServicesPage';
import VibePage from './pages/VibePage';
import DashboardPage from './pages/DashboardPage';
import BlogPage from './pages/BlogPage';
import GalleryPage from './pages/GalleryPage';

const Navbar: React.FC<{ data: PortfolioData }> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Work', path: '/works' },
    { name: 'Services', path: '/services' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Vibe', path: '/vibe' },
    { name: 'Blog', path: '/blog' },
  ];

  const name = data?.name || INITIAL_DATA.name;
  const company = data?.company || INITIAL_DATA.company;

  // Light or dark type, decided by whatever surface is under the bar.
  const navTheme = useNavTheme(location.pathname);

  // Close the menu whenever the route changes, so a link tap doesn't leave the
  // overlay hanging over the new page.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Lock the page behind the open menu.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Fixed bar: wordmark + menu trigger, nothing else, no scroll morphing.
          Colour comes from hit-testing the surface behind it (see useNavTheme)
          rather than mix-blend-mode, which was silently isolated by this
          wrapper's own stacking context and left the type white-on-white. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-20 md:h-24">
        <div
          className={`mx-auto flex h-full max-w-[1600px] items-center justify-between px-5 transition-colors duration-500 md:px-10 ${
            navTheme === 'dark' ? 'text-white' : 'text-[var(--ink)]'
          }`}
        >
          <Link to="/" className="pointer-events-auto flex items-baseline gap-3">
            <span className="mono font-bold">{name.toUpperCase()}</span>
            <span className="mono hidden opacity-50 sm:inline">Design &amp; Marketing</span>
          </Link>

          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
            aria-expanded={isOpen}
            className="group pointer-events-auto flex items-center gap-3"
          >
            <span className="mono hidden sm:inline">
              <HoverSwap>Menu</HoverSwap>
            </span>
            <Menu size={22} className="transition-transform duration-500 group-hover:rotate-90" />
          </button>
        </div>
      </div>

      {/* Full-screen menu.
          Rendered directly rather than through AnimatePresence: in testing,
          AnimatePresence's exit-completion signal proved unreliable in this
          environment (verified with a clean reinstall and the exact pinned
          motion version), which left the menu stuck open with no way to
          close it. Entrance still animates on mount; it just disappears
          immediately on close instead of fading out. */}
      {isOpen && (
          <motion.div
            className="fixed inset-0 z-[130] flex flex-col overflow-y-auto bg-[#0a0a0a] px-5 py-6 md:px-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
              <div className="flex items-center justify-between">
                <span className="mono bracket text-white/45">Menu</span>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors duration-300 hover:bg-white hover:text-[#0a0a0a]"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="mt-10 flex flex-col md:mt-14">
                {navLinks.map((link, i) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center gap-4 border-b border-white/10 py-3 md:gap-8 md:py-4"
                  >
                    <span className="mono w-6 shrink-0 text-white/35">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="mega text-[11vw] leading-none text-white transition-opacity duration-300 group-hover:opacity-55 md:text-[6vw]">
                      {link.name}
                    </span>
                  </Link>
                ))}
              </nav>

              {/* Credential + contact live in the menu so they're never buried */}
              <div className="mt-auto grid grid-cols-1 gap-8 pt-12 sm:grid-cols-3">
                <div>
                  <p className="mono mb-3 text-white/40">Currently</p>
                  <p className="text-sm font-light leading-relaxed text-white/75">
                    {company.role} at{' '}
                    <span className="font-medium text-white">{company.name}</span> — design,
                    branding &amp; full-service marketing.
                  </p>
                </div>
                <div>
                  <p className="mono mb-3 text-white/40">Email</p>
                  <a
                    href="mailto:ashimkaflebiz@gmail.com"
                    className="mono break-all text-white/75 hover:text-white"
                  >
                    ashimkaflebiz@gmail.com
                  </a>
                </div>
                <div className="sm:justify-self-end">
                  <a
                    href="mailto:ashimkaflebiz@gmail.com?subject=Project%20enquiry"
                    className="mono inline-block bg-white px-8 py-4 text-[#0a0a0a] transition-colors duration-300 hover:bg-white/80"
                  >
                    Start a project
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
      )}
    </>
  );
};

const Footer: React.FC<{ data: PortfolioData }> = ({ data }) => {
  const name = data?.name || INITIAL_DATA.name;
  const company = data?.company || INITIAL_DATA.company;

  return (
    <footer data-nav-theme="dark" className="bg-[#0a0a0a] px-5 pb-10 pt-20 md:px-10">
      <div className="mx-auto max-w-[1600px]">
        {/* Oversized wordmark, scaled from the name's length so it fills the
            measure edge-to-edge without clipping a letter off. */}
        <div className="overflow-hidden border-b border-white/10 pb-6">
          <p
            className="mega whitespace-nowrap leading-[0.78] text-white"
            style={{
              // ~0.62em average advance per uppercase glyph in Inter Tight.
              fontSize: `min(19vw, ${(92 / Math.max(name.length * 0.62, 1)).toFixed(2)}vw)`,
            }}
          >
            {name.toUpperCase()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          <div>
            <p className="mono mb-4 text-white/40">Navigate</p>
            <div className="flex flex-col gap-2">
              {[
                { n: 'Work', p: '/works' },
                { n: 'Services', p: '/services' },
                { n: 'Gallery', p: '/gallery' },
              ].map((l) => (
                <Link key={l.p} to={l.p} className="mono text-white/75 hover:text-white">
                  {l.n}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mono mb-4 text-white/40">More</p>
            <div className="flex flex-col gap-2">
              {[
                { n: 'Vibe', p: '/vibe' },
                { n: 'Journal', p: '/blog' },
              ].map((l) => (
                <Link key={l.p} to={l.p} className="mono text-white/75 hover:text-white">
                  {l.n}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mono mb-4 text-white/40">Social</p>
            <div className="flex flex-col gap-2">
              {[
                { n: 'LinkedIn', h: 'https://www.linkedin.com/in/ashim-kafle-676a312a5/' },
                // TODO: real URLs. A bare "#" href would hijack HashRouter and
                // navigate to an unmatched route, so placeholders stay inert.
                { n: 'Dribbble', h: '#' },
                { n: 'Instagram', h: '#' },
              ].map((s) =>
                s.h === '#' ? (
                  <span
                    key={s.n}
                    aria-disabled="true"
                    title="Link coming soon"
                    className="mono cursor-default text-white/35"
                  >
                    {s.n}
                  </span>
                ) : (
                  <a
                    key={s.n}
                    href={s.h}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono text-white/75 hover:text-white"
                  >
                    {s.n}
                  </a>
                ),
              )}
            </div>
          </div>

          <div>
            <p className="mono mb-4 text-white/40">Contact</p>
            <a
              href="mailto:ashimkaflebiz@gmail.com"
              className="mono block break-all text-white/75 hover:text-white"
            >
              ashimkaflebiz@gmail.com
            </a>
          </div>
        </div>

        {/* Current role sits above the fine print so it reads as a credential */}
        <div className="border-t border-white/10 py-8">
          <p className="mono mb-3 text-white/40">Currently</p>
          <p className="max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl">
            {company.role} at <span className="font-medium text-white">{company.name}</span> — a
            creative agency delivering design, branding and full-service marketing.
          </p>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-white/10 pt-6 md:flex-row">
          <p className="mono text-white/35">© {new Date().getFullYear()} {name}</p>
          <p className="mono text-white/35">Design &amp; Marketing — Kathmandu, Nepal</p>
        </div>
      </div>
    </footer>
  );
};

const App: React.FC = () => {
  const [data, setData] = useState<PortfolioData>(() => {
    try {
      const saved = localStorage.getItem('portfolio_data');
      if (saved && saved !== "null" && saved !== "undefined") {
        const parsed = JSON.parse(saved);
        return sanitizePortfolioData(parsed);
      }
    } catch (e) {
      console.error("Critical error during data hydration:", e);
    }
    return INITIAL_DATA;
  });

  const location = useLocation();

  const updateData = useCallback((newData: PortfolioData) => {
    const sanitized = sanitizePortfolioData(newData);
    setData(sanitized);
  }, []);

  useEffect(() => {
    // Only save if data is valid
    if (data && typeof data === 'object') {
      localStorage.setItem('portfolio_data', JSON.stringify(data));
    }
  }, [data]);

  useEffect(() => {
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach((el) => observer.observe(el));

    // Instant, not smooth: a smooth scroll fights the route exit animation.
    // Routed through Lenis so its internal target resets too.
    smoothScrollTo(0, { immediate: true });

    return () => reveals.forEach((el) => observer.unobserve(el));
  }, [location.pathname, data]);

  if (!data) return null;

  const routes = (
    <Routes location={location}>
      <Route path="/" element={<LandingPage data={data} />} />
      <Route path="/works" element={<WorksPage data={data} />} />
      <Route path="/works/:id" element={<WorkDetailPage data={data} />} />
      <Route path="/services" element={<ServicesPage data={data} />} />
      <Route path="/vibe" element={<VibePage data={data} />} />
      <Route path="/blog" element={<BlogPage data={data} />} />
      <Route path="/gallery" element={<GalleryPage data={data} />} />
      {/* Not linked in the nav — the admin panel is being built separately. */}
      <Route path="/dashboard" element={<DashboardPage data={data} updateData={updateData} />} />
    </Routes>
  );

  return (
    <div className="min-h-screen bg-[var(--paper)] selection:bg-[var(--ink)] selection:text-[var(--paper)]">
      <SmoothScroll />
      <Cursor />
      <PageCurtain routeKey={location.pathname} />
      <ScrollProgress />
      <Navbar data={data} />
      <main>
        {/* Routes render directly rather than through an AnimatePresence
            mode="wait" wrapper. That pattern relies on the outgoing page
            signalling exit-complete before the next one mounts — in testing
            that signal proved unreliable (verified with a clean reinstall,
            the exact pinned motion version, and StrictMode both on and off),
            which froze the site on whatever page happened to load first.
            Each page's own entrance animation (Reveal/Stagger/PageShell,
            all mount-triggered, not exit-dependent) still plays normally, and
            PageCurtain above provides the route-change transition — it
            remounts on `key` change without needing an exit callback. */}
        {routes}
      </main>
      <Footer data={data} />
    </div>
  );
};

export default App;
