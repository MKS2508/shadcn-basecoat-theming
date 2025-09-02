# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server on port 3000 with hot reload
- `npm run build` - Build production bundle with TypeScript compilation and Vite optimization
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript type checking without emitting files
- `npm run install-theme <url>` - Install a theme from TweakCN or any shadcn-compatible JSON URL

## Architecture

### Theme System
This project uses a CSS-class-based theme switching system with CSS custom properties (variables). Themes are applied by adding/removing CSS classes on the document root element.

**Core Architecture:**
- **CSS Variables**: All themes use CSS custom properties defined in `src/style.css`
- **Class-based switching**: Themes are switched by applying CSS classes (`.dark`, `.monochrome`, `.monochrome-dark`, `.cyberpunk`)
- **No lazy loading**: All theme CSS is bundled in the main stylesheet for instant switching
- **ThemeManager**: Central class (`src/theme-manager.ts`) handles theme switching, persistence, and system preference detection

**Theme Structure:**
Each theme must define these CSS variables:
- Color system: `--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--muted`, `--destructive`
- UI elements: `--card`, `--popover`, `--border`, `--input`, `--ring`
- Typography: `--font-sans`, `--font-serif`, `--font-mono` (optional)
- Spacing: `--radius`, `--spacing` (optional)
- Shadows: `--shadow-*` variants (optional)

### Adding New Themes

#### Method 1: Using the custom install script (Recommended)
```bash
# Install from TweakCN
npm run install-theme https://tweakcn.com/r/themes/retro-arcade.json
npm run install-theme https://tweakcn.com/r/themes/kodama-grove.json

# Script automatically:
# - Downloads and parses the theme JSON
# - Adds CSS variables to src/style.css
# - Updates ThemeManager configuration
# - Handles both light and dark variants
```

#### Method 2: Manual installation
1. **Add CSS variables** to `src/style.css`:
```css
.theme-name {
  --background: oklch(...);
  --foreground: oklch(...);
  /* ... all required variables */
}
```

2. **Register in ThemeManager** (`src/theme-manager.ts`):
```typescript
export const THEMES: Record<string, ThemeConfig> = {
  'theme-name': {
    name: 'theme-name',
    label: 'Display Name',
    cssFile: 'theme-name'
  }
};
```

Note: The dropdown is now dynamically generated from the THEMES configuration, so no manual HTML updates are needed.

### Color Format Support
- **HSL**: Default format for shadcn/ui compatibility (`221.2 83.2% 53.3%`)
- **OKLCH**: Modern perceptual color space (`oklch(0.5555 0 0)`)
- **RGB/HEX**: Converted to HSL/OKLCH for consistency

### Key Components

- **ThemeManager** (`src/theme-manager.ts`): Core theme switching logic
- **DropdownManager** (`src/dropdown-manager.ts`): Handles theme selector dropdown
- **Main entry** (`src/main.ts`): Initializes application and theme system

## Theme Installation & Management

### Installing Themes from TweakCN
The project includes a custom script (`scripts/install-theme.ts`) that properly handles theme installation:

```bash
# Install themes using the custom script
npm run install-theme https://tweakcn.com/r/themes/retro-arcade.json
npm run install-theme https://tweakcn.com/r/themes/kodama-grove.json

# The script handles:
# - Fetching theme data from TweakCN
# - Parsing OKLCH/HSL color values
# - Adding CSS variables to src/style.css
# - Updating ThemeManager configuration
# - Supporting both light and dark variants
```

### Basecoat UI Integration
Basecoat CSS is properly imported in `src/style.css` and provides:
- Base component styles
- Utility classes
- Design tokens that work with the CSS variable system

### Dynamic Theme System
- **Auto-detection**: Themes are automatically detected from the THEMES configuration
- **Dynamic dropdown**: Theme options are generated dynamically in the UI
- **No manual HTML updates**: Adding a theme to THEMES automatically adds it to the dropdown

## Tailwind CSS v4 Configuration
- Uses `@tailwindcss/vite` plugin for direct CSS processing
- No separate `tailwind.config.js` - configuration via CSS
- CSS-in-JS approach with `@import 'tailwindcss'`

## Performance Considerations
- All themes bundled in main CSS (~5KB per theme)
- Instant theme switching via CSS classes (no network requests)
- FOUC prevention via inline script in HTML head
- localStorage persistence for theme preference

## Testing Checklist
When modifying the theme system:
1. Verify all theme switches work without FOUC
2. Check localStorage persistence across page reloads
3. Test system preference detection (auto mode)
4. Validate all CSS variables are defined for each theme
5. Ensure keyboard navigation works in theme dropdown

## Known Limitations
- All themes increase initial bundle size (but provides instant switching)
- Some TweakCN themes may not be available (404 errors)
- Custom fonts specified in themes need to be loaded separately

## File Structure
```
src/
├── theme-manager.ts    # Theme switching logic
├── dropdown-manager.ts # Dropdown UI handling
├── main.ts            # Application entry
├── style.css          # All theme definitions
└── lib/utils.ts       # Utility functions
```