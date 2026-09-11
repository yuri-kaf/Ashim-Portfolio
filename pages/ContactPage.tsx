import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import { PortfolioData } from '../types';
import { DEFAULT_DATA } from '../lib/defaults.js';
import { ownedServices } from '../lib/services';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import {
  PageShell,
  Reveal,
  SplitText,
  SectionLabel,
  Stagger,
  StaggerItem,
} from '../components/Motion';

interface ContactPageProps {
  data: PortfolioData;
}

/**
 * The NAP block (name, address, phone) is plain visible text on purpose —
 * that is what a local search crawler reads, and what a human copies.
 *
 * Deliberately no LocalBusiness JSON-LD here. lib/seoGraph.ts already decided
 * this site emits none: limicreatives.com publishes the same phone number
 * under its own Organization, and two local businesses sharing one number
 * degrades the local signal for both. Do not add schema to this file.
 */
const ContactPage: React.FC<ContactPageProps> = ({ data }) => {
  const name = data?.name || DEFAULT_DATA.name;
  const contact = data?.contact || DEFAULT_DATA.contact;
  const email = contact.email || DEFAULT_DATA.contact.email;
  const phone = contact.phone || DEFAULT_DATA.contact.phone;
  const location = contact.location || DEFAULT_DATA.contact.location;
  const city = data?.seo?.geo?.city || DEFAULT_DATA.seo.geo.city;
  const areaServed = data?.seo?.geo?.areaServed ?? [];

  // Spaces and formatting are for the reader; tel: wants the dialable form.
  const telHref = `tel:${phone.replace(/[^+\d]/g, '')}`;

  // Only services that live on this site — a pointer service belongs to
  // limicreatives.com and has no page here to link to.
  const owned = ownedServices(data);

  return (
    <PageShell className="min-h-screen bg-[var(--paper)]">
      <Seo
        defaults={data.seo}
        data={data}
        title={`Contact ${name}`}
        description={`Hire a web designer and digital marketer in ${city}. Call ${phone} or email ${email} — ${name}, ${location}.`}
        path="/contact"
      />

      {/* ---------- Masthead ---------- */}
      <header className="grain relative overflow-hidden bg-white px-6 pb-24 pt-32 md:pt-40">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[520px] w-[520px] animate-drift rounded-full bg-[var(--ink)]/[0.04] blur-[120px]" />

        <div className="relative mx-auto max-w-7xl">
          <Breadcrumbs path="/contact" title="Contact" />

          <Reveal>
            <SectionLabel className="mb-8">Contact</SectionLabel>
          </Reveal>

          <SplitText
            as="h1"
            text={`Hire a web designer in ${city}.`}
            accent={[`${city}.`]}
            className="display mb-12 max-w-4xl text-[2.75rem] leading-[1.02] text-neutral-900 md:text-[6rem]"
          />

          <Reveal delay={0.3} className="max-w-2xl">
            <p className="text-lg font-light leading-relaxed text-neutral-500 md:text-2xl">
              Design and marketing for businesses in {location}. Tell me what you are building — a
              scope, a deadline and a rough budget is enough to start.
            </p>
          </Reveal>
        </div>
      </header>

      {/* ---------- NAP block ---------- */}
      <section className="border-t border-black/[0.05] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionLabel className="mb-10">Where to find me</SectionLabel>
          </Reveal>

          <div className="border-t border-[var(--ink)]">
            <Reveal>
              <p className="display pt-8 text-3xl text-neutral-900 md:text-5xl">{name}</p>
              <p className="mono mb-10 mt-3 text-[var(--grey-1)]">{data.role}</p>
            </Reveal>

            <Stagger className="grid grid-cols-1 gap-px bg-black/[0.07] md:grid-cols-3" stagger={0.1}>
              <StaggerItem className="bg-[var(--paper)] p-8">
                <p className="mono mb-4 flex items-center gap-2 text-[var(--grey-1)]">
                  <MapPin size={13} /> Location
                </p>
                <p className="text-xl font-light text-neutral-900 md:text-2xl">{location}</p>
                {areaServed.length > 0 && (
                  <p className="mono mt-4 text-[var(--grey-1)]">
                    Working in {areaServed.join(' · ')}
                  </p>
                )}
              </StaggerItem>

              <StaggerItem className="bg-[var(--paper)] p-8">
                <p className="mono mb-4 flex items-center gap-2 text-[var(--grey-1)]">
                  <Phone size={13} /> Phone
                </p>
                <a
                  href={telHref}
                  className="link-wipe text-xl font-light text-neutral-900 md:text-2xl"
                >
                  {phone}
                </a>
              </StaggerItem>

              <StaggerItem className="bg-[var(--paper)] p-8">
                <p className="mono mb-4 flex items-center gap-2 text-[var(--grey-1)]">
                  <Mail size={13} /> Email
                </p>
                <a
                  href={`mailto:${email}`}
                  className="link-wipe break-all text-xl font-light text-neutral-900 md:text-2xl"
                >
                  {email}
                </a>
              </StaggerItem>
            </Stagger>
          </div>

          <Reveal delay={0.25} className="mt-10">
            <a
              href={`mailto:${email}?subject=Project%20enquiry`}
              className="mono group inline-flex items-center gap-4 rounded-full bg-[var(--ink)] py-4 pl-8 pr-6 text-[var(--paper)] transition-colors duration-500 hover:bg-neutral-900"
            >
              Start a project
              <ArrowRight
                size={15}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ---------- What you can brief me on ---------- */}
      <section className="border-t border-black/[0.05] bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionLabel className="mb-8">What to brief me on</SectionLabel>
          </Reveal>

          <SplitText
            as="h2"
            text="Start with the work."
            accent={['work.']}
            className="display mb-14 text-4xl text-neutral-900 md:text-6xl"
          />

          {owned.length > 0 ? (
            <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-3" stagger={0.12}>
              {owned.map((service) => (
                <StaggerItem key={service.id}>
                  <Link
                    to={`/services/${service.slug}`}
                    className="group grain flex h-full flex-col border border-black/[0.06] bg-[var(--paper)] p-9 transition-colors duration-500 hover:bg-neutral-900"
                  >
                    <h3 className="mb-4 text-2xl font-medium tracking-tight text-neutral-900 transition-colors duration-500 group-hover:text-white">
                      {service.title}
                    </h3>
                    <p className="mb-8 flex-1 text-sm font-light leading-relaxed text-neutral-500 transition-colors duration-500 group-hover:text-neutral-300">
                      {service.description}
                    </p>
                    <span className="mono inline-flex items-center gap-3 text-[var(--grey-1)] transition-colors duration-500 group-hover:text-white">
                      Read the detail
                      <ArrowRight
                        size={14}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <div className="surface-inset py-16 text-center text-neutral-400">
              No service pages published yet.
            </div>
          )}

          <Reveal delay={0.3} className="mt-12">
            <Link to="/services" className="mono group inline-flex items-center gap-3">
              <span className="link-wipe">The full service suite</span>
              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
};

export default ContactPage;
