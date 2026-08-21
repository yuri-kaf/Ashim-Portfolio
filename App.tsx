
import React, { useState, useEffect, useCallback } from 'react';
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
import LandingPage from './pages/LandingPage';
import WorksPage from './pages/WorksPage';
import WorkDetailPage from './pages/WorkDetailPage';
import ServicesPage from './pages/ServicesPage';
import VibePage from './pages/VibePage';
import DashboardPage from './pages/DashboardPage';
import BlogPage from './pages/BlogPage';
import GalleryPage from './pages/GalleryPage';
import NotFoundPage from './pages/NotFoundPage';


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
      <Route path="/works" element={<WorksPage data={data} />} />
      <Route path="/works/:id" element={<WorkDetailPage data={data} />} />
      <Route path="/services" element={<ServicesPage data={data} />} />
      <Route path="/vibe" element={<VibePage data={data} />} />
      <Route path="/blog" element={<BlogPage data={data} />} />
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
        {routes}
      </main>
      <Footer data={data} />
    </div>
  );
};

export default App;
