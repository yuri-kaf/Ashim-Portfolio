import { sanitizePortfolioData } from '../lib/sanitize';
import { PortfolioData } from '../types';

/**
 * Fetches published content. Returns null on any failure — the caller keeps
 * showing the bundled defaults rather than an error state, because a
 * portfolio that renders slightly stale content beats one that renders nothing.
 */
export const fetchContent = async (): Promise<PortfolioData | null> => {
  try {
    const response = await fetch('/api/content', { headers: { accept: 'application/json' } });
    if (!response.ok) return null;
    return sanitizePortfolioData(await response.json());
  } catch {
    return null;
  }
};

/** Persists the whole document. Requires an authenticated session cookie. */
export const saveContent = async (data: PortfolioData): Promise<PortfolioData> => {
  const response = await fetch('/api/content', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error ?? `Save failed with status ${response.status}`);
  }

  return sanitizePortfolioData((await response.json()).data);
};
