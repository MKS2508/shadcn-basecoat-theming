# Advanced Theme System with Remote Debugging

A production-ready theme management system with **Tailwind CSS v4**, **Basecoat UI**, **modular components**, and **WebSocket remote debugging**. Built with TypeScript and optimized for performance and development experience.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm package manager

### Installation & Development

1. **Install dependencies:**
```bash
npm install
```

2. **Development with Remote Debugging (Recommended):**
```bash
# Terminal 1: Start WebSocket logging server
npm run dev:logger

# Terminal 2: Start development server  
npm run dev

# Result: Browser console logs appear in Terminal 1 with timestamps
# Open: http://localhost:3000
```

3. **Standard Development (without remote logging):**
```bash
npm run dev
# Open: http://localhost:3000
```

### Build for Production

```bash
# Type check (fix any errors before building)
npm run type-check

# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

### Available Commands

```bash
npm run dev              # Development server (port 3000)
npm run dev:logger       # WebSocket logging server (port 8081)
npm run build            # Production build
npm run preview          # Preview production build
npm run type-check       # TypeScript validation
npm run install-theme    # Install theme from URL
```

## 🎨 Architecture Overview

### Modern Component System
This project uses a **modular TypeScript architecture** with advanced development tools:

- **Basecoat UI**: Modern component library with Tailwind CSS v4
- **Dynamic Theme Loading**: CSS files loaded on-demand with performance tracking
- **Modular Components**: TypeScript classes with template-based rendering
- **Remote Debugging**: WebSocket-based browser log streaming to terminal
- **Advanced Logging**: @mks2508/better-logger with categorized, styled output

### Available Themes

| Theme | Description | Features |
|-------|-------------|----------|
| **Default** | Clean system theme | System fonts, minimal design |
| **Supabase** | Brand-inspired theme | Outfit font, green accents |
| **Tangerine** | Warm theme | Inter + JetBrains Mono, orange tones |
| **Custom** | Install from URLs | TweakCN-compatible theme installation |

### Adding Custom Themes

1. **Install from URL**:
   ```bash
   npm run install-theme https://tweakcn.com/r/themes/[theme-name].json
   ```

2. **Or use the UI**: 
   - Open browser → Theme dropdown → "Browse themes"
   - Paste theme URL → Preview → Install

3. **Automatic Integration**:
   - CSS files automatically created in `src/themes/`
   - Theme registered in ThemeRegistry
   - Fonts loaded from Google Fonts if needed
   - Available immediately in theme dropdown

### Example: Theme Installation

```bash
# Install a theme via CLI
npm run install-theme https://tweakcn.com/r/themes/kodama-grove.json

# Check logs in WebSocket terminal for installation progress:
# 📦 Theme downloaded: kodama-grove
# 🎨 CSS generated: src/themes/kodama-grove-light.css  
# ✅ Theme installed successfully
```

## 🔧 Technical Implementation

### Core System Architecture

#### AppController (`src/components/app-controller.ts`)
- Central coordinator for all application components
- Manages component lifecycle and inter-component communication
- Provides unified initialization and error handling

#### ThemeManager (`src/theme-manager.ts`)
- Dynamic CSS loading and CSS variable injection
- Performance tracking and optimization (10-12ms theme switching)
- Font loading coordination with caching

#### Component System (`src/components/`)
- **BaseComponent**: Foundation with automatic event cleanup
- **ModalComponent**: Specialized modal base with z-index management  
- **Template System**: Static HTML imports with `*.html?raw`

#### Remote Debugging (`logger-server.js` + `vite-plugin-browser-logger.js`)
- WebSocket server for browser console log streaming
- Vite plugin for console method interception
- Real-time development debugging in terminal

### Key Configuration Files

#### Vite Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import BrowserLoggerPlugin from './vite-plugin-browser-logger.js';

export default defineConfig({
  plugins: [
    tailwindcss(), 
    BrowserLoggerPlugin() // WebSocket console interception
  ],
  assetsInclude: ['**/*.html'], // Enable .html?raw imports
});
```

#### Dependencies
- **@mks2508/better-logger**: Advanced logging with categories and styling
- **@tailwindcss/vite**: Tailwind CSS v4 with Vite integration
- **basecoat-css**: Modern component library
- **ws**: WebSocket support for remote logging
- **tsx**: TypeScript execution for theme installation scripts

## 🔍 Development Debugging Guide

### WebSocket Remote Logging

The project includes a **WebSocket-based remote debugging system** for viewing browser console logs in your terminal:

1. **Setup**:
   ```bash
   # Terminal 1: Start logging server
   npm run dev:logger
   
   # Terminal 2: Start development
   npm run dev
   ```

2. **What you'll see in Terminal 1**:
   ```bash
   🚀 Logger server running on ws://localhost:8081
   🔌 Navegador conectado al logger
   
   # Real-time browser logs:
   18:13:26 [LOG] 🎨 Switching to theme: supabase
   18:13:26 [LOG] ⚡ CSS variables applied: 0.2ms  
   18:13:26 [LOG] 🚀 Theme Switch [supabase-light]: 12.1ms
   ```

3. **Supported Log Types**:
   - `console.log` / `console.info` - General information
   - `console.error` - Errors with stack traces
   - `console.warn` - Warnings
   - `console.debug` - Debug information
   - **Better-logger**: Styled, categorized logs with timestamps

### Component Development Patterns

#### Creating New Components
1. **Extend BaseComponent**:
   ```typescript
   import { BaseComponent } from '../utils/base-component';
   
   export class MyComponent extends BaseComponent {
     constructor() {
       super(template); // HTML template as string
     }
     
     protected bindEvents(): void {
       // Use bindEvent() for automatic cleanup
       this.bindEvent(button, 'click', () => {});
     }
   }
   ```

2. **Use Template System**:
   ```typescript
   import myTemplate from '../templates/components/my-component.html?raw';
   
   export class MyComponent extends BaseComponent {
     constructor() {
       super(myTemplate);
     }
   }
   ```

## 🧪 Development & Testing

### Debugging Checklist

1. **WebSocket Logging Active**:
   ```bash
   # Verify logging server is running
   npm run dev:logger
   # Look for: "🚀 Logger server running on ws://localhost:8081"
   ```

2. **Theme System**:
   - [ ] Theme switches show performance metrics in logs
   - [ ] Font loading logs show "Font already loaded" for cached fonts
   - [ ] CSS variables applied in <12ms (check logs)
   - [ ] No FOUC (Flash of Unstyled Content)

3. **Component System**:
   - [ ] Component lifecycle logs appear ("BaseComponent: Rendered")
   - [ ] Event binding logs show "Events already bound, skipping" for optimization
   - [ ] Modal z-index management logs show proper layering
   - [ ] No memory leaks (verify event cleanup in logs)

4. **Font Management**:
   - [ ] Font override logs show configuration changes
   - [ ] Google Fonts loading appears in network and logs
   - [ ] Font fallbacks work correctly

### Advanced Debugging Techniques

1. **Performance Monitoring**:
   ```bash
   # Look for performance logs in WebSocket terminal:
   📊 Performance [theme-switch-supabase-light]: 12.1ms
   📊 Performance [theme-manager-init]: 71.5ms
   ```

2. **Component State Debugging**:
   ```bash
   # Component lifecycle in logs:
   🎨 BaseComponent: Rendered ThemeDropdown
   🎨 Modal found: true
   🎨 Modal appended to body with z-index management
   ```

3. **Storage & Caching**:
   ```bash
   # Storage operations:
   📦 StorageManager: Using IndexedDB
   💾 ThemeManager: Settings saved (optimized): supabase, light
   ```

### Troubleshooting Common Issues

1. **WebSocket Connection Issues**:
   ```bash
   # If logs don't appear in terminal:
   # 1. Check logger server is running (npm run dev:logger)
   # 2. Look for connection logs: "🔌 Navegador conectado al logger"
   # 3. Restart both terminals if needed
   ```

2. **Theme Not Loading**:
   ```bash
   # Check theme loading logs:
   🔄 Loading CSS variables from: /src/themes/theme-name.css
   ✅ Applied 58 CSS variables to document root
   # If missing, theme file may not exist
   ```

3. **Font Issues**:
   ```bash
   # Check font loading:
   🔤 FontLoader: Detected fonts to load: ["Inter", "JetBrains Mono"]
   ✅ FontLoader: All fonts loaded successfully
   # If failed, check network connectivity to fonts.googleapis.com
   ```

## 📁 Project Structure

```
├── src/
│   ├── components/            # Modular TypeScript components
│   │   ├── app-controller.ts      # Main app coordinator
│   │   ├── theme-dropdown.ts      # Theme selector
│   │   ├── font-selector-modal.ts # Font customization
│   │   └── *-modal.ts            # Various modal components
│   ├── templates/             # HTML templates (*.html?raw)
│   │   ├── components/            # Component templates
│   │   ├── modals/               # Modal templates
│   │   └── widgets/              # Widget templates
│   ├── themes/                # Dynamic CSS theme files
│   │   ├── default-light.css      # Built-in themes
│   │   ├── supabase-light.css     # Brand themes
│   │   └── *.css                 # Installed themes
│   ├── utils/                 # Core utilities
│   │   ├── base-component.ts      # Component foundation
│   │   ├── logger.ts             # Scoped logging
│   │   └── template-engine.ts     # Template processing
│   ├── main.ts                # Application entry
│   ├── theme-manager.ts       # Dynamic theme system
│   ├── font-manager.ts        # Font override system
│   └── style.css             # Base styles
├── logger-server.js           # WebSocket logging server
├── vite-plugin-browser-logger.js # Console interception plugin
├── index.html                 # Main template
├── package.json              # Dependencies & scripts
├── vite.config.ts            # Vite + plugins configuration
└── tsconfig.json            # TypeScript configuration
```

## 🔄 Theme Management

### Manual Theme Addition
1. Add CSS variables to `src/style.css` following shadcn/ui structure
2. Update `THEMES` configuration in `src/theme-manager.ts`
3. Add theme option to dropdown in `index.html`

### TweakCN Theme Addition
1. Run `npx shadcn@latest add [tweakcn-url]`
2. Update theme configuration and dropdown options
3. Test theme switching functionality

## 🎯 Performance & Optimization

### Performance Metrics (Visible in WebSocket Logs)
- **Theme Switching**: 10-12ms average (logged in real-time)
- **CSS Variable Injection**: <1ms for most themes
- **Font Loading**: Cached after first load ("Font already loaded" logs)
- **Component Rendering**: <5ms for most components

### Optimization Features
- **Dynamic CSS Loading**: Themes loaded on-demand from separate files
- **Font Caching**: Google Fonts cached with service worker
- **Event Cleanup**: Automatic memory leak prevention
- **IndexedDB Storage**: Fast persistence for themes and preferences
- **Template Caching**: Static HTML templates bundled at build time

### Bundle Analysis
- **Core bundle**: ~40KB (gzipped) including all components
- **Theme CSS**: ~2-5KB per theme (loaded dynamically)
- **WebSocket debugging**: Zero production impact (development only)

## 🛠️ Development Workflow

### Recommended Development Setup

```bash
# 1. Start WebSocket logger (Terminal 1)
npm run dev:logger

# 2. Start development server (Terminal 2)  
npm run dev

# 3. Open browser: http://localhost:3000
# 4. All browser logs appear in Terminal 1 with real-time debugging
```

### Code Quality & Standards
- **TypeScript Strict Mode**: Full type safety enabled
- **Better-Logger Integration**: Consistent, categorized logging
- **Component Architecture**: Modular, reusable TypeScript classes
- **Template System**: Clean separation of HTML and logic
- **Event Management**: Automatic cleanup prevents memory leaks
- **Performance Monitoring**: Built-in metrics and logging

## 📚 Resources & Documentation

### Core Technologies
- [Tailwind CSS v4](https://tailwindcss.com/docs) - Utility-first CSS framework
- [Basecoat UI](https://basecoat.design) - Modern component library
- [Vite](https://vitejs.dev) - Fast build tool and development server
- [TypeScript](https://www.typescriptlang.org) - Typed JavaScript

### Development Tools
- [@mks2508/better-logger](https://www.npmjs.com/package/@mks2508/better-logger) - Advanced logging system
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) - Real-time communication
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) - Client-side storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-theme`
3. Commit changes: `git commit -am 'Add new theme'`
4. Push to branch: `git push origin feature/new-theme`
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project as a starting point for your own theme switching implementations.