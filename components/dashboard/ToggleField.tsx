import React from 'react';

interface ToggleFieldProps {
  label: string;
  help?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const ToggleField: React.FC<ToggleFieldProps> = ({ label, help, value, onChange }) => (
  <div>
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex items-center gap-3"
    >
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          value ? 'bg-[var(--ink)]' : 'bg-[var(--grey-2)]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            value ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </span>
      <span className="mono text-[var(--grey-1)]">{label}</span>
    </button>
    {help && <span className="mono mt-2 block text-[var(--grey-2)]">{help}</span>}
  </div>
);

export default ToggleField;
