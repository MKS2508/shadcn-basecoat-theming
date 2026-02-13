import { defineConfig } from 'rolldown';
import { builtinModules } from 'node:module';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
    banner: '#!/usr/bin/env node',
  },
  platform: 'node',
  external: [
    '@mks2508/better-logger',
    '@mks2508/shadcn-basecoat-theme-manager',
    /^shiki/,
    /^@shikijs/,
    /^@shiki-/,
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`),
  ],
});
