import React, { useRef, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { uploadImage } from '../../services/uploadApi';

interface ImagesFieldProps {
  label: string;
  help?: string;
  value: string[];
  onChange: (value: string[]) => void;
}

/** Multiple images for one record, uploaded straight to Blob. */
const ImagesField: React.FC<ImagesFieldProps> = ({ label, help, value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      // Sequential rather than parallel: each upload mints its own token, and
      // a serial queue keeps a partial failure easy to reason about.
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadImage(file));
      }
      onChange([...value, ...urls]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <span className="mono mb-2 block text-[var(--grey-1)]">{label}</span>

      <div className="flex flex-wrap gap-3">
        {value.map((url, index) => (
          <div key={`${url}-${index}`} className="group relative">
            <img src={url} alt="" className="h-20 w-20 rounded-xl object-cover" />
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--paper)] opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="mono flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--hairline)] text-[var(--grey-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)] disabled:opacity-40"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {busy ? 'Wait' : 'Add'}
        </button>
      </div>

      {help && <span className="mono mt-2 block text-[var(--grey-2)]">{help}</span>}
      {error && (
        <p role="alert" className="mono mt-2 text-[var(--ink)]">
          {error}
        </p>
      )}
    </div>
  );
};

export default ImagesField;
