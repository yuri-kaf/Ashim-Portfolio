import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { CollectionSpec, FieldSpec, emptyItem, groupedFields } from '../../lib/editorSchema';
import { slugify } from '../../lib/slug';
import { SeoDefaults } from '../../types';
import Field from '../../components/dashboard/Field';
import ImageField from '../../components/dashboard/ImageField';
import ImagesField from '../../components/dashboard/ImagesField';
import ListField from '../../components/dashboard/ListField';
import MarkdownField from '../../components/dashboard/MarkdownField';
import ToggleField from '../../components/dashboard/ToggleField';
import SearchPreview from '../../components/dashboard/SearchPreview';

type Item = Record<string, any>;

interface CollectionEditorProps {
  spec: CollectionSpec;
  items: Item[];
  seo: SeoDefaults;
  onChange: (items: Item[]) => void;
}

/** "value | label" lines <-> [{id, value, label}] for the `pairs` kind. */
const pairsToText = (pairs: Array<{ value?: string; label?: string }> = []) =>
  pairs.map((pair) => `${pair.value ?? ''} | ${pair.label ?? ''}`);

const textToPairs = (lines: string[]) =>
  lines
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      const [value = '', label = ''] = line.split('|');
      return { id: `result-${index + 1}`, value: value.trim(), label: label.trim() };
    });

const CollectionEditor: React.FC<CollectionEditorProps> = ({ spec, items, seo, onChange }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const replace = (index: number, item: Item) =>
    onChange(items.map((existing, i) => (i === index ? item : existing)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = () => {
    const item = emptyItem(spec);
    // New items go to the top: for posts and projects the newest is what you
    // want to work on, and scrolling to the bottom of a long list to find it is
    // needless friction.
    onChange([item, ...items]);
    setOpenId(String(item.id));
  };

  const duplicate = (item: Item) => {
    const copy = {
      ...item,
      id: crypto.randomUUID(),
      ...(spec.titleField ? { [spec.titleField]: `${item[spec.titleField] ?? ''} copy` } : {}),
      // A duplicate must not collide on slug, and must not go live by accident.
      ...(spec.slugField ? { [spec.slugField]: '' } : {}),
      ...(spec.publishedField ? { [spec.publishedField]: false } : {}),
    };
    onChange([copy, ...items]);
    setOpenId(String(copy.id));
  };

  /** Fills the slug from the title while it is still blank. */
  const setField = (index: number, item: Item, field: FieldSpec, value: unknown) => {
    const next: Item = { ...item, [field.key]: value };

    if (spec.slugField && field.key === spec.titleField && typeof value === 'string') {
      const currentSlug = String(item[spec.slugField] ?? '');
      const previousAuto = slugify(String(item[spec.titleField] ?? ''));
      if (!currentSlug || currentSlug === previousAuto) {
        next[spec.slugField] = slugify(value);
      }
    }

    replace(index, next);
  };

  const renderField = (index: number, item: Item, field: FieldSpec) => {
    const raw = item[field.key];

    switch (field.kind) {
      case 'markdown':
        return (
          <MarkdownField
            key={field.key}
            label={field.label}
            help={field.help}
            rows={field.rows}
            value={String(raw ?? '')}
            onChange={(value) => setField(index, item, field, value)}
          />
        );
      case 'image':
        return (
          <ImageField
            key={field.key}
            label={field.label}
            value={String(raw ?? '')}
            onChange={(value) => setField(index, item, field, value)}
          />
        );
      case 'images':
        return (
          <ImagesField
            key={field.key}
            label={field.label}
            help={field.help}
            value={Array.isArray(raw) ? raw.map(String) : []}
            onChange={(value) => setField(index, item, field, value)}
          />
        );
      case 'list':
        return (
          <ListField
            key={field.key}
            label={field.label}
            help={field.help}
            value={Array.isArray(raw) ? raw.map(String) : []}
            onChange={(value) => setField(index, item, field, value)}
          />
        );
      case 'pairs':
        return (
          <ListField
            key={field.key}
            label={field.label}
            help={field.help}
            value={pairsToText(Array.isArray(raw) ? raw : [])}
            onChange={(lines) => setField(index, item, field, textToPairs(lines))}
          />
        );
      case 'toggle':
        return (
          <ToggleField
            key={field.key}
            label={field.label}
            help={field.help}
            value={Boolean(raw)}
            onChange={(value) => setField(index, item, field, value)}
          />
        );
      default:
        return (
          <Field
            key={field.key}
            label={field.label}
            kind={field.kind === 'textarea' ? 'textarea' : 'text'}
            rows={field.rows}
            help={field.help}
            recommendedMax={field.recommendedMax}
            value={String(raw ?? '')}
            onChange={(value) => setField(index, item, field, value)}
          />
        );
    }
  };

  const publicPath = (item: Item): string | null => {
    if (!spec.slugField) return null;
    const slug = String(item[spec.slugField] ?? '') || slugify(String(item[spec.titleField] ?? ''));
    if (!slug) return null;
    return spec.key === 'blogs' ? `/blog/${slug}` : `/works/${slug}`;
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="mono bracket text-[var(--grey-1)]">
          {spec.label} — {items.length}
        </p>
        <button
          onClick={add}
          className="mono flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-[var(--paper)]"
        >
          <Plus size={14} /> New
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const id = String(item.id ?? index);
          const open = openId === id;
          const isHidden = spec.publishedField ? !item[spec.publishedField] : false;
          const path = publicPath(item);

          return (
            <div key={id} className="surface-inset overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <button
                  onClick={() => setOpenId(open ? null : id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  <span className="truncate text-sm font-medium">
                    {item[spec.titleField] || (
                      <span className="text-[var(--grey-2)]">Untitled</span>
                    )}
                  </span>
                  {isHidden && (
                    <span className="mono shrink-0 rounded-full border border-[var(--hairline)] px-2.5 py-1 text-[var(--grey-1)]">
                      Draft
                    </span>
                  )}
                </button>

                {path && (
                  <a
                    href={path}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open on the site"
                    className="text-[var(--grey-2)] hover:text-[var(--ink)]"
                  >
                    <ExternalLink size={15} />
                  </a>
                )}

                <button
                  onClick={() => duplicate(item)}
                  aria-label="Duplicate"
                  title="Duplicate"
                  className="text-[var(--grey-2)] hover:text-[var(--ink)]"
                >
                  <Copy size={15} />
                </button>

                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="mono text-[var(--grey-2)] hover:text-[var(--ink)] disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label="Move down"
                  className="mono text-[var(--grey-2)] hover:text-[var(--ink)] disabled:opacity-30"
                >
                  ↓
                </button>

                {confirmingId === id ? (
                  <button
                    onClick={() => {
                      onChange(items.filter((_, i) => i !== index));
                      setConfirmingId(null);
                    }}
                    className="mono text-[var(--ink)] underline"
                  >
                    Really?
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmingId(id)}
                    aria-label="Delete"
                    className="text-[var(--grey-2)] hover:text-[var(--ink)]"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {open && (
                <div className="space-y-10 border-t border-[var(--hairline)] px-5 py-7">
                  {groupedFields(spec).map(([group, fields]) => (
                    <section key={group || 'default'}>
                      {group && (
                        <p className="mono bracket mb-5 text-[var(--grey-1)]">{group}</p>
                      )}
                      <div className="grid gap-6">
                        {fields.map((field) => renderField(index, item, field))}
                      </div>
                    </section>
                  ))}

                  {spec.key === 'blogs' && (
                    <SearchPreview
                      siteUrl={seo.siteUrl}
                      path={`/blog/${item.slug || slugify(String(item.title ?? ''))}`}
                      title={item.seoTitle || item.title || ''}
                      description={item.metaDescription || item.excerpt || ''}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <p className="mono py-8 text-center text-[var(--grey-2)]">
            Nothing here yet — press New.
          </p>
        )}
      </div>
    </div>
  );
};

export default CollectionEditor;
