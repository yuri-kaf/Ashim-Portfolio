/**
 * Uploads the bundled INITIAL_DATA to Blob as the starting content document.
 *
 * Optional: GET /api/content already falls back to INITIAL_DATA when the blob
 * is absent, and the first dashboard save creates it. Seeding is only useful
 * if you want the document to exist before then.
 *
 * Requires BLOB_READ_WRITE_TOKEN in the environment. Get it from
 * Vercel -> Project -> Storage -> your Blob store, or `vercel env pull`.
 * Refuses to overwrite existing content unless --force.
 *
 * Usage: npm run seed [-- --force]
 */
import { head, put } from '@vercel/blob';
import { build } from 'esbuild';

const CONTENT_PATH = 'content/portfolio.json';

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN is not set. Create the Blob store first.');
  process.exit(1);
}

const force = process.argv.includes('--force');

let existing = null;
try {
  existing = await head(CONTENT_PATH);
} catch {
  // Not found is the expected path on a fresh store.
}

if (existing && !force) {
  console.error(
    `${CONTENT_PATH} already exists. Re-run with --force to overwrite it — ` +
      'this discards any edits made through the dashboard.',
  );
  process.exit(1);
}

/**
 * constants.ts is TypeScript, which plain Node cannot import. Bundle it in
 * memory with esbuild — already present as a Vite dependency — rather than
 * adding a TS runner. vite-node was the obvious choice but its rolldown
 * dependency needs Node >= 20.12.
 */
const bundled = await build({
  entryPoints: ['constants.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  logLevel: 'silent',
});

const dataUrl =
  'data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64');
const { INITIAL_DATA } = await import(dataUrl);

let blob;
try {
  blob = await put(CONTENT_PATH, JSON.stringify(INITIAL_DATA, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
} catch (cause) {
  console.error(`Upload failed: ${cause.message}`);
  console.error(
    'If this says the store was not found, BLOB_READ_WRITE_TOKEN is wrong or belongs to\n' +
      'another project. Re-pull it with `vercel env pull` or copy it from the Blob store page.',
  );
  process.exit(1);
}

console.log(`Seeded ${blob.pathname} (${blob.url})`);
console.log(
  `${INITIAL_DATA.projects.length} projects, ${INITIAL_DATA.services.length} services, ` +
    `${INITIAL_DATA.blogs.length} journal entries, ${INITIAL_DATA.gallery.length} gallery items.`,
);
