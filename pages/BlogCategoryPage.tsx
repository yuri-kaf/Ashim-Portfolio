import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PortfolioData } from '../types';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import EditorialCard from '../components/EditorialCard';
import {
  PageShell,
  Reveal,
  SectionLabel,
  Stagger,
  StaggerItem,
} from '../components/Motion';
import NotFoundPage from './NotFoundPage';

interface BlogCategoryPageProps {
  data: PortfolioData;
}

/**
 * A topic cluster head: one indexable page per category, collecting the posts
 * that point at it. An unknown slug renders the 404 rather than an empty list,
 * so a mistyped category never becomes a thin page in the index.
 */
const BlogCategoryPage: React.FC<BlogCategoryPageProps> = ({ data }) => {
  const { slug } = useParams<{ slug: string }>();
  const categories = useMemo(() => (data?.blogCategories ?? []).filter(Boolean), [data?.blogCategories]);

  const category = categories.find((entry) => entry.slug === slug);

  if (!category) return <NotFoundPage />;

  const posts = (data?.blogs ?? []).filter(
    (post) => post && post.categoryId === category.id && post.published !== false,
  );

  const siblings = categories.filter((entry) => entry.id !== category.id);

  return (
    <PageShell className="min-h-screen bg-[var(--paper)]">
      <Seo
        defaults={data.seo}
        data={data}
        title={category.seoTitle?.trim() || category.title}
        description={category.metaDescription?.trim() || category.description}
        path={`/blog/category/${category.slug}`}
      />

      {/* ---------- Masthead ---------- */}
      <header className="grain relative overflow-hidden bg-white px-6 pb-24 pt-32 md:pt-40">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[520px] w-[520px] animate-drift rounded-full bg-[var(--ink)]/[0.04] blur-[120px]" />

        <div className="relative mx-auto max-w-7xl">
          <Breadcrumbs path={`/blog/category/${category.slug}`} title={category.title} />

          <Reveal>
            <SectionLabel className="mb-8">Journal — category</SectionLabel>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="display mb-10 max-w-4xl text-[3rem] leading-[1.02] text-neutral-900 md:text-[7rem]">
              {category.title}
            </h1>
          </Reveal>

          {category.description && (
            <Reveal delay={0.2} className="max-w-2xl">
              <p className="text-lg font-light leading-relaxed text-neutral-500 md:text-2xl">
                {category.description}
              </p>
            </Reveal>
          )}
        </div>
      </header>

      {/* ---------- Posts ---------- */}
      <section className="border-t border-black/[0.05] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          {posts.length > 0 ? (
            <>
              <Reveal className="mb-10 flex items-center gap-4">
                <span className="mono text-[var(--grey-1)]">In this category</span>
                <span className="h-px flex-1 bg-black/[0.06]" />
                <span className="mono tabular-nums text-neutral-300">
                  {String(posts.length).padStart(2, '0')}
                </span>
              </Reveal>

              <Stagger className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
                {posts.map((post, i) => (
                  <StaggerItem key={post.id}>
                    <EditorialCard
                      to={`/blog/${post.slug}`}
                      image={post.image}
                      title={post.title}
                      meta={post.readTime}
                      submeta={post.date}
                      description={post.excerpt}
                      index={i}
                      aspect="aspect-[16/10]"
                    />
                  </StaggerItem>
                ))}
              </Stagger>
            </>
          ) : (
            <Reveal>
              <div className="surface-inset px-8 py-20 text-center">
                <p className="mb-4 text-xl font-light text-neutral-500">
                  Nothing published under {category.title} yet.
                </p>
                <p className="mono text-[var(--grey-1)]">
                  The rest of the journal is still worth a read.
                </p>
              </div>
            </Reveal>
          )}

          <Reveal delay={0.2} className="mt-14">
            <Link to="/blog" className="mono inline-flex items-center gap-2 text-[var(--grey-1)] hover:text-[var(--ink)]">
              <ArrowLeft size={14} /> All entries
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- Other categories ---------- */}
      {siblings.length > 0 && (
        <section className="border-t border-black/[0.05] bg-white px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <SectionLabel className="mb-10">Other topics</SectionLabel>
            </Reveal>

            <div className="border-t border-[var(--ink)]">
              {siblings.map((sibling) => (
                <Reveal key={sibling.id}>
                  <Link
                    to={`/blog/category/${sibling.slug}`}
                    className="invert-row group flex items-center justify-between gap-6 border-b border-[var(--hairline)] px-4 py-7"
                  >
                    <span className="display text-2xl md:text-3xl">{sibling.title}</span>
                    <ArrowRight
                      size={20}
                      className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
};

export default BlogCategoryPage;
