import React from 'react';

export interface NavItem {
  key: string;
  label: string;
  /** Items in the collection. null for sections that are not a list. */
  count: number | null;
}

export interface NavGroup {
  id: string;
  /** null renders the items with no heading over them. */
  label: string | null;
  items: NavItem[];
}

interface DashboardNavProps {
  groups: NavGroup[];
  section: string;
  onSelect: (key: string) => void;
  /** Sections with at least one blocking issue, marked with a dot. */
  blockedSections: Set<string>;
  /**
   * Lay the same items out as one scrolling row instead of a column. Used
   * under 768px, where a rail would take most of the screen.
   */
  horizontal?: boolean;
}

/**
 * The section list, rendered from the same data in both layouts.
 *
 * One component rather than a rail and a separate mobile bar: two of them drift
 * the moment a section is added, and the one that drifts is always the one
 * nobody is looking at.
 */
const DashboardNav: React.FC<DashboardNavProps> = ({
  groups,
  section,
  onSelect,
  blockedSections,
  horizontal = false,
}) => {
  const item = (entry: NavItem) => {
    const active = section === entry.key;
    const blocked = blockedSections.has(entry.key);

    return (
      <button
        key={entry.key}
        onClick={() => onSelect(entry.key)}
        aria-current={active ? 'page' : undefined}
        className={`mono flex shrink-0 items-center gap-2 transition-colors ${
          horizontal
            ? 'rounded-full px-4 py-2'
            : 'w-full justify-between rounded-lg px-3 py-2 text-left'
        } ${
          active
            ? 'bg-[var(--ink)] text-[var(--paper)]'
            : 'text-[var(--grey-1)] hover:bg-[var(--paper-pure)] hover:text-[var(--ink)]'
        }`}
      >
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          {entry.label}
          {blocked && (
            <span
              // Ink on an active row would be invisible, so the dot inherits
              // the row's own text colour rather than carrying one of its own.
              className="inline-block h-1.5 w-1.5 rounded-full bg-current"
              title="Something here is blocking"
              aria-label="needs attention"
            />
          )}
        </span>
        {entry.count !== null && (
          <span className={active ? 'opacity-60' : 'text-[var(--grey-2)]'}>{entry.count}</span>
        )}
      </button>
    );
  };

  if (horizontal) {
    return (
      <div className="flex items-center gap-1.5 px-4 py-2.5">
        {groups.flatMap((group) => group.items).map(item)}
      </div>
    );
  }

  return (
    <nav className="space-y-6">
      {groups.map((group) => (
        <div key={group.id}>
          {group.label && (
            <p className="mono mb-2 px-3 text-[var(--grey-2)]">{group.label}</p>
          )}
          <div className="space-y-0.5">{group.items.map(item)}</div>
        </div>
      ))}
    </nav>
  );
};

export default DashboardNav;
