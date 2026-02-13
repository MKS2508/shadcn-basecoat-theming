import { defineConfig } from 'rolldown';

export default defineConfig({
  input: {
    'index': 'src/index.tsx',
    'nextjs/index': 'src/nextjs/index.ts',
    'ssr/index': 'src/ssr/index.ts',
    'tanstack-start/index': 'src/tanstack-start/index.ts',
  },
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
    banner: '"use client";',
  },
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@mks2508/shadcn-basecoat-theme-manager',
    '@mks2508/mks-ui',
    '@mks2508/mks-ui/react',
    'lucide-react',
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
    'next',
    'next/navigation',
    'next/headers',
    '@tanstack/react-start',
    '@tanstack/react-start/server',
    'fs/promises',
    'path',
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  jsx: {
    runtime: 'automatic',
  },
});
