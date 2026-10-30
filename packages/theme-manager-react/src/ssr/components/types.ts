/**
 * Shared types for the pre-built SSR components.
 *
 * @module ssr/components/types
 */

import type * as React from 'react';

/**
 * Contract every icon passed to the SSR components must satisfy.
 *
 * Matches `lucide-react` / `lucie-animated` icon components and any custom
 * SVG wrapper — they all accept a `className` and render an `<svg>`. Injecting
 * icons via props (instead of hard-importing `lucide-react`) keeps the package
 * free of a hard icon-library dependency: the consumer chooses its own icon
 * source (see REGLA 14 — `lucide-animated` preferred in the mks stack).
 */
export type SSRThemeIconType = React.ComponentType<{ className?: string }>;
