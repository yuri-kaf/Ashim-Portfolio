import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dependencies that change only when they are upgraded, split out of the app
 * chunk so an ordinary copy or component edit does not invalidate them in a
 * returning visitor's cache. React, the router and motion together are a large
 * and very stable block; everything else stays with the code that imports it.
 */
const VENDOR_CHUNKS: Record<string, RegExp> = {
  'vendor-react': /[\/]node_modules[\/](react|react-dom|scheduler|react-router|react-router-dom)[\/]/,
  'vendor-motion': /[\/]node_modules[\/](motion|motion-dom|motion-utils|framer-motion)[\/]/,
};

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id: string) {
              if (!id.includes('node_modules')) return;
              for (const [name, pattern] of Object.entries(VENDOR_CHUNKS)) {
                if (pattern.test(id)) return name;
              }
            },
          },
        },
      },
    };
});
