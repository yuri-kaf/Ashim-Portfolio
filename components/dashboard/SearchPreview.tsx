import React from 'react';

interface SearchPreviewProps {
  siteUrl: string;
  path: string;
  title: string;
  description: string;
}

/** Google truncates around these lengths; the preview clips to match. */
const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;

const clip = (value: string, limit: number) =>
  value.length > limit ? `${value.slice(0, limit - 1).trimEnd()}…` : value;

/**
 * Approximates how a page will appear in search results and when shared.
 *
 * Worth building because the fields that drive it (SEO title, meta
 * description) are otherwise invisible until after publishing — the effect of
 * editing them is impossible to judge from the inputs alone.
 */
const SearchPreview: React.FC<SearchPreviewProps> = ({ siteUrl, path, title, description }) => {
  const host = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div className="surface-inset p-5">
      <p className="mono mb-4 text-[var(--grey-1)]">Search result preview</p>

      <div className="max-w-xl">
        <p className="mb-1 text-[12px] text-[var(--grey-1)]">
          {host}
          <span className="text-[var(--grey-2)]">{path}</span>
        </p>
        <p className="mb-1 text-lg leading-snug text-[#1a0dab]">
          {clip(title, TITLE_LIMIT) || 'Untitled'}
        </p>
        <p className="text-sm leading-relaxed text-[var(--grey-1)]">
          {clip(description, DESCRIPTION_LIMIT) || 'No description yet.'}
        </p>
      </div>
    </div>
  );
};

export default SearchPreview;
