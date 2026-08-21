import React from 'react';

interface ListFieldProps {
  label: string;
  help?: string;
  value: string[];
  onChange: (value: string[]) => void;
}

/**
 * Edits a string array as one-per-line text.
 *
 * A textarea rather than a row of inputs with add/remove buttons: these lists
 * are short, and typing four lines beats four clicks. Blank lines are dropped
 * on the way out so a trailing newline never becomes an empty tag on the site.
 */
const ListField: React.FC<ListFieldProps> = ({ label, help, value, onChange }) => (
  <label className="block">
    <span className="mono mb-2 block text-[var(--grey-1)]">{label}</span>
    <textarea
      value={value.join('\n')}
      rows={Math.min(Math.max(value.length + 1, 3), 12)}
      onChange={(e) => onChange(e.target.value.split('\n'))}
      onBlur={(e) => onChange(e.target.value.split('\n').filter((line) => line.trim().length > 0))}
      className="w-full resize-y rounded-xl border border-[var(--hairline)] bg-[var(--paper-pure)] px-4 py-3 text-sm leading-relaxed outline-none focus:border-[var(--ink)]"
    />
    {help && <span className="mono mt-2 block text-[var(--grey-2)]">{help}</span>}
  </label>
);

export default ListField;
