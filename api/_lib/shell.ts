import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * The Vite-built index.html — hashed script and stylesheet names and all —
 * that every page is poured into.
 *
 * scripts/prerender.mjs moves it from dist/index.html to dist/_shell.html
 * after the build, because a file at dist/index.html would be served
 * statically for `/` and the home page would never reach api/page.ts.
 * vercel.json bundles it into the function with `includeFiles`; Vercel
 * compiles the functions after the build command, so the file exists by then.
 */
export const SHELL_PATH = join('dist', '_shell.html');

let cached: string | null = null;

/**
 * Reads the shell from the function bundle, falling back to fetching it from
 * the deployment itself. The fallback is only there in case the bundle ever
 * ships without the file; it is served as a static asset either way.
 */
export const loadShell = async (origin: string): Promise<string> => {
  if (cached) return cached;
  try {
    cached = await readFile(join(process.cwd(), SHELL_PATH), 'utf8');
    return cached;
  } catch {
    const response = await fetch(`${origin}/_shell.html`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Shell unavailable: ${response.status}`);
    cached = await response.text();
    return cached;
  }
};

/**
 * The build date scripts/prerender.mjs stamps into the shell. The sitemap
 * uses it as <lastmod> for pages that only change on deploy; stamping the
 * request date instead would claim every page changed every day, and Google
 * stops trusting a lastmod that does that.
 */
export const buildDateOf = (shell: string): string => {
  const stamp = /<!-- built (\d{4}-\d{2}-\d{2}) -->/.exec(shell);
  return stamp ? stamp[1] : new Date().toISOString().slice(0, 10);
};

/** For tests. */
export const resetShellCache = () => {
  cached = null;
};
