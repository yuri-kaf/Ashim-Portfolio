import React, { useState, useEffect } from 'react';
import { DEFAULT_DATA } from '../lib/defaults.js';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { HoverSwap } from './MotionExtras';
import { useNavTheme } from './useNavTheme';
import { INITIAL_DATA } from '../constants';
import { PortfolioData } from '../types';

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
  const email = data?.contact?.email || DEFAULT_DATA.contact.email;
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
                    href={`mailto:${email}`}
                    className="mono break-all text-white/75 hover:text-white"
                  >
                    {email}
                  </a>
                </div>
                <div className="sm:justify-self-end">
                  <a
                    href={`mailto:${email}?subject=Project%20enquiry`}
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

export default Navbar;
