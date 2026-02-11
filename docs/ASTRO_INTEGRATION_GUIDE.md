# 🚀 Astro Theme Manager Integration Guide

## Overview
Complete guide for integrating `@mks2508/shadcn-basecoat-theme-manager` into an Astro project. This serves as both documentation and blueprint for a future CLI tool.

## 📦 Prerequisites & Dependencies

### 🔍 Required Prerequisites (CLI will verify)
- **Astro**: `^5.0.0` (proyecto Astro existente)
- **Tailwind CSS**: `^4.0.0` (debe estar instalado y configurado)
- **Basecoat CSS**: `latest` (debe estar instalado)

### 📋 CLI Verification Steps
```bash
# El CLI verificará automáticamente:
1. ✅ Proyecto Astro (astro.config.mjs existe)
2. ✅ Tailwind CSS v4 instalado
3. ✅ Basecoat CSS instalado
4. ✅ Gestor de paquetes (npm/pnpm/yarn)
```

### 📦 Dependencies Added by CLI
```json
{
  "dependencies": {
    "@mks2508/shadcn-basecoat-theme-manager": "latest"
  }
}
```

## 🏗️ Project Structure

```
project/
├── public/
│   ├── src/
│   │   └── themes/              # Theme CSS files
│   │       ├── base.css         # Base variables
│   │       ├── synthwave84-light.css
│   │       ├── synthwave84-dark.css
│   │       └── [theme-name]-[mode].css
│   └── themes/
│       └── registry.json        # Local theme registry
├── src/
│   ├── components/
│   │   ├── ThemeProvider.astro  # Core initialization
│   │   ├── ThemeSelector.astro  # Theme dropdown
│   │   ├── ThemeManagementIsland.astro # Theme manager UI
│   │   ├── FontSettingsIsland.astro    # Font settings UI
│   │   └── icons/               # Required icons
│   ├── layouts/
│   │   └── Layout.astro         # Main layout with FOUC prevention
│   └── styles/
│       └── global.css           # Tailwind + Basecoat imports
```

## 📝 File Contents & Purpose

### 1. **ThemeProvider.astro** (Core Initialization)

#### Opción A: Usando ThemeCore (Recomendado - Simplificado)
```astro
<!-- Versión simplificada usando ThemeCore -->
<script>
  import { ThemeCore } from '@mks2508/shadcn-basecoat-theme-manager';

  async function initializeThemeCore() {
    try {
      console.log('🎨 Initializing ThemeCore (Simplified API)...');
      
      // Single line initialization - framework agnostic
      const themeCore = await ThemeCore.init();
      
      console.log('✅ ThemeCore initialized successfully:', themeCore);
    } catch (error) {
      console.error('❌ Failed to initialize ThemeCore:', error);
    }
  }

  // Initialize immediately
  initializeThemeCore();
</script>
```

#### Opción B: Inicialización Manual (Más Control)
```astro
<!-- Versión manual para casos específicos -->
<script>
  import { 
    ThemeManager, 
    ThemeInstaller, 
    ThemeListFetcher,
    getFontsByCategory
  } from '@mks2508/shadcn-basecoat-theme-manager';

  async function initializeThemeCore() {
    try {
      // Create instances
      const themeManager = new ThemeManager();
      const themeInstaller = new ThemeInstaller(themeManager);
      const themeListFetcher = new ThemeListFetcher();

      // Initialize
      await themeManager.init();
      await themeInstaller.init();
      await themeListFetcher.init();

      // Make globally available
      window.themeCore = {
        themeManager,
        fontManager: themeManager.getFontManager(),
        themeInstaller,
        themeListFetcher,
        getThemeRegistry: () => themeManager.getThemeRegistry(),
        getFontsByCategory
      };

      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('theme-core-ready', {
        detail: { themeCore: window.themeCore }
      }));

    } catch (error) {
      console.error('Failed to initialize Theme Core:', error);
    }
  }

  initializeThemeCore();
</script>
```

### 2. **Layout.astro** (FOUC Prevention)

#### Opción A: Usando ThemeCore Helper (Recomendado)
```astro
---
import '../styles/global.css'
import ThemeProvider from '../components/ThemeProvider.astro'
import { ThemeCore } from '@mks2508/shadcn-basecoat-theme-manager';

// Generar script FOUC optimizado
const foucScript = ThemeCore.getFOUCScript();
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>My App</title>
    
    <!-- FOUC Prevention -->
    <style>
      body {
        visibility: hidden;
        opacity: 0;
      }
    </style>
    
    <script is:inline set:html={foucScript}></script>
  </head>
  <body>
    <ThemeProvider />
    <slot />
  </body>
</html>
```

#### Opción B: Script Manual (Mayor Control)
```astro
---
import '../styles/global.css'
import ThemeProvider from '../components/ThemeProvider.astro'
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>My App</title>
    
    <!-- FOUC Prevention -->
    <style>
      body {
        visibility: hidden;
        opacity: 0;
      }
    </style>
    
    <script is:inline>
      // Apply saved theme immediately
      (function() {
        const savedTheme = localStorage.getItem('theme') || 'default';
        const savedMode = localStorage.getItem('theme-mode') || 'auto';
        
        // Apply mode class
        const effectiveMode = savedMode === 'auto' 
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : savedMode;
        
        document.documentElement.classList.add(effectiveMode);
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Reveal body
        setTimeout(() => {
          document.body.style.visibility = 'visible';
          document.body.style.opacity = '1';
          document.body.style.transition = 'opacity 0.3s ease';
        }, 0);
      })();
    </script>
  </head>
  <body>
    <ThemeProvider />
    <slot />
  </body>
</html>
```

### 3. **global.css** (Styles Integration)
```css
@import "tailwindcss";
@import "basecoat-css";

/* Theme variable mapping for Tailwind v4 */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-secondary: var(--secondary);
  --color-accent: var(--accent);
  --color-muted: var(--muted);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}
```

### 4. **registry.json** (Theme Registry)
```json
{
  "version": "1.0.0",
  "themes": [
    {
      "id": "synthwave84",
      "name": "synthwave84",
      "label": "Synthwave84",
      "category": "built-in",
      "default": true,
      "modes": {
        "light": "/src/themes/synthwave84-light.css",
        "dark": "/src/themes/synthwave84-dark.css"
      },
      "fonts": {
        "sans": "system-ui, sans-serif",
        "serif": "Georgia, serif",
        "mono": "ui-monospace, monospace"
      }
    }
  ]
}
```

### 5. **Theme CSS Files** (Example: synthwave84-light.css)
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}
```

## 🔌 Component Integration

### Simple Theme Selector
```astro
<!-- ThemeSelector.astro -->
<div class="theme-selector">
  <select id="theme-select" class="theme-select">
    <option value="default">Default</option>
  </select>
  <button id="mode-toggle" class="mode-toggle">
    <span class="mode-icon">🌙</span>
  </button>
</div>

<script>
  import { ThemeCore } from '@mks2508/shadcn-basecoat-theme-manager';

  async function initSelector() {
    // Usando ThemeCore helpers
    const themeCore = await ThemeCore.waitForReady();
    const { themeManager } = themeCore;
    
    const select = document.getElementById('theme-select');
    const toggle = document.getElementById('mode-toggle');
    
    // Load themes
    const themes = themeManager.getAvailableThemes();
    select.innerHTML = themes.map(theme => 
      `<option value="${theme.id}">${theme.label || theme.name}</option>`
    ).join('');
    
    // Handle theme change
    select?.addEventListener('change', (e) => {
      themeManager.setTheme(e.target.value);
    });
    
    // Handle mode toggle
    toggle?.addEventListener('click', () => {
      themeManager.toggleMode();
    });
  }

  initSelector();
</script>

<style>
  .theme-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
```

### Mode Toggle Button (Standalone)
```astro
<!-- ModeToggle.astro -->
<button id="mode-toggle" class="btn">
  <span class="mode-icon">🌙</span>
</button>

<script>
  import { ThemeCore } from '@mks2508/shadcn-basecoat-theme-manager';

  // Usando event helper de ThemeCore
  ThemeCore.onReady((themeCore) => {
    const button = document.getElementById('mode-toggle');
    
    button?.addEventListener('click', async () => {
      await themeCore.themeManager.toggleMode();
    });
  });
</script>
```

### Theme Installation Component
```astro
<!-- ThemeInstaller.astro -->
<div class="theme-installer">
  <input type="url" id="theme-url" placeholder="Enter theme URL..." />
  <button id="install-btn">Install Theme</button>
  <div id="status"></div>
</div>

<script>
  import { ThemeCore } from '@mks2508/shadcn-basecoat-theme-manager';

  async function initInstaller() {
    const themeCore = await ThemeCore.waitForReady();
    const { themeInstaller } = themeCore;
    
    const urlInput = document.getElementById('theme-url');
    const installBtn = document.getElementById('install-btn');
    const status = document.getElementById('status');
    
    installBtn?.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      if (!url) return;
      
      try {
        installBtn.textContent = 'Installing...';
        status.textContent = 'Installing theme...';
        
        await themeInstaller.installFromUrl(url);
        
        urlInput.value = '';
        installBtn.textContent = 'Install Theme';
        status.textContent = 'Theme installed successfully!';
      } catch (error) {
        console.error('Failed to install theme:', error);
        installBtn.textContent = 'Install Failed';
        status.textContent = `Error: ${error.message}`;
        
        setTimeout(() => {
          installBtn.textContent = 'Install Theme';
          status.textContent = '';
        }, 3000);
      }
    });
  }

  // Listen for theme installations
  ThemeCore.onThemeInstalled((theme) => {
    console.log('New theme installed:', theme);
    // Refresh theme selector if present
  });

  initInstaller();
</script>
```

## 🛠️ Minimum Setup Checklist

### Required Files
- [ ] `/src/components/ThemeProvider.astro`
- [ ] `/src/layouts/Layout.astro` with FOUC script
- [ ] `/src/styles/global.css` with imports
- [ ] `/public/themes/registry.json`
- [ ] At least one theme CSS file pair (light/dark)

### Optional UI Components
- [ ] ThemeSelector.astro (dropdown)
- [ ] ThemeManagementIsland.astro (full UI)
- [ ] FontSettingsIsland.astro (font customization)

### CLI Setup Steps (Automated)
```bash
# Prerequisite checks (CLI verifies automatically)
1. ✅ Verify Astro project exists
2. ✅ Check Tailwind CSS v4 installed
3. ✅ Check Basecoat CSS installed

# Setup process (CLI executes automatically)  
4. 📦 Install theme manager package
5. 📁 Create theme directory structure
6. 📄 Generate ThemeProvider.astro
7. ⚙️ Update Layout.astro (optional with --with-fouc)
8. 🎨 Add global.css theme imports
9. 📋 Create themes registry.json
10. 🎯 Generate default theme CSS files
```

### Manual Setup Steps (Alternative)
1. Install package: `npm install @mks2508/shadcn-basecoat-theme-manager`
2. Create folder structure
3. Generate ThemeProvider.astro
4. Update Layout.astro
5. Add global.css imports
6. Create registry.json
7. Add theme CSS files

## 🎯 Key Integration Points

### 1. **Event System**
```javascript
// Wait for theme core
window.addEventListener('theme-core-ready', (event) => {
  const { themeManager, fontManager } = event.detail.themeCore;
  // Use managers
});
```

### 2. **Theme Application**
```javascript
// Set theme
themeManager.setTheme('theme-id', 'light|dark|auto');

// Toggle mode
themeManager.toggleMode();

// Get current
const currentTheme = themeManager.getCurrentTheme();
```

### 3. **Font Management**
```javascript
// Enable font override
fontManager.enableOverride();

// Set font
fontManager.setFontOverride('sans', 'Inter');
```

### 4. **Theme Installation**
```javascript
// Install from URL
const themeData = await fetch(themeUrl).then(r => r.json());
await themeManager.installTheme(themeData, themeUrl);
```

## 🚦 Common Patterns

### Usando ThemeCore (Recomendado)
```javascript
import { ThemeCore } from '@mks2508/shadcn-basecoat-theme-manager';

// Wait for core - Simplificado
ThemeCore.onReady((themeCore) => {
  const { themeManager, fontManager } = themeCore;
  // Usar managers
});

// Listen for theme changes - Event system integrado  
ThemeCore.onThemeChange((themeData) => {
  console.log('Theme changed:', themeData.theme, themeData.mode);
  updateUIElements(themeData);
});

// Listen for theme installations
ThemeCore.onThemeInstalled((theme) => {
  console.log('New theme installed:', theme);
  refreshThemeSelector();
});
```

### Patrón Manual (Mayor Control)
```javascript
function waitForThemeCore(callback) {
  if (window.themeCore?.themeManager) {
    callback(window.themeCore);
  } else {
    window.addEventListener('theme-core-ready', (event) => {
      callback(event.detail.themeCore);
    });
  }
}

// Update UI on Theme Change
themeManager.onThemeChange((themeData) => {
  updateUIElements(themeData);
});
```

## 📦 ThemeCore Features Implementadas

### ✅ Helpers Disponibles

1. **Initialization Helper**
   ```javascript
   // Inicialización simplificada framework-agnostic
   const themeCore = await ThemeCore.init();
   ```

2. **FOUC Prevention Script Generator**
   ```javascript
   // Genera script optimizado para prevenir FOUC
   const foucScript = ThemeCore.getFOUCScript();
   ```

3. **Registry Management**
   ```javascript
   // Crear estructura de registry local con defaults
   await ThemeCore.initLocalRegistry('/themes/registry.json');
   ```

4. **Event Helpers**
   ```javascript
   // Helpers de eventos simplificados
   ThemeCore.onReady(callback);
   ThemeCore.onThemeChange(callback);
   ThemeCore.onThemeInstalled(callback);
   ThemeCore.waitForReady();
   ```

5. **Universal Init Script Generator**
   ```javascript
   // Generar script de inicialización universal (framework-agnostic)
   const initScript = ThemeCore.getInitScript();
   ```

### 🎯 Philosophy: Simple Helpers, Not Code Generators
El ThemeCore provee **helpers y utilidades simples** en lugar de generar componentes completos automáticamente, lo que da más flexibilidad al desarrollador para crear sus propios componentes adaptados a sus necesidades específicas.

## 🎨 Theme Structure Requirements

Each theme needs:
- Unique ID
- Light and dark mode CSS files
- CSS variables for all required properties
- Optional: fonts configuration
- Optional: preview colors

## 🐛 Troubleshooting

### Theme not applying
- Check if ThemeProvider is included in Layout
- Verify theme CSS files are accessible
- Check browser console for initialization errors

### FOUC issues
- Ensure FOUC script is inline (`is:inline`)
- Script must be in `<head>` before styles
- Check localStorage keys match

### Event not firing
- ThemeProvider must be loaded before components
- Use waitForThemeCore helper pattern
- Check for initialization errors

## 📚 Additional Resources

- [Core Package Documentation](../packages/theme-manager-core/README.md)
- [Theme Creation Guide](./THEME_CREATION.md)
- [API Reference](./API.md)