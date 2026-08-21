import React from 'react';

export type FieldKind = 'text' | 'textarea' | 'select';

interface FieldProps {
  label: string;
  value: string;
  kind?: FieldKind;
  options?: readonly string[];
  rows?: number;
  help?: string;
  /** Soft budget: shows a counter and flags going over, never blocks typing. */
  recommendedMax?: number;
  placeholder?: string;
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
  help,
  recommendedMax,
  placeholder,
  onChange,
}) => {
  const over = recommendedMax !== undefined && value.length > recommendedMax;

  return (
    <label className="block">
      <span className="mono mb-2 flex items-center justify-between gap-3 text-[var(--grey-1)]">
        <span>{label}</span>
        {recommendedMax !== undefined && (
          // Advisory only: search engines truncate rather than reject, so the
          // right behaviour is to inform, not to enforce.
          <span className={over ? 'text-[var(--ink)]' : 'text-[var(--grey-2)]'}>
            {value.length}/{recommendedMax}
          </span>
        )}
      </span>

      {kind === 'textarea' ? (
        <textarea
          value={value}
          rows={rows}
          placeholder={placeholder}
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
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}

      {(help || over) && (
        <span className="mono mt-2 block text-[var(--grey-2)]">
          {over ? `Longer than ${recommendedMax} characters — likely to be truncated. ` : ''}
          {help}
        </span>
      )}
    </label>
  );
};

export default Field;
