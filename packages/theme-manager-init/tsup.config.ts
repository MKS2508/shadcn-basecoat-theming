import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.tsx'],
  outDir: 'dist',
  target: 'node18',
  format: ['esm'],
  dts: false,
  splitting: false,
  clean: true
})