import React from 'react';
import { DEFAULT_DATA } from '../lib/defaults.js';
import { Link } from 'react-router-dom';
import { INITIAL_DATA } from '../constants';
import { PortfolioData } from '../types';

const Footer: React.FC<{ data: PortfolioData }> = ({ data }) => {
  const name = data?.name || INITIAL_DATA.name;
  const email = data?.contact?.email || DEFAULT_DATA.contact.email;
  const company = data?.company || INITIAL_DATA.company;
  const social = data?.social?.length ? data.social : INITIAL_DATA.social;

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
              {social.map((s) =>
                s.url ? (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono text-white/75 hover:text-white"
                  >
                    {s.label}
                  </a>
                ) : (
                  <span
                    key={s.id}
                    aria-disabled="true"
                    title="Link coming soon"
                    className="mono cursor-default text-white/35"
                  >
                    {s.label}
                  </span>
                ),
              )}
            </div>
          </div>

          <div>
            <p className="mono mb-4 text-white/40">Contact</p>
            <a
              href={`mailto:${email}`}
              className="mono block break-all text-white/75 hover:text-white"
            >
              {email}
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

export default Footer;
