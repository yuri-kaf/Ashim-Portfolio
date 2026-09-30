import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { hubMeta } from '../lib/pageMeta';
import React, { useState, useEffect } from 'react';
import { DEFAULT_DATA } from '../lib/defaults.js';
import { motion, useReducedMotion } from 'motion/react';
import { Clock, ArrowRight, X, ArrowUpRight } from 'lucide-react';
import { PortfolioData, Blog } from '../types';
import {
  PageShell,
  Reveal,
  SplitText,
  SectionLabel,
  Stagger,
  StaggerItem,
  Parallax,
  Magnetic,
  EASE,
} from '../components/Motion';
import EditorialCard from '../components/EditorialCard';
import { liveCategories, livePosts } from '../lib/posts';

interface BlogPageProps {
  data: PortfolioData;
}

const Meta: React.FC<{ blog: Blog; light?: boolean }> = ({ blog, light }) => (
  <div
    className={`flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.18em] ${
      light ? 'text-neutral-400' : 'text-neutral-400'
    }`}
  >
    <span>{blog.date}</span>
    <span className="h-1 w-1 rounded-full bg-[var(--ink)]" />
    <span className="flex items-center gap-1.5">
      <Clock size={11} /> {blog.readTime}
    </span>
  </div>
);

/**
 * Stands in for a cover image a post does not have. An <img src=""> is a
 * broken-image icon in some browsers and a request for the page itself in
 * others; the title set large on ink is what the site's own covers look like.
 */
const TitlePlate: React.FC<{ title: string }> = ({ title }) => (
  <div className="absolute inset-0 flex items-end bg-[var(--ink)] p-8 md:p-10">
    <span className="display line-clamp-4 text-3xl leading-[1.05] text-[var(--paper)] md:text-5xl">
      {title}
    </span>
  </div>
);

const BlogPage: React.FC<BlogPageProps> = ({ data }) => {
  // Drafts are reachable by direct link for previewing, never listed. Newest
  // first, whatever order they were entered in.
  const blogs = livePosts(data);
  const email = data?.contact?.email || DEFAULT_DATA.contact.email;
  const reduced = useReducedMotion();

  const [featured, ...rest] = blogs;

  // Only categories with something published in them, matching the rule the
  // prerenderer uses to decide which category pages exist at all — a chip
  // pointing at a page that was never built is a link to a 404.
  const categories = liveCategories(data);


  return (
    <PageShell className="min-h-screen bg-[var(--paper)]">
      <Seo defaults={data.seo} data={data} {...hubMeta(data, 'blog')} />
      {/* ---------- Masthead ---------- */}
      <header className="grain relative overflow-hidden bg-white px-6 pb-24 pt-40">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[520px] w-[520px] animate-drift rounded-full bg-[var(--ink)]/[0.04] blur-[120px]" />

        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <SectionLabel className="mb-8">Journal</SectionLabel>
          </Reveal>

          <SplitText
            as="h1"
            text="Design & marketing notes from Nepal."
            accent={['Nepal.']}
            className="display mb-12 text-[3.5rem] text-neutral-900 md:text-[8rem]"
          />

          <Reveal delay={0.3} className="max-w-2xl">
            <p className="text-lg font-light leading-relaxed text-neutral-500 md:text-xl">
              {data.pageIntros?.blog ||
                'Notes on web design, UI/UX and digital marketing for businesses in Nepal.'}
            </p>
          </Reveal>

          {/* The prerendered body links to these; without them here the links
              vanish the moment React mounts, leaving crawlers with paths no
              visitor is ever shown. */}
          {categories.length > 0 && (
            <Reveal delay={0.4}>
              <nav aria-label="Journal categories" className="mt-12 flex flex-wrap items-center gap-3">
                <span className="mono bracket text-[var(--grey-1)]">Topics</span>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/blog/category/${category.slug}`}
                    className="tag-physical transition-colors duration-300 hover:text-[var(--ink)]"
                  >
                    {category.title}
                  </Link>
                ))}
              </nav>
            </Reveal>
          )}
        </div>
      </header>

      {/* ---------- Featured ---------- */}
      {featured && (
        <section className="border-t border-black/[0.05] px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal className="mb-10">
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--grey-1)]">
                Featured
              </span>
            </Reveal>

            <Reveal delay={0.1}>
              <Link to={`/blog/${featured.slug}`} className="group block w-full text-left">
                <div className="grid gap-0 border-t border-[var(--ink)] lg:grid-cols-2">
                  <div className="relative aspect-[16/11] overflow-hidden bg-neutral-200">
                    {featured.image ? (
                      <Parallax offset={-20} className="absolute inset-[-10%]">
                        <img
                          src={featured.image}
                          alt={featured.title}
                          loading="lazy"
                          className="h-full w-full object-cover grayscale transition-all duration-[1.2s] group-hover:scale-[1.04] group-hover:grayscale-0"
                        />
                      </Parallax>
                    ) : (
                      <TitlePlate title={featured.title} />
                    )}
                    <span className="mono absolute left-4 top-4 text-white mix-blend-difference">
                      01
                    </span>
                  </div>

                  <div className="flex flex-col justify-center py-10 lg:pl-12">
                    <Meta blog={featured} />
                    <h2 className="mega mb-6 mt-6 text-[9vw] leading-none md:text-[4vw]">
                      {featured.title}
                    </h2>
                    <p className="mb-10 max-w-md text-base font-light leading-relaxed text-[var(--grey-1)] md:text-lg">
                      {featured.excerpt}
                    </p>
                    <span className="mono inline-flex items-center gap-3">
                      <span className="link-wipe">Read article</span>
                      <ArrowRight
                        size={14}
                        className="transition-transform duration-500 group-hover:translate-x-1.5"
                      />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------- Archive grid ---------- */}
      {rest.length > 0 && (
        <section className="px-6 pb-28">
          <div className="mx-auto max-w-7xl">
            <Reveal className="mb-10 flex items-center gap-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400">
                All entries
              </span>
              <span className="h-px flex-1 bg-black/[0.06]" />
              <span className="text-[9px] font-bold tabular-nums text-neutral-300">
                {String(rest.length).padStart(2, '0')}
              </span>
            </Reveal>

            <Stagger className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
              {rest.map((blog, i) => (
                <StaggerItem key={blog.id}>
                  <EditorialCard
                    to={`/blog/${blog.slug}`}
                    image={blog.image}
                    title={blog.title}
                    meta={blog.readTime}
                    submeta={blog.date}
                    description={blog.excerpt}
                    index={i + 1}
                    aspect="aspect-[16/10]"
                  />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {blogs.length === 0 && (
        <div className="px-6 py-32 text-center text-neutral-400">
          No entries found. Check back later.
        </div>
      )}

      {/* ---------- Newsletter ---------- */}
      <section className="px-6 pb-32">
        <Reveal className="mx-auto max-w-7xl">
          <div data-nav-theme="dark" className="grain relative overflow-hidden rounded-none bg-neutral-900 p-12 text-center md:p-20">
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 animate-drift rounded-full bg-white/10 blur-[110px]" />
            <div className="relative z-10">
              <SplitText
                as="h2"
                text="No spam. Just craft."
                accent={['craft.']}
                className="display mx-auto mb-6 max-w-xl text-4xl text-white md:text-5xl"
              />
              <Reveal delay={0.25}>
                <p className="mx-auto mb-10 max-w-md text-base font-light text-neutral-400">
                  One email when something new goes up. Unsubscribe whenever.
                </p>
              </Reveal>
              <Reveal delay={0.35}>
                <Magnetic strength={0.25} className="inline-block">
                  <a
                    href={`mailto:${email}?subject=Subscribe%20to%20the%20journal`}
                    className="inline-flex items-center gap-4 rounded-full bg-white px-9 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900 shadow-2xl transition-colors duration-500 hover:bg-[var(--ink)] hover:text-white"
                  >
                    Subscribe
                    <ArrowUpRight size={15} />
                  </a>
                </Magnetic>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </section>

    </PageShell>
  );
};

export default BlogPage;
