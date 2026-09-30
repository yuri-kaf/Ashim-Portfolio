import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PortfolioData } from '../types';
import { findPost, relatedPosts } from '../lib/posts';
import { ownedServices } from '../lib/services';
import { PageShell, Reveal } from '../components/Motion';
import Markdown from '../components/Markdown';
import Seo from '../components/Seo';
import { postMeta } from '../lib/pageMeta';
import NotFoundPage from './NotFoundPage';

interface BlogDetailPageProps {
  data: PortfolioData;
}

/** Rough reading time, used when a post has none set. */
const estimateReadTime = (content: string): string => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min`;
};

const BlogDetailPage: React.FC<BlogDetailPageProps> = ({ data }) => {
  const { slug } = useParams<{ slug: string }>();

  // Matched on slug, falling back to id so links shared before slugs existed
  // still resolve. lib/posts.ts is what api/page.ts resolves with too.
  const post = useMemo(() => findPost(data, slug), [data, slug]);

  if (!post) return <NotFoundPage />;

  // A draft is reachable by direct link so it can be previewed, but must never
  // be indexed.
  const isDraft = !post.published;

  // The category the post is filed under, if it still exists — a post whose
  // category was deleted keeps its id, so this can legitimately come back
  // empty and the byline simply omits the link.
  const category = (data?.blogCategories ?? []).find(
    (entry) => entry && entry.id === post.categoryId,
  );

  // Same topic first, then the newest of the rest — thin placeholders left
  // out. A single "read next" link was the only way on from a post.
  const related = relatedPosts(data, post);
  const services = ownedServices(data);
  const readTime = post.readTime?.trim() || estimateReadTime(post.content);

  return (
    <PageShell className="min-h-screen bg-[var(--paper)]">
      <Seo defaults={data.seo} data={data} {...postMeta(post, data)} />

      <article data-nav-theme="light" className="px-5 pb-24 pt-32 md:px-10 md:pt-40">
        <div className="mx-auto max-w-[760px]">
          <Reveal>
            <Link
              to="/blog"
              className="mono mb-10 inline-flex items-center gap-2 text-[var(--grey-1)] hover:text-[var(--ink)]"
            >
              <ArrowLeft size={14} /> Journal
            </Link>
          </Reveal>

          {isDraft && (
            <Reveal>
              <p className="mono mb-8 inline-block rounded-full border border-[var(--ink)] px-4 py-2">
                Draft — not published, and hidden from search
              </p>
            </Reveal>
          )}

          <Reveal delay={0.05}>
            <div className="mono mb-6 flex flex-wrap items-center gap-3 text-[var(--grey-1)]">
              {post.date && <span>{post.date}</span>}
              {post.date && <span className="text-[var(--grey-2)]">·</span>}
              <span>{readTime} read</span>
              {post.author && (
                <>
                  <span className="text-[var(--grey-2)]">·</span>
                  <span>{post.author}</span>
                </>
              )}
              {category && (
                <>
                  <span className="text-[var(--grey-2)]">·</span>
                  <Link
                    to={`/blog/category/${category.slug}`}
                    className="link-wipe text-[var(--ink)]"
                  >
                    {category.title}
                  </Link>
                </>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="display mb-8 text-4xl leading-[1.05] md:text-6xl">{post.title}</h1>
          </Reveal>

          {post.excerpt && (
            <Reveal delay={0.15}>
              <p className="mb-10 text-lg font-light leading-relaxed text-[var(--grey-1)] md:text-xl">
                {post.excerpt}
              </p>
            </Reveal>
          )}

          {post.tags.length > 0 && (
            <Reveal delay={0.2}>
              <div className="mb-12 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="tag-physical">
                    {tag}
                  </span>
                ))}
              </div>
            </Reveal>
          )}
        </div>

        {post.image && (
          <Reveal delay={0.25}>
            <div className="mx-auto mb-16 max-w-[1100px] overflow-hidden rounded-3xl">
              <img src={post.image} alt="" className="w-full object-cover" />
            </div>
          </Reveal>
        )}

        <div className="mx-auto max-w-[760px]">
          {post.content.trim() ? (
            <Markdown>{post.content}</Markdown>
          ) : (
            <p className="mono text-[var(--grey-2)]">This post has no body yet.</p>
          )}

          {/* Who wrote it, with a link to the page that says so at length —
              the author signal Google looks for on advice content. */}
          <aside className="mt-20 border-t border-[var(--hairline)] pt-10">
            <p className="mono mb-4 text-[var(--grey-1)]">Written by</p>
            <p className="display mb-3 text-2xl md:text-3xl">
              <Link to="/about" rel="author" className="link-wipe">
                {post.author?.trim() || data.name}
              </Link>
            </p>
            <p className="max-w-[600px] text-base font-light leading-relaxed text-[var(--grey-1)]">
              {data.role}
              {data.contact?.location ? ` in ${data.contact.location}` : ''}
              {data.company?.name ? `, and ${data.company.role} of ${data.company.name}.` : '.'}{' '}
              {data.heroIntro}
            </p>
          </aside>

          {related.length > 0 && (
            <div className="mt-16 border-t border-[var(--hairline)] pt-10">
              <p className="mono mb-6 text-[var(--grey-1)]">Keep reading</p>
              <div className="border-t border-[var(--ink)]">
                {related.map((entry) => (
                  <Link
                    key={entry.id}
                    to={`/blog/${entry.slug}`}
                    className="group flex items-center justify-between gap-6 border-b border-[var(--hairline)] py-6"
                  >
                    <span className="display text-xl md:text-2xl">{entry.title}</span>
                    <ArrowRight
                      size={20}
                      className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-16 rounded-3xl bg-[var(--ink)] p-8 text-[var(--paper)] md:p-12">
            <p className="mono mb-4 text-white/60">Work with me</p>
            <p className="display mb-8 text-2xl leading-tight md:text-4xl">
              Need this done for your business?
            </p>
            <div className="flex flex-wrap gap-3">
              {services.map((service) => (
                <Link
                  key={service.id}
                  to={`/services/${service.slug}`}
                  className="mono rounded-full border border-white/25 px-5 py-3 transition-colors duration-300 hover:bg-white hover:text-[var(--ink)]"
                >
                  {service.title}
                </Link>
              ))}
              <Link
                to="/contact"
                className="mono inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[var(--ink)]"
              >
                Get in touch <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </article>
    </PageShell>
  );
};

export default BlogDetailPage;
