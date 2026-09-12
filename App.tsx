
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ScrollProgress } from './components/Motion';
import { Cursor, PageCurtain } from './components/MotionExtras';
import SmoothScroll, { smoothScrollTo } from './components/SmoothScroll';
import { INITIAL_DATA } from './constants';
import { sanitizePortfolioData } from './lib/sanitize';
import { fetchContent } from './services/contentApi';
import { PortfolioData } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

/**
 * The landing page is imported eagerly; every other route is a lazy chunk.
 *
 * `/` is the page the whole local-search effort points at, so it must not pay
 * a second network round trip to fetch its own code — bundling it with the
 * entry keeps its LCP a single request. Everything else is split out, which
 * takes lottie-react (ServicesPage), react-markdown + remark-gfm (the blog and
 * service detail pages), the lucide icon set (VibePage's DynamicIcon) and the
 * entire admin dashboard out of what a first-time visitor downloads.
 */
import LandingPage from './pages/LandingPage';

const WorksPage = lazy(() => import('./pages/WorksPage'));
const WorkDetailPage = lazy(() => import('./pages/WorkDetailPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'));
const VibePage = lazy(() => import('./pages/VibePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'));
const BlogCategoryPage = lazy(() => import('./pages/BlogCategoryPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

/**
 * Shown while a route chunk is in flight.
 *
 * It has to be a spacer and nothing else. React replaces the prerendered
 * crawler markup inside #root the moment it mounts (index.tsx calls
 * createRoot().render(), not hydrateRoot()), so a fallback carrying its own
 * copy or a spinner would be the only thing a JS-executing crawler sees for
 * the length of that fetch — and a spinner is worse than blank, because it
 * reads as "loading" rather than "nothing here yet". A crawler that executes
 * JS waits for the network to settle and then sees the real page; one that
 * does not never runs React at all and keeps the prerendered markup.
 *
 * The height keeps the footer below the fold so it does not jump up and back
 * down, and in practice PageCurtain — a full-viewport ink panel that lifts
 * over 0.75s on every mount and route change — is painted on top of this, so
 * the swap is not visible at all on a normal connection.
 */
const RouteFallback = () => <div className="min-h-screen" aria-hidden />;


const App: React.FC = () => {
  const [data, setData] = useState<PortfolioData>(INITIAL_DATA);

  const location = useLocation();

  const updateData = useCallback((newData: PortfolioData) => {
    const sanitized = sanitizePortfolioData(newData);
    setData(sanitized);
  }, []);

  // Published content is the source of truth. INITIAL_DATA renders immediately
  // and stays if the request fails, so the site is never blank.
  //
  // Deliberately not cached in localStorage: a stored copy used to make
  // constants.tsx edits look like no-ops until the key was cleared, and with a
  // real backend the same cache would hide published changes from visitors.
  useEffect(() => {
    let cancelled = false;
    fetchContent().then((published) => {
      if (!cancelled && published) setData(published);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
      <Route path="/about" element={<AboutPage data={data} />} />
      <Route path="/contact" element={<ContactPage data={data} />} />
      <Route path="/works" element={<WorksPage data={data} />} />
      <Route path="/works/:id" element={<WorkDetailPage data={data} />} />
      <Route path="/services" element={<ServicesPage data={data} />} />
      <Route path="/services/:slug" element={<ServiceDetailPage data={data} />} />
      <Route path="/vibe" element={<VibePage data={data} />} />
      <Route path="/blog" element={<BlogPage data={data} />} />
      {/* Before /blog/:slug — otherwise "category" is read as a post slug. */}
      <Route path="/blog/category/:slug" element={<BlogCategoryPage data={data} />} />
      <Route path="/blog/:slug" element={<BlogDetailPage data={data} />} />
      <Route path="/gallery" element={<GalleryPage data={data} />} />
      {/* Not linked in the nav — the admin panel is being built separately. */}
      <Route path="/dashboard" element={<DashboardPage data={data} updateData={updateData} />} />
      <Route path="*" element={<NotFoundPage />} />
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
        <Suspense fallback={<RouteFallback />}>{routes}</Suspense>
      </main>
      <Footer data={data} />
    </div>
  );
};

export default App;
