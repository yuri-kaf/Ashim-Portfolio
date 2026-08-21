import { head, put } from '@vercel/blob';
import { sanitizePortfolioData } from '../../lib/sanitize';
import { PortfolioData } from '../../types';

export const CONTENT_PATH = 'content/portfolio.json';

/**
 * Reads the stored content document.
 *
 * Returns null when the blob does not exist yet — a fresh Blob store is a
 * normal state, not an error, and callers fall back to the bundled defaults.
 */
export const readContent = async (): Promise<PortfolioData | null> => {
  try {
    const metadata = await head(CONTENT_PATH);
    // Bypass the CDN copy: a save must be readable immediately afterwards.
    const response = await fetch(`${metadata.url}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return sanitizePortfolioData(await response.json());
  } catch {
    return null;
  }
};

/**
 * Overwrites the content document. `addRandomSuffix: false` with
 * `allowOverwrite: true` keeps the pathname stable, so `head()` above always
 * resolves the current version.
 */
export const writeContent = async (data: PortfolioData): Promise<void> => {
  await put(CONTENT_PATH, JSON.stringify(data, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
};
