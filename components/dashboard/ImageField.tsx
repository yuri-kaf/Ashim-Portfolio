import React, { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { uploadImage } from '../../services/uploadApi';

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

const ImageField: React.FC<ImageFieldProps> = ({ label, value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="mono mb-2 block text-[var(--grey-1)]">{label}</span>

      <div className="flex items-start gap-4">
        {value ? (
          <img
            src={value}
            alt=""
            className="h-24 w-24 shrink-0 rounded-xl object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.opacity = '0.2';
            }}
          />
        ) : (
          <div className="mono flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-dashed border-[var(--hairline)] text-[var(--grey-2)]">
            None
          </div>
        )}

        <div className="flex-1">
          {/* The URL field stays alongside the button on purpose: existing
              content points at Unsplash, so pasting a URL must keep working. */}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste a URL, or upload"
            className="mb-3 w-full rounded-xl border border-[var(--hairline)] bg-[var(--paper-pure)] px-4 py-3 text-sm outline-none focus:border-[var(--ink)]"
          />

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="mono flex items-center gap-2 rounded-full border border-[var(--hairline)] px-5 py-2.5 transition-colors hover:border-[var(--ink)] disabled:opacity-40"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {busy ? 'Uploading' : 'Upload'}
          </button>

          {error && (
            <p role="alert" className="mono mt-2 text-[var(--ink)]">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageField;
