import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Vercel runs api/ as native Node ESM, one compiled file per source file, and
 * Node's ESM loader does not guess extensions: `import './dates'` is a
 * "Cannot find module" at runtime, even though Vite, vitest and tsc all
 * resolve it happily. The first deploy of api/page.ts failed on exactly
 * that, with every test green.
 *
 * So this walks every file the functions can reach and fails on any
 * relative import without an explicit `.js`.
 */

const ROOT = resolve(__dirname, '..');
const ENTRIES = ['api/page.ts', 'api/sitemap.ts', 'api/content.ts', 'api/upload.ts'];
const IMPORT = /(?:import|export)\s[^'"]*?from\s+['"](\.{1,2}\/[^'"]+)['"]/g;

const reachable = (): Map<string, string[]> => {
  const seen = new Map<string, string[]>();
  const queue = ENTRIES.map((entry) => join(ROOT, entry));
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    const source = readFileSync(file, 'utf8');
    const specifiers = [...source.matchAll(IMPORT)].map((match) => match[1]);
    seen.set(file, specifiers);
    for (const specifier of specifiers) {
      const target = resolve(dirname(file), specifier).replace(/\.js$/, '.ts');
      if (existsSync(target)) queue.push(target);
    }
  }
  return seen;
};

describe('server imports', () => {
  it('gives every relative import an explicit .js extension', () => {
    const missing: string[] = [];
    for (const [file, specifiers] of reachable()) {
      for (const specifier of specifiers) {
        if (!specifier.endsWith('.js')) missing.push(`${relative(ROOT, file)} → ${specifier}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('reaches the renderer, so the check covers the shared lib code', () => {
    const files = [...reachable().keys()].map((file) => relative(ROOT, file).replace(/\\/g, '/'));
    expect(files).toContain('lib/renderHtml.ts');
    expect(files).toContain('lib/pageMeta.ts');
  });
});
