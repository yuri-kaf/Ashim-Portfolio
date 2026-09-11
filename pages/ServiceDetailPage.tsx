import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PortfolioData } from '../types';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import Markdown from '../components/Markdown';
import { PageShell, Reveal, SectionLabel } from '../components/Motion';
import NotFoundPage from './NotFoundPage';

interface ServiceDetailPageProps {
  data: PortfolioData;
}

/**
 * A page per owned service.
 *
 * Only `mode: 'page'` services resolve here. A pointer service — one whose
 * page lives on limicreatives.com — renders the 404 rather than an empty
 * shell, which is what stops this domain from building a second page chasing
 * the query the agency already ranks for. The 404 branch emits no Seo, so a
 * pointer slug never produces an indexable URL.
 */
const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({ data }) => {
  const { slug } = useParams<{ slug: string }>();

  const services = useMemo(
    () => (data?.services ?? []).filter((entry) => entry && entry.mode === 'page' && entry.published),
    [data?.services],
  );

  const service = services.find((entry) => entry.slug === slug);

  if (!service) return <NotFoundPage />;

  const siblings = services.filter((entry) => entry.id !== service.id).slice(0, 2);
  const faqs = service.faqs ?? [];
  const deliverables = service.deliverables ?? [];
  const heading = service.seoTitle?.trim() || service.title;

  return (
    <PageShell className="min-h-screen bg-[var(--paper)]">
      <Seo
        defaults={data.seo}
        data={data}
        title={service.seoTitle?.trim() || service.title}
        description={service.metaDescription?.trim() || service.description}
        image={service.image}
        path={`/services/${service.slug}`}
        faqs={faqs}
        service={{ name: service.title, description: service.description }}
      />

      {/* ---------- Masthead ---------- */}
      <header className="grain relative overflow-hidden bg-white px-6 pb-24 pt-32 md:pt-40">
        <div className="pointer-events-none absolute -left-40 top-20 h-[560px] w-[560px] animate-drift rounded-full bg-[var(--ink)]/[0.04] blur-[130px]" />

        <div className="relative mx-auto max-w-7xl">
          <Breadcrumbs path={`/services/${service.slug}`} title={service.title} />

          <Reveal>
            <SectionLabel className="mb-8">Service</SectionLabel>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="display mb-10 max-w-5xl text-[2.5rem] leading-[1.02] text-neutral-900 md:text-[5.5rem]">
              {heading}
            </h1>
          </Reveal>

          <Reveal delay={0.2} className="max-w-2xl">
            <p className="text-lg font-light leading-relaxed text-neutral-500 md:text-2xl">
              {service.description}
            </p>
          </Reveal>

          {deliverables.length > 0 && (
            <Reveal delay={0.3}>
              <div className="mt-10 flex flex-wrap gap-2">
                {deliverables.map((item) => (
                  <span key={item} className="tag-physical">
                    {item}
                  </span>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </header>

      {/* ---------- Body ---------- */}
      <section className="border-t border-black/[0.05] px-6 py-24">
        <div className="mx-auto max-w-[760px]">
          {service.body?.trim() ? (
            <Markdown>{service.body}</Markdown>
          ) : (
            <p className="mono text-[var(--grey-2)]">This service has no write-up yet.</p>
          )}
        </div>
      </section>

      {/* ---------- FAQs ----------
           Visible headings and paragraphs, not an accordion that hides the
           answers behind a click. The FAQPage schema emitted by Seo above is
           ignored unless the same questions and answers are on the page. */}
      {faqs.length > 0 && (
        <section className="border-t border-black/[0.05] bg-white px-6 py-24">
          <div className="mx-auto max-w-[860px]">
            <Reveal>
              <SectionLabel className="mb-10">Questions</SectionLabel>
            </Reveal>

            <Reveal delay={0.05}>
              <h2 className="display mb-14 text-4xl text-neutral-900 md:text-6xl">
                Before you ask.
              </h2>
            </Reveal>

            <div className="border-t border-[var(--hairline)]">
              {faqs.map((faq, index) => (
                <Reveal key={faq.id} delay={index * 0.06}>
                  <div className="border-b border-[var(--hairline)] py-10">
                    <h3 className="mb-4 text-xl font-medium tracking-tight text-neutral-900 md:text-2xl">
                      {faq.question}
                    </h3>
                    <p className="max-w-[680px] text-base font-light leading-[1.85] text-[var(--grey-1)] md:text-lg">
                      {faq.answer}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Siblings + CTA ---------- */}
      <section className="border-t border-black/[0.05] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          {siblings.length > 0 && (
            <>
              <Reveal>
                <SectionLabel className="mb-10">Also on offer</SectionLabel>
              </Reveal>

              <div className="mb-16 border-t border-[var(--ink)]">
                {siblings.map((sibling) => (
                  <Reveal key={sibling.id}>
                    <Link
                      to={`/services/${sibling.slug}`}
                      className="invert-row group flex items-center justify-between gap-6 border-b border-[var(--hairline)] px-4 py-8"
                    >
                      <span className="display text-2xl md:text-4xl">{sibling.title}</span>
                      <ArrowRight
                        size={22}
                        className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </Link>
                  </Reveal>
                ))}
              </div>
            </>
          )}

          <Reveal className="flex flex-wrap items-center gap-8">
            <Link
              to="/contact"
              className="mono group inline-flex items-center gap-4 rounded-full bg-[var(--ink)] py-4 pl-8 pr-6 text-[var(--paper)] transition-colors duration-500 hover:bg-neutral-900"
            >
              Enquire about {service.title}
              <ArrowRight
                size={15}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            <Link to="/services" className="mono inline-flex items-center gap-2 text-[var(--grey-1)] hover:text-[var(--ink)]">
              <ArrowLeft size={14} /> All services
            </Link>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
};

export default ServiceDetailPage;
