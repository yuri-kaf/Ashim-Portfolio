/**
 * Content dates are typed by hand in the dashboard — "Sept 14, 2026",
 * "Oct 12, 2024", sometimes "2026-09-14" — and shown to readers exactly as
 * typed. Structured data and the sitemap need ISO 8601 instead: schema.org's
 * datePublished rejects "Sept 14, 2026", and a sitemap <lastmod> in that
 * shape is ignored.
 */

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * YYYY-MM-DD, or null when the value is not a date we can trust.
 *
 * Timezone-proof on purpose. `new Date('Sept 14, 2026')` is local midnight
 * and `new Date('2026-09-14')` is UTC midnight, so the usual
 * `toISOString().slice(0, 10)` answers the 13th for one of them depending on
 * where the code runs — Kathmandu on a laptop, Washington on the build
 * machine. An ISO date is passed through untouched and anything else is read
 * back in the same local calendar it was parsed in.
 */
export const isoDate = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

/** Newest first; undated entries sort last, keeping their original order. */
export const byNewest = <T extends { date?: string }>(entries: T[]): T[] =>
  entries
    .map((entry, index) => ({ entry, index, iso: isoDate(entry.date) }))
    .sort((a, b) => {
      if (a.iso && b.iso && a.iso !== b.iso) return a.iso < b.iso ? 1 : -1;
      if (a.iso && !b.iso) return -1;
      if (!a.iso && b.iso) return 1;
      return a.index - b.index;
    })
    .map(({ entry }) => entry);
