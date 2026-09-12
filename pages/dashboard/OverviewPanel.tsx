import React from 'react';
import { Check } from 'lucide-react';
import { PortfolioData } from '../../types';
import { Issue } from '../../lib/contentHealth';

interface OverviewPanelProps {
  data: PortfolioData;
  issues: Issue[];
  /** Jump to the section that fixes a thing. */
  onOpen: (section: string) => void;
}

/**
 * The tiles, in the order the work usually gets done. Keyed by the same
 * section names the navigation uses, so a tile and a nav row open the same
 * screen.
 */
const TILES: Array<{ section: keyof PortfolioData & string; label: string }> = [
  { section: 'projects', label: 'Projects' },
  { section: 'services', label: 'Services' },
  { section: 'blogs', label: 'Posts' },
  { section: 'blogCategories', label: 'Categories' },
  { section: 'gallery', label: 'Gallery' },
];

/**
 * What the dashboard is actually for: the size of the site, and the list of
 * things wrong with it.
 *
 * The issue list is the point. Counts alone are a vanity panel — they tell you
 * there are five case studies, not that none of the five is in the sitemap.
 */
const OverviewPanel: React.FC<OverviewPanelProps> = ({ data, issues, onOpen }) => {
  const blocking = issues.filter((issue) => issue.severity === 'blocking');
  const warnings = issues.filter((issue) => issue.severity === 'warning');

  return (
    <div className="space-y-10">
      <section>
        <p className="mono bracket mb-4 text-[var(--grey-1)]">What is on the site</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {TILES.map((tile) => (
            <button
              key={tile.section}
              onClick={() => onOpen(tile.section)}
              className="surface-inset group px-5 py-5 text-left"
            >
              <span className="block text-3xl tracking-tight">
                {((data[tile.section] as unknown[]) ?? []).length}
              </span>
              <span className="mono mt-2 block text-[var(--grey-1)] transition-colors group-hover:text-[var(--ink)]">
                {tile.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="mono bracket mb-4 text-[var(--grey-1)]">
          Needs attention
          {issues.length > 0 && ` — ${issues.length}`}
        </p>

        {issues.length === 0 ? (
          <div className="surface-inset flex items-center gap-3 px-5 py-6">
            <Check size={16} className="text-[var(--grey-1)]" />
            <p className="text-[var(--grey-1)]">
              Nothing to fix. Every page is indexable and every field that matters is filled in.
            </p>
          </div>
        ) : (
          <div className="surface-inset divide-y divide-[var(--hairline)] overflow-hidden">
            {[...blocking, ...warnings].map((issue) => (
              <button
                key={issue.id}
                onClick={() => onOpen(issue.section)}
                className="invert-row flex w-full items-start gap-4 px-5 py-4 text-left"
              >
                <span
                  // invert-dim is what keeps the quieter label readable once
                  // invert-row flips the row to ink on hover.
                  className={`mono mt-1 shrink-0 ${
                    issue.severity === 'blocking' ? '' : 'invert-dim text-[var(--grey-2)]'
                  }`}
                >
                  {issue.severity === 'blocking' ? 'Blocking' : 'Weak'}
                </span>
                <span className="flex-1 text-[15px] leading-snug">{issue.message}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default OverviewPanel;
