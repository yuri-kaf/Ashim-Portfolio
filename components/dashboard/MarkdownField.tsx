import React, { useState } from 'react';
import { Eye, Pencil, Columns } from 'lucide-react';
import Markdown from '../Markdown';

interface MarkdownFieldProps {
  label: string;
  help?: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
}

type Mode = 'write' | 'split' | 'preview';

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** Headings drive the document outline, so the count is worth surfacing. */
const headingCount = (text: string) =>
  text.split('\n').filter((line) => /^#{2,3}\s+\S/.test(line.trim())).length;

/**
 * Markdown editor with a live preview.
 *
 * The preview renders through the same `Markdown` component the public post
 * uses, so what is shown here is what visitors get rather than an
 * approximation. The counters exist because these posts are written for search:
 * word count and heading count are the two things worth watching while writing.
 */
const MarkdownField: React.FC<MarkdownFieldProps> = ({
  label,
  help,
  value,
  rows = 18,
  onChange,
}) => {
  const [mode, setMode] = useState<Mode>('write');
  const headings = headingCount(value);
  const words = wordCount(value);

  const buttons: Array<{ key: Mode; icon: React.ReactNode; title: string }> = [
    { key: 'write', icon: <Pencil size={13} />, title: 'Write' },
    { key: 'split', icon: <Columns size={13} />, title: 'Write and preview' },
    { key: 'preview', icon: <Eye size={13} />, title: 'Preview' },
  ];

  const textarea = (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      placeholder={'## A section heading\n\nWrite in Markdown. **Bold**, _italic_, [links](https://example.com), lists and images all work.'}
      className="mono h-full w-full resize-y rounded-xl border border-[var(--hairline)] bg-[var(--paper-pure)] px-4 py-3 text-[12px] normal-case leading-relaxed tracking-normal outline-none focus:border-[var(--ink)]"
      style={{ fontSize: 12.5 }}
    />
  );

  const preview = (
    <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-[var(--hairline)] bg-[var(--paper-pure)] px-6 py-5">
      {value.trim() ? (
        <Markdown>{value}</Markdown>
      ) : (
        <p className="mono text-[var(--grey-2)]">Nothing to preview yet.</p>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <span className="mono text-[var(--grey-1)]">{label}</span>

        <div className="flex items-center gap-4">
          <span className="mono text-[var(--grey-2)]">
            {words} {words === 1 ? 'word' : 'words'} · {headings}{' '}
            {headings === 1 ? 'heading' : 'headings'}
          </span>
          <div className="btn-container-physical">
            {buttons.map((button) => (
              <button
                key={button.key}
                type="button"
                title={button.title}
                onClick={() => setMode(button.key)}
                className={`flex h-7 w-8 items-center justify-center rounded-full transition-colors ${
                  mode === button.key
                    ? 'bg-[var(--ink)] text-[var(--paper)]'
                    : 'text-[var(--grey-1)] hover:text-[var(--ink)]'
                }`}
              >
                {button.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === 'split' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {textarea}
          {preview}
        </div>
      ) : mode === 'preview' ? (
        preview
      ) : (
        textarea
      )}

      {help && <span className="mono mt-2 block text-[var(--grey-2)]">{help}</span>}

      {headings === 0 && words > 120 && (
        <span className="mono mt-2 block text-[var(--grey-1)]">
          No headings yet — a post this long reads better, and ranks better, split under ## headings.
        </span>
      )}
    </div>
  );
};

export default MarkdownField;
