import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import BrowserLoggerPlugin from '../../vite-plugin-browser-logger.js';

export default defineConfig({
  plugins: [
    tailwindcss(), 
    BrowserLoggerPlugin()
  ],
  assetsInclude: ['**/*.html'], // Enable .html file imports with ?raw
  css: {
    devSourcemap: true,
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});