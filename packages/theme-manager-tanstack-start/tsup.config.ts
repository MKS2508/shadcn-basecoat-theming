import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@tanstack/react-start',
    '@tanstack/react-start/server',
    'fs/promises',
    'path'
  ],
  splitting: false,
  sourcemap: true,
  skipNodeModulesBundle: true,
});