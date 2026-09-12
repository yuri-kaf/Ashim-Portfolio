import React from 'react';
import { PortfolioData } from '../../types';
import Field from '../../components/dashboard/Field';
import ImageField from '../../components/dashboard/ImageField';
import ListField from '../../components/dashboard/ListField';
import SearchPreview from '../../components/dashboard/SearchPreview';

const AVAILABILITY = ['available', 'busy', 'vacation'] as const;

interface ProfileEditorProps {
  draft: PortfolioData;
  patch: (changes: Partial<PortfolioData>) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ draft, patch }) => (
  <div className="space-y-10">
    <section className="grid gap-6 md:grid-cols-2">
      <Field label="Name" value={draft.name} onChange={(name) => patch({ name })} />
      <Field label="Role" value={draft.role} onChange={(role) => patch({ role })} />
      <div className="md:col-span-2">
        <Field
          label="Tagline"
          kind="textarea"
          rows={2}
          value={draft.tagline}
          onChange={(tagline) => patch({ tagline })}
        />
      </div>
      <Field
        label="Availability"
        kind="select"
        options={AVAILABILITY}
        value={draft.availability}
        onChange={(availability) =>
          patch({ availability: availability as PortfolioData['availability'] })
        }
      />
    </section>

    <section>
      <p className="mono bracket mb-4 text-[var(--grey-1)]">Current position</p>
      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="Company"
          value={draft.company.name}
          onChange={(name) => patch({ company: { ...draft.company, name } })}
        />
        <Field
          label="Your role there"
          value={draft.company.role}
          onChange={(role) => patch({ company: { ...draft.company, role } })}
        />
        <Field
          label="Company URL"
          value={draft.company.url ?? ''}
          onChange={(url) => patch({ company: { ...draft.company, url } })}
        />
        <div className="md:col-span-2">
          <Field
            label="Company description"
            kind="textarea"
            rows={2}
            value={draft.company.description}
            onChange={(description) => patch({ company: { ...draft.company, description } })}
          />
        </div>
      </div>
    </section>

    <section>
      <p className="mono bracket mb-4 text-[var(--grey-1)]">Vibe</p>
      <div className="grid gap-6">
        <Field
          label="Title"
          value={draft.vibe.title}
          onChange={(title) => patch({ vibe: { ...draft.vibe, title } })}
        />
        <Field
          label="Description"
          kind="textarea"
          rows={3}
          value={draft.vibe.description}
          onChange={(description) => patch({ vibe: { ...draft.vibe, description } })}
        />
        <Field
          label="Philosophy — one line each"
          kind="textarea"
          rows={5}
          value={draft.vibe.philosophy.join('\n')}
          onChange={(text) =>
            patch({
              vibe: {
                ...draft.vibe,
                // Blank lines are dropped, so a trailing newline while typing
                // does not become an empty bullet on the site.
                philosophy: text.split('\n').filter((line) => line.trim().length > 0),
              },
            })
          }
        />
      </div>
    </section>

    <section>
      <p className="mono bracket mb-4 text-[var(--grey-1)]">Hero</p>
      <Field
        label="Intro paragraph"
        kind="textarea"
        rows={3}
        help="Sits under the hero headline. The company credential is appended automatically."
        value={draft.heroIntro}
        onChange={(heroIntro) => patch({ heroIntro })}
      />
    </section>

    <section>
      <p className="mono bracket mb-4 text-[var(--grey-1)]">Contact</p>
      <div className="grid gap-6 md:grid-cols-3">
        <Field
          label="Email"
          value={draft.contact.email}
          help="Used by every contact link on the site."
          onChange={(email) => patch({ contact: { ...draft.contact, email } })}
        />
        <Field
          label="Phone"
          value={draft.contact.phone}
          onChange={(phone) => patch({ contact: { ...draft.contact, phone } })}
        />
        <Field
          label="Location"
          value={draft.contact.location}
          onChange={(location) => patch({ contact: { ...draft.contact, location } })}
        />
      </div>
    </section>

    <section>
      <p className="mono bracket mb-4 text-[var(--grey-1)]">Marquee</p>
      <ListField
        label="Scrolling phrases"
        help="One per line. Shown in the band under the hero."
        value={draft.ticker}
        onChange={(ticker) => patch({ ticker })}
      />
    </section>

    <section>
      <p className="mono bracket mb-4 text-[var(--grey-1)]">Page intros</p>
      <div className="grid gap-6">
        {(
          [
            ['works', 'Work page'],
            ['services', 'Services page'],
            ['gallery', 'Gallery page'],
            ['blog', 'Journal page'],
            ['vibe', 'Vibe page'],
          ] as const
        ).map(([key, label]) => (
          <Field
            key={key}
            label={label}
            kind="textarea"
            rows={2}
            value={draft.pageIntros[key]}
            onChange={(text) => patch({ pageIntros: { ...draft.pageIntros, [key]: text } })}
          />
        ))}
      </div>
    </section>

    <section>
      <p className="mono bracket mb-4 text-[var(--grey-1)]">Search &amp; sharing defaults</p>
      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="Site name"
          value={draft.seo.siteName}
          onChange={(siteName) => patch({ seo: { ...draft.seo, siteName } })}
        />
        <Field
          label="Title suffix"
          value={draft.seo.titleSuffix}
          help='Appended to every page title, e.g. " | Ashim Kafle".'
          onChange={(titleSuffix) => patch({ seo: { ...draft.seo, titleSuffix } })}
        />
        <Field
          label="Site URL"
          value={draft.seo.siteUrl}
          help="Used to build canonical links and the sitemap. Include https://."
          onChange={(siteUrl) => patch({ seo: { ...draft.seo, siteUrl } })}
        />
        <Field
          label="Twitter handle"
          value={draft.seo.twitterHandle}
          help="Optional, including the @."
          onChange={(twitterHandle) => patch({ seo: { ...draft.seo, twitterHandle } })}
        />
        <div className="md:col-span-2">
          <Field
            label="Default description"
            kind="textarea"
            rows={2}
            recommendedMax={160}
            help="Used for any page without its own description."
            value={draft.seo.description}
            onChange={(description) => patch({ seo: { ...draft.seo, description } })}
          />
        </div>
        <div className="md:col-span-2">
          <ImageField
            label="Default share image"
            value={draft.seo.ogImage}
            onChange={(ogImage) => patch({ seo: { ...draft.seo, ogImage } })}
          />
        </div>
      </div>

      <div className="mt-8">
        <p className="mono bracket mb-4 text-[var(--grey-1)]">Where you work</p>
        <p className="mono mb-5 text-[var(--grey-2)]">
          Drives the local-search signals: your Person and Service schema, the contact page
          title, and the about and contact headings.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <Field
            label="City"
            value={draft.seo.geo.city}
            help='e.g. "Kathmandu". Used wherever the site names where you are.'
            onChange={(city) =>
              patch({ seo: { ...draft.seo, geo: { ...draft.seo.geo, city } } })
            }
          />
          <Field
            label="Region"
            value={draft.seo.geo.region}
            help='State or province, e.g. "Bagmati Province".'
            onChange={(region) =>
              patch({ seo: { ...draft.seo, geo: { ...draft.seo.geo, region } } })
            }
          />
          <Field
            label="Country code"
            value={draft.seo.geo.country}
            help='Two-letter ISO 3166-1 country code — Nepal is "NP", not "Nepal".'
            onChange={(country) =>
              patch({ seo: { ...draft.seo, geo: { ...draft.seo.geo, country } } })
            }
          />
        </div>
        <div className="mt-6">
          <ListField
            label="Areas served"
            help="One per line, e.g. Kathmandu, Lalitpur, Nepal. Listed as the area your services cover."
            value={draft.seo.geo.areaServed}
            onChange={(areaServed) =>
              patch({ seo: { ...draft.seo, geo: { ...draft.seo.geo, areaServed } } })
            }
          />
        </div>
      </div>

      <div className="mt-8">
        <SearchPreview
          siteUrl={draft.seo.siteUrl}
          path="/"
          title={draft.seo.siteName}
          description={draft.seo.description}
        />
      </div>
    </section>
  </div>
);

export default ProfileEditor;
