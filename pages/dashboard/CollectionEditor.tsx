import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { CollectionSpec, emptyItem } from '../../lib/editorSchema';
import Field from '../../components/dashboard/Field';
import ImageField from '../../components/dashboard/ImageField';

interface CollectionEditorProps {
  spec: CollectionSpec;
  items: Record<string, any>[];
  onChange: (items: Record<string, any>[]) => void;
}

const CollectionEditor: React.FC<CollectionEditorProps> = ({ spec, items, onChange }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const replace = (index: number, item: Record<string, any>) =>
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
    onChange([...items, item]);
    setOpenId(item.id);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="mono bracket text-[var(--grey-1)]">
          {spec.label} — {items.length}
        </p>
        <button
          onClick={add}
          className="mono flex items-center gap-2 text-[var(--grey-1)] hover:text-[var(--ink)]"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const id = String(item.id ?? index);
          const open = openId === id;

          return (
            <div key={id} className="surface-inset overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4">
                <button
                  onClick={() => setOpenId(open ? null : id)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  <span className="text-sm font-medium">
                    {item[spec.titleField] || (
                      <span className="text-[var(--grey-2)]">Untitled</span>
                    )}
                  </span>
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
                <div className="grid gap-5 border-t border-[var(--hairline)] px-5 py-6">
                  {spec.fields.map((field) =>
                    field.kind === 'image' ? (
                      <ImageField
                        key={field.key}
                        label={field.label}
                        value={String(item[field.key] ?? '')}
                        onChange={(value) => replace(index, { ...item, [field.key]: value })}
                      />
                    ) : (
                      <Field
                        key={field.key}
                        label={field.label}
                        kind={field.kind === 'textarea' ? 'textarea' : 'text'}
                        rows={field.rows}
                        value={String(item[field.key] ?? '')}
                        onChange={(value) => replace(index, { ...item, [field.key]: value })}
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <p className="mono py-8 text-center text-[var(--grey-2)]">Nothing here yet.</p>
        )}
      </div>
    </div>
  );
};

export default CollectionEditor;
