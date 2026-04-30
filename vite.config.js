import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Custom plugin: copies src/service-worker.js → dist/sw.js after build */
const copyServiceWorker = {
  name: 'copy-service-worker',
  closeBundle() {
    try {
      mkdirSync(resolve(__dirname, 'dist'), { recursive: true });
      copyFileSync(
        resolve(__dirname, 'src/service-worker.js'),
        resolve(__dirname, 'dist/sw.js')
      );
      console.log('[vite] Copied service worker → dist/sw.js');
    } catch (e) {
      console.warn('[vite] Could not copy service worker:', e.message);
    }
  },
};

export default defineConfig({
  plugins: [copyServiceWorker],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
});
