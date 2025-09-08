// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://mks2508.github.io',
  base: process.env.NODE_ENV === 'production' ? '/shadcn-basecoat-theming/astro' : '/',
  outDir: process.env.NODE_ENV === 'production' ? '../../dist/astro' : './dist',
  vite: {
    plugins: [tailwindcss()]
  }
});