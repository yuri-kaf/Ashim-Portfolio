import React from 'react';
import { Loader2 } from 'lucide-react';

interface SaveBarProps {
  dirty: boolean;
  saving: boolean;
  error: string | null;
  savedAt: number | null;
  onSave: () => void;
  onDiscard: () => void;
}

const SaveBar: React.FC<SaveBarProps> = ({ dirty, saving, error, savedAt, onSave, onDiscard }) => (
  <div className="sticky bottom-0 z-50 -mx-5 mt-16 border-t border-[var(--hairline)] bg-[var(--paper)]/95 px-5 py-4 backdrop-blur md:-mx-10 md:px-10">
    <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4">
      <p className="mono text-[var(--grey-1)]">
        {error
          ? error
          : saving
            ? 'Saving'
            : dirty
              ? 'Unsaved changes'
              : savedAt
                ? `Saved ${new Date(savedAt).toLocaleTimeString()}`
                : 'No changes'}
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={onDiscard}
          disabled={!dirty || saving}
          className="mono text-[var(--grey-1)] transition-opacity hover:text-[var(--ink)] disabled:opacity-40"
        >
          Discard
        </button>
        <button
          onClick={onSave}
          disabled={!dirty || saving}
          className="mono flex items-center gap-2 rounded-full bg-[var(--ink)] px-7 py-3 text-[var(--paper)] transition-opacity disabled:opacity-40"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving' : 'Save'}
        </button>
      </div>
    </div>
  </div>
);

export default SaveBar;
