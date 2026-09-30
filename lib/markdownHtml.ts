/**
 * Minimal Markdown to HTML for the crawler-visible body api/page.ts sends.
 *
 * Not the renderer visitors see — components/Markdown.tsx does that with
 * react-markdown once the SPA boots. This only has to produce honest,
 * well-formed markup for the same text: headings, paragraphs, lists, tables,
 * quotes and inline links/emphasis.
 *
 * Everything is escaped before any tag is added, so a body containing
 * `<script>` or a bare `&` can never produce markup here; the patterns below
 * only ever wrap text in tags this file wrote itself.
 */

import { isMostlyDevanagari } from './lang.js';

/** ` lang="ne"` on a block that is mostly Nepali, nothing otherwise. */
const langAttr = (raw: string): string => (isMostlyDevanagari(raw) ? ' lang="ne"' : '');

export const escapeHtml = (value: unknown = ''): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** A link target is kept only if it is a path, an anchor or http(s)/mailto/tel. */
const safeHref = (href: string): string | null =>
  /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(href) ? href : null;

/** Inline Markdown, applied to already-escaped text. */
export const inline = (escaped: string): string =>
  escaped
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label: string, href: string) => {
      const target = safeHref(href.replace(/&amp;/g, '&'));
      return target ? `<a href="${escapeHtml(target)}">${label}</a>` : label;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

export const text = (value: unknown): string => inline(escapeHtml(value));

const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isTableDivider = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
const cells = (line: string) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());

const table = (lines: string[]): string => {
  const [header, , ...rows] = lines;
  const head = cells(header).map((cell) => `<th>${text(cell)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${cells(row).map((cell) => `<td>${text(cell)}</td>`).join('')}</tr>`)
    .join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
};

/**
 * @param demote how many levels to push headings down. The page writes its
 *   own <h1>, so a body heading must never become a second one — `# Title`
 *   in a post body renders as <h2>.
 */
export const markdownToHtml = (markdown = '', demote = 1): string =>
  String(markdown ?? '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => {
      const body = block.trim();
      if (!body) return '';
      const lines = body.split('\n');

      const heading = /^(#{1,6})\s+(.*)$/.exec(body);
      if (heading && lines.length === 1) {
        const level = Math.min(Math.max(heading[1].length + demote, 2), 6);
        return `<h${level}${langAttr(heading[2])}>${text(heading[2])}</h${level}>`;
      }
      if (/^(-{3,}|\*{3,})$/.test(body)) return '<hr>';
      if (lines.length >= 2 && isTableRow(lines[0]) && isTableDivider(lines[1])) {
        return table(lines.filter((line) => line.trim()));
      }
      if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
        return `<ul>${lines
          .map((line) => {
            const item = line.replace(/^\s*[-*]\s+/, '');
            return `<li${langAttr(item)}>${text(item)}</li>`;
          })
          .join('')}</ul>`;
      }
      if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
        return `<ol>${lines
          .map((line) => `<li>${text(line.replace(/^\s*\d+[.)]\s+/, ''))}</li>`)
          .join('')}</ol>`;
      }
      if (lines.every((line) => /^>\s?/.test(line))) {
        return `<blockquote><p>${text(lines.map((line) => line.replace(/^>\s?/, '')).join(' '))}</p></blockquote>`;
      }
      // A heading followed directly by its paragraph, with no blank line.
      if (heading) {
        const level = Math.min(Math.max(heading[1].length + demote, 2), 6);
        return `<h${level}>${text(heading[2])}</h${level}>${markdownToHtml(lines.slice(1).join('\n'), demote)}`;
      }
      const paragraph = lines.join(' ');
      return `<p${langAttr(paragraph)}>${text(paragraph)}</p>`;
    })
    .filter(Boolean)
    .join('\n');
