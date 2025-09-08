import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli-simple.tsx'],
  outDir: 'dist',
  target: 'node18',
  format: ['esm'],
  dts: false,
  splitting: false,
  clean: true
})