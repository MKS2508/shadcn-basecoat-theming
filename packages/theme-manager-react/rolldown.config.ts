import { defineConfig } from 'rolldown';

/**
 * Shared rolldown options for both client and server builds.
 *
 * `external` marks everything that must not be bundled (React, the basecoat
 * core, mks-ui, TanStack Start server primitives, Node fs/path for the server
 * entry).
 */
const shared = {
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
};

export default defineConfig([
  {
    // Client entries — built WITH the "use client" banner so consumers' RSC
    // bundlers treat these chunks as client components.
    input: {
      index: 'src/index.tsx',
      'nextjs/index': 'src/nextjs/index.ts',
      'ssr/index': 'src/ssr/index.ts',
      'tanstack-start/index': 'src/tanstack-start/index.ts',
    },
    output: {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
      banner: '"use client"',
      // Force the framework-agnostic animation core (`hooks/animate-transition`,
      // which also hosts ANIMATION_PRESETS / DIRECTIONAL_PRESETS /
      // DIRECTION_OPTIONS) into its own chunk. Without this, rolldown bundles
      // it inside the classic-entry chunk (`src-*.js`), which also contains
      // `lucide-react`-using components (SettingsModal, AnimationSettings, …).
      // The SSR barrel/chunk would then transitively import that classic chunk
      // and drag `lucide-react` into every SSR consumer. Keeping the animation
      // core in a `lucide-react`-free shared chunk lets the SSR entry depend
      // on it without the classic entry's icon dependency.
      manualChunks(id) {
        if (id.includes('/hooks/animate-transition')) return 'animation';
      },
    },
    ...shared,
    jsx: {
      runtime: 'automatic',
    },
  },
  {
    // Server entry — TanStack Start createServerFn + getCookie. Must NOT carry
    // the "use client" banner (would break the server/client boundary).
    input: {
      'tanstack-start/server': 'src/tanstack-start/server.ts',
    },
    output: {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
    },
    ...shared,
  },
]);
