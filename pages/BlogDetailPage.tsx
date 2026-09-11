import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PortfolioData } from '../types';
import { PageShell, Reveal } from '../components/Motion';
import Markdown from '../components/Markdown';
import Seo from '../components/Seo';
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
  const posts = useMemo(() => (data?.blogs ?? []).filter(Boolean), [data?.blogs]);

  // Matched on slug, falling back to id so links shared before slugs existed
  // still resolve.
  const post = posts.find((entry) => entry.slug === slug) ?? posts.find((entry) => entry.id === slug);

  if (!post) return <NotFoundPage />;

  // A draft is reachable by direct link so it can be previewed, but must never
  // be indexed.
  const isDraft = !post.published;

  const published = posts.filter((entry) => entry.published && entry.id !== post.id);
  const next = published[0];
  const readTime = post.readTime?.trim() || estimateReadTime(post.content);

  return (
    <PageShell className="min-h-screen bg-[var(--paper)]">
      <Seo
        defaults={data.seo}
        data={data}
        title={post.seoTitle?.trim() || post.title}
        description={post.metaDescription?.trim() || post.excerpt}
        image={post.ogImage?.trim() || post.image}
        path={`/blog/${post.slug}`}
        type="article"
        schemaType="BlogPosting"
        publishedTime={post.date}
        tags={post.tags}
        noindex={isDraft}
      />

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

          {next && (
            <div className="mt-20 border-t border-[var(--hairline)] pt-10">
              <p className="mono mb-4 text-[var(--grey-1)]">Read next</p>
              <Link to={`/blog/${next.slug}`} className="group flex items-center justify-between gap-6">
                <span className="display text-2xl md:text-3xl">{next.title}</span>
                <ArrowRight
                  size={22}
                  className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>
          )}
        </div>
      </article>
    </PageShell>
  );
};

export default BlogDetailPage;
