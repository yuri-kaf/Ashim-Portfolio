import { BlobNotFoundError, head, put } from '@vercel/blob';
import { sanitizePortfolioData } from '../../lib/sanitize.js';
import { PortfolioData } from '../../types.js';

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
 * Reads the stored content document, telling "nothing stored yet" apart from
 * "storage is failing right now".
 *
 * readContent() above folds both into null, which is right for the JSON API —
 * the SPA just keeps the seed it already rendered. It is wrong for the HTML
 * pages: rendering the seed during a Blob outage turns every real post into
 * a 404, and a crawler that sees a 404 drops the page. So this returns null
 * only when the document genuinely does not exist, and throws otherwise so
 * the caller can answer 503 and have the crawler come back later.
 */
export const readContentStrict = async (): Promise<PortfolioData | null> => {
  let url: string;
  try {
    url = (await head(CONTENT_PATH)).url;
  } catch (cause) {
    if (cause instanceof BlobNotFoundError) return null;
    // No token at all is a store that was never set up — the same state as
    // an empty one, and the site renders the seed there too.
    if (cause instanceof Error && /BLOB_READ_WRITE_TOKEN|No token found/i.test(cause.message)) return null;
    throw cause;
  }
  const response = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Content blob answered ${response.status}`);
  return sanitizePortfolioData(await response.json());
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
