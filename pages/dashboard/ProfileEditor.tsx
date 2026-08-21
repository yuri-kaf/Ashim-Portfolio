import React from 'react';
import { PortfolioData } from '../../types';
import Field from '../../components/dashboard/Field';

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
  </div>
);

export default ProfileEditor;
