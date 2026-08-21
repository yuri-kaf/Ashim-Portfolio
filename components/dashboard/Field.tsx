import React from 'react';

export type FieldKind = 'text' | 'textarea' | 'select';

interface FieldProps {
  label: string;
  value: string;
  kind?: FieldKind;
  options?: readonly string[];
  rows?: number;
  onChange: (value: string) => void;
}

const inputClass =
  'w-full rounded-xl border border-[var(--hairline)] bg-[var(--paper-pure)] px-4 py-3 text-sm outline-none focus:border-[var(--ink)]';

const Field: React.FC<FieldProps> = ({
  label,
  value,
  kind = 'text',
  options = [],
  rows = 4,
  onChange,
}) => (
  <label className="block">
    <span className="mono mb-2 block text-[var(--grey-1)]">{label}</span>
    {kind === 'textarea' ? (
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} resize-y leading-relaxed`}
      />
    ) : kind === 'select' ? (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    )}
  </label>
);

export default Field;
