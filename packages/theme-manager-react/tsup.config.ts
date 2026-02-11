import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.tsx',
    'nextjs/index': 'src/nextjs/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'es2020',
  minify: false,
  external: [
    'react',
    'react-dom',
    '@mks2508/shadcn-basecoat-theme-manager',
    '@mks2508/mks-ui',
    'lucide-react',
    // Next.js externals
    'next',
    'next/navigation',
    'next/headers'
  ],
  banner: {
    js: '"use client";'
  },
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.jsxDev = false
  }
});