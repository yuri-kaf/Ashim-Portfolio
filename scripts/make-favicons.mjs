/**
 * Generates the favicon set in public/ from one hand-drawn SVG mark.
 *
 * Run with `node scripts/make-favicons.mjs` after changing the mark; the
 * output is committed, so the build does not depend on sharp.
 *
 * The letters are drawn as paths rather than set in a font: an SVG favicon
 * is rendered by the browser with whatever fonts it has, and "AK" in a
 * fallback serif is not the mark. Monochrome to match the site — ink square,
 * paper letters.
 *
 * Google shows the favicon beside every mobile result and asks for a square
 * that is a multiple of 48px, so favicon.ico carries 48, 32 and 16.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const PUBLIC = 'public';
const INK = '#0a0a0a';
const PAPER = '#eeedea';

// 48 × 48 grid. The A carries its counter as an even-odd hole.
const A =
  'M12.6 13.5 H17.6 L24 34.5 H19.2 L18 30.4 H12.2 L11 34.5 H6.2 Z M13.3 26.4 H16.9 L15.1 20.2 Z';
const K =
  'M25.6 13.5 H30.1 V22.2 L35.9 13.5 H41.1 L34.4 23.4 L41.7 34.5 H36.4 L31.4 26.9 L30.1 28.7 V34.5 H25.6 Z';

const svg = (size, radius = 10) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="${radius}" fill="${INK}"/>
  <path d="${A}" fill="${PAPER}" fill-rule="evenodd"/>
  <path d="${K}" fill="${PAPER}"/>
</svg>
`;

const png = (size, radius) => sharp(Buffer.from(svg(size, radius))).resize(size, size).png().toBuffer();

/** An .ico is a directory of images; modern ones may simply embed PNGs. */
const ico = (images) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(entry);
  }
  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
};

await mkdir(PUBLIC, { recursive: true });
await writeFile(join(PUBLIC, 'favicon.svg'), svg(48));

const icoSizes = [48, 32, 16];
await writeFile(
  join(PUBLIC, 'favicon.ico'),
  ico(await Promise.all(icoSizes.map(async (size) => ({ size, data: await png(size) })))),
);
await writeFile(join(PUBLIC, 'favicon-48x48.png'), await png(48));
// iOS masks its own corners; a square tile avoids a double rounding.
await writeFile(join(PUBLIC, 'apple-touch-icon.png'), await png(180, 0));
await writeFile(join(PUBLIC, 'icon-192.png'), await png(192));
await writeFile(join(PUBLIC, 'icon-512.png'), await png(512));
await writeFile(
  join(PUBLIC, 'site.webmanifest'),
  `${JSON.stringify(
    {
      name: 'Ashim Kafle',
      short_name: 'Ashim Kafle',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      theme_color: INK,
      background_color: INK,
      display: 'browser',
    },
    null,
    2,
  )}\n`,
);

console.log('favicons written to public/');
