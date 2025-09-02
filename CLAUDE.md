# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server on port 3000 with hot reload
- `npm run dev:logger` - Start WebSocket logging server for remote browser debugging
- `npm run build` - Build production bundle with TypeScript compilation and Vite optimization
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript type checking without emitting files
- `npm run install-theme <url>` - Install a theme from TweakCN or any shadcn-compatible JSON URL

### Remote Debugging Workflow
```bash
# Terminal 1: Start WebSocket logger server
npm run dev:logger

# Terminal 2: Start development server (logs appear in Terminal 1)
npm run dev

# Result: All browser console.* logs appear in Terminal 1 with timestamps
# Supports: console.log, console.error, console.warn, console.info, console.debug
# Includes: @mks2508/better-logger styled logs with categories and stack traces
```

## Architecture

### Modular Component System
This project uses a **modular component architecture** with TypeScript classes, template-based rendering, and advanced logging.

**Core Architecture:**
- **BaseComponent**: Foundation class for all UI components with automatic event cleanup
- **ModalComponent**: Specialized base for modal dialogs with z-index management
- **Template System**: Static HTML template imports using `*.html?raw` for optimal bundling
- **AppController**: Central coordinator managing all components and application state
- **Advanced Logging**: @mks2508/better-logger with categorized, styled console output
- **WebSocket Debugging**: Remote logging system for browser console output in terminal

### Theme System
This project uses a **dynamic CSS loading system** with performance optimization and font management.

**Theme Architecture:**
- **Dynamic CSS Loading**: Themes loaded as separate CSS files from `src/themes/`
- **CSS Variable Injection**: CSS custom properties applied directly to `:root`
- **Font Management**: Automatic Google Fonts loading with caching and fallbacks
- **Performance Tracking**: Built-in performance metrics for theme switching
- **ThemeRegistry**: Centralized theme management with IndexedDB caching

**Theme Structure:**
Each theme must define these CSS variables:
- **Color System**: `--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--muted`, `--destructive`
- **UI Elements**: `--card`, `--popover`, `--border`, `--input`, `--ring`  
- **Typography**: `--font-sans`, `--font-serif`, `--font-mono` (with Google Fonts integration)
- **Spacing & Layout**: `--radius` for consistent border-radius
- **Interactive States**: `--primary-foreground`, `--muted-foreground`, etc.

**Font System:**
- **Font Overrides**: User-configurable font selection with theme defaults
- **Google Fonts Integration**: Automatic loading of external fonts with performance optimization
- **Font Categories**: Sans-serif, Serif, Monospace with curated font catalog
- **Fallback System**: Comprehensive font stacks for all categories

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

#### Core System
- **AppController** (`src/components/app-controller.ts`): Main application coordinator
- **ThemeManager** (`src/theme-manager.ts`): Dynamic theme loading and CSS variable management
- **FontManager** (`src/font-manager.ts`): Font override system with Google Fonts integration
- **ThemeRegistry** (`src/theme-registry.ts`): Centralized theme catalog with IndexedDB storage

#### UI Components
- **ThemeDropdown** (`src/components/theme-dropdown.ts`): Dynamic theme selector with fallback rendering
- **FontSelectorModal** (`src/components/font-selector-modal.ts`): Font customization interface
- **ThemeInstaller** (`src/theme-installer.ts`): Theme installation from URLs
- **ThemeManagementModal** (`src/components/theme-management-modal.ts`): Installed theme management

#### Utilities & Infrastructure
- **BaseComponent** (`src/utils/base-component.ts`): Foundation class with event management
- **TemplateEngine** (`src/utils/template-engine.ts`): HTML template processing
- **Logger** (`src/utils/logger.ts`): Scoped loggers for different system components
- **StorageManager** (`src/storage-manager.ts`): IndexedDB abstraction for theme persistence

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

### Theme Loading
- **Dynamic CSS Loading**: Themes loaded on-demand from separate CSS files
- **CSS Variable Injection**: Direct `:root` updates for instant theme switching (10-12ms average)
- **Font Caching**: Google Fonts cached after first load ("Font already loaded" logs)
- **FOUC Prevention**: Advanced inline script with multiple fallback strategies
- **IndexedDB Persistence**: Theme preferences and cache stored in browser database

### Component Performance  
- **Template Caching**: Static HTML imports cached at build time
- **Event Cleanup**: Automatic event listener cleanup prevents memory leaks
- **Render Optimization**: "Events already bound, skipping" prevents duplicate bindings
- **Performance Logging**: Built-in metrics tracking (visible in WebSocket logs)

### Debugging Performance
- **WebSocket Logging**: Zero-impact remote logging (only in development)
- **Better-Logger**: Categorized logging with minimal performance overhead
- **Real-time Metrics**: Theme switching performance visible in terminal logs

## Development & Debugging Guide

### Quick Debugging Setup
1. **Start WebSocket Logger**: `npm run dev:logger` (Terminal 1)
2. **Start Development**: `npm run dev` (Terminal 2)  
3. **View Browser Logs**: All console output appears in Terminal 1 with timestamps
4. **Filter Logs**: Use better-logger categories (ThemeManager, FontManager, Component)

### Common Debug Patterns
```javascript
// Theme switching logs
18:13:26 [LOG] 🎨 Switching to theme: supabase
18:13:26 [LOG] ⚡ CSS variables applied: 0.2ms
18:13:26 [LOG] 🚀 Theme Switch [supabase-light]: 12.1ms

// Font loading logs  
18:13:26 [LOG] 🔤 FontLoader: Font already loaded: Inter
18:13:26 [LOG] ✅ FontLoader: All fonts loaded successfully

// Component lifecycle logs
18:13:26 [LOG] 🎨 BaseComponent: Rendered ThemeDropdown
18:13:26 [LOG] bindEvents: Events already bound, skipping
```

### Testing Checklist
1. **Theme System**: All themes switch without FOUC (check performance logs)
2. **Font Management**: Font overrides apply correctly (check FontManager logs)
3. **Modal System**: All modals open/close properly (check z-index management)
4. **Storage Persistence**: Settings saved to IndexedDB (check StorageManager logs)  
5. **Component Cleanup**: No memory leaks (verify event cleanup logs)
6. **WebSocket Logging**: All browser logs appear in terminal during development

### Troubleshooting Guide

#### WebSocket Connection Issues
```bash
# Problem: No logs appearing in terminal
# Solution 1: Check if logger server is running
npm run dev:logger
# Should show: "🚀 Logger server running on ws://localhost:8081"

# Solution 2: Check port availability
lsof -i :8081
# If port busy: kill -9 $(lsof -ti:8081)

# Solution 3: Restart both terminals in correct order
```

#### Theme Loading Issues
```bash
# Problem: Theme not switching
# Check logs for:
18:13:26 [LOG] 🔄 Loading CSS variables from: /src/themes/theme-name.css
18:13:26 [LOG] ✅ Applied 58 CSS variables to document root
# If missing, check if theme files exist in src/themes/
```

#### Font Loading Problems
```bash
# Problem: Fonts not loading
# Check network connectivity and logs:
18:13:26 [LOG] 🔤 FontLoader: Detected fonts to load: ["Inter"]
18:13:26 [LOG] ✅ FontLoader: Loaded font: Inter
# If failed, verify fonts.googleapis.com accessibility
```

#### Performance Issues
```bash
# Monitor theme switching performance:
18:13:26 [LOG] 📊 Performance [theme-switch-supabase-light]: 12.1ms
# Acceptable: <15ms, Investigate if >20ms
```

#### Component Lifecycle Issues
```bash
# Check component initialization:
18:13:26 [LOG] 🎨 BaseComponent: Rendered ComponentName
18:13:26 [LOG] bindEvents: Events already bound, skipping  # Good: prevents duplicates
# If missing "Rendered" logs, check template imports
```

## WebSocket Remote Debugging System

### Overview
The project includes a **production-ready WebSocket logging system** for streaming browser console output directly to your terminal during development. This enables **real-time debugging** without switching between browser DevTools and your code editor.

### Architecture Components

#### 1. WebSocket Server (`logger-server.js`)
- **Purpose**: Receives and formats browser console logs
- **Port**: 8081 (configurable)
- **Features**:
  - Real-time message processing with timestamps (`18:13:26 [LOG]`)
  - JSON object pretty-printing for complex objects
  - Graceful connection handling with auto-reconnection
  - Process cleanup on SIGINT (Ctrl+C)

#### 2. Vite Plugin (`vite-plugin-browser-logger.js`)
- **Purpose**: Intercepts browser console methods and streams to WebSocket
- **Intercepted Methods**: `console.log`, `console.error`, `console.warn`, `console.info`, `console.debug`
- **Additional Capture**: Global errors and unhandled promise rejections
- **Smart Features**:
  - Message queuing during connection failures (up to 100 messages)
  - Automatic reconnection every 2 seconds
  - Development-only activation (`NODE_ENV !== "development"`)
  - Original console methods preserved (dual output)

#### 3. Integration with Better-Logger
The system seamlessly captures styled `@mks2508/better-logger` output:
```bash
# Better-logger styled output appears in terminal:
18:12:31 [LOG] %c18:12:31.450 %c🔮 INFO %c🎨 ThemeManager %c🚀 Starting Theme Manager Application
```

### Performance Impact
- **Development**: Minimal overhead, JSON serialization only
- **Production**: Zero impact (plugin completely disabled)
- **Memory**: Auto-cleanup of message queue prevents memory leaks
- **Network**: Local WebSocket connection (no external requests)

## Known Limitations
- All themes increase initial bundle size (but provides instant switching)
- Some TweakCN themes may not be available (404 errors)
- Custom fonts specified in themes need to be loaded separately

## File Structure
```
src/
├── components/                    # Modular UI components
│   ├── app-controller.ts            # Main application coordinator
│   ├── theme-dropdown.ts            # Theme selector dropdown
│   ├── font-selector-modal.ts       # Font customization modal
│   ├── theme-installer-modal.ts     # Theme installation modal
│   └── theme-management-modal.ts    # Theme management interface
├── templates/                     # HTML templates (*.html?raw imports)
│   ├── components/                  # Component templates
│   ├── modals/                     # Modal templates
│   └── widgets/                    # Widget templates
├── themes/                        # Theme CSS files
│   ├── default-light.css           # Built-in light theme
│   ├── default-dark.css            # Built-in dark theme
│   ├── supabase-light.css          # Supabase theme (light)
│   ├── supabase-dark.css           # Supabase theme (dark)
│   └── base.css                    # Base theme utilities
├── utils/                         # Core utilities
│   ├── base-component.ts           # Component foundation class
│   ├── logger.ts                   # Scoped logging system
│   └── template-engine.ts          # HTML template processing
├── main.ts                       # Application entry point
├── theme-manager.ts              # Dynamic theme loading
├── font-manager.ts               # Font override system  
├── theme-registry.ts             # Theme catalog management
├── storage-manager.ts            # IndexedDB abstraction
└── style.css                     # Base styles and imports

# Root level debugging tools
├── logger-server.js              # WebSocket logging server
├── vite-plugin-browser-logger.js # Vite plugin for console interception
└── vite.config.ts               # Includes browser logger plugin
```