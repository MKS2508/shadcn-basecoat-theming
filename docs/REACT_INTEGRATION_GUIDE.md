# 🚀 React Theme Manager Integration Guide

## Overview
Complete guide for integrating `@mks2508/shadcn-basecoat-theme-manager` into a React project. This serves as both documentation and blueprint for a future CLI tool.

## 📦 Prerequisites & Dependencies

### 🔍 Required Prerequisites (CLI will verify)
- **React**: `^18.0.0` or `^19.0.0` (existing React project)
- **Vite**: `^4.0.0` or higher (or other bundler)
- **Tailwind CSS**: `^4.0.0` (must be installed and configured)
- **TypeScript**: `^5.0.0` (recommended, but optional)

### 📋 CLI Verification Steps
```bash
# The CLI will automatically verify:
1. ✅ React project (package.json has react dependency)
2. ✅ Tailwind CSS v4 installed
3. ✅ Package manager (npm/pnpm/yarn/bun)
4. ✅ TypeScript support (optional)
```

### 📦 Dependencies Added by CLI
```json
{
  "dependencies": {
    "@mks2508/shadcn-basecoat-theme-manager": "latest",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "lucide-react": "^0.475.0"
  }
}
```

## 🏗️ Project Structure

```
project/
├── public/
│   ├── themes/
│   │   └── registry.json        # Local theme registry
│   └── src/
│       └── themes/              # Theme CSS files
│           ├── default-light.css
│           ├── default-dark.css
│           └── [theme-name]-[mode].css
├── src/
│   ├── components/
│   │   ├── ThemeProvider.tsx    # Context Provider
│   │   ├── ThemeSelector.tsx    # Theme dropdown
│   │   ├── ThemeManagementModal.tsx # Theme manager UI
│   │   ├── FontSettingsModal.tsx    # Font settings UI
│   │   └── ui/                  # shadcn/ui components
│   ├── lib/
│   │   └── utils.ts             # Utility functions (cn)
│   ├── styles/
│   │   └── globals.css          # Tailwind + theme imports
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # App entry point
```

## 📝 File Contents & Purpose

### 1. **ThemeProvider.tsx** (Context Provider)

```tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeCore } from '@mks2508/shadcn-basecoat-theme-manager';

interface ThemeContextType {
  themeCore: any | null;
  themeManager: any | null;
  fontManager: any | null;
  isLoaded: boolean;
  error: string | null;
}

const ThemeContext = createContext<ThemeContextType>({
  themeCore: null,
  themeManager: null,
  fontManager: null,
  isLoaded: false,
  error: null,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeCore, setThemeCore] = useState<any>(null);
  const [themeManager, setThemeManager] = useState<any>(null);
  const [fontManager, setFontManager] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeThemeCore = async () => {
      try {
        console.log('🎨 Initializing ThemeCore (React)...');
        
        // Single line initialization - all complexity handled by ThemeCore
        const core = await ThemeCore.init();
        
        console.log('✅ ThemeCore initialized successfully:', core);
        
        // Update state
        setThemeCore(core);
        setThemeManager(core.themeManager);
        setFontManager(core.fontManager);
        setIsLoaded(true);
        
      } catch (err: any) {
        console.error('❌ Failed to initialize ThemeCore:', err);
        setError(err.message || 'Failed to initialize ThemeCore');
        setIsLoaded(true);
      }
    };

    initializeThemeCore();
  }, []);

  const contextValue: ThemeContextType = {
    themeCore,
    themeManager,
    fontManager,
    isLoaded,
    error,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 2. **App.tsx** (Main Application)

```tsx
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeSelector } from './components/ThemeSelector';
import { ThemeManagementModal } from './components/ThemeManagementModal';
import { FontSettingsModal } from './components/FontSettingsModal';

function App() {
  const [showThemeManagement, setShowThemeManagement] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header with theme controls */}
        <div className="flex justify-center gap-2 p-4">
          <ThemeSelector 
            onThemeManagement={() => setShowThemeManagement(true)}
            onFontSettings={() => setShowFontSettings(true)}
          />
        </div>
        
        {/* Your app content */}
        <main className="container mx-auto p-8">
          {/* Your components here */}
        </main>

        {/* Theme Management Modal */}
        <ThemeManagementModal
          open={showThemeManagement}
          onOpenChange={setShowThemeManagement}
        />

        {/* Font Settings Modal */}
        <FontSettingsModal
          open={showFontSettings}
          onOpenChange={setShowFontSettings}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
```

### 3. **globals.css** (Styles Integration)

```css
@import "tailwindcss";

/* Theme variable mapping for Tailwind v4 */
@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
}

/* FOUC Prevention */
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Base theme variables will be injected here by ThemeCore */
```

### 4. **registry.json** (Theme Registry)

```json
{
  "version": "1.0.0",
  "themes": [
    {
      "id": "default",
      "name": "default",
      "label": "Default",
      "category": "built-in",
      "modes": {
        "light": "/public/src/themes/default-light.css",
        "dark": "/public/src/themes/default-dark.css"
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

### 5. **Theme CSS Files** (Example: default-light.css)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 84% 4.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --radius: 0.5rem;
}
```

## 🔌 Component Integration Examples

### Simple Theme Selector

```tsx
import { useTheme } from './ThemeProvider';

export const SimpleThemeSelector = () => {
  const { themeManager, isLoaded } = useTheme();
  const [currentTheme, setCurrentTheme] = useState('default');

  useEffect(() => {
    if (themeManager && isLoaded) {
      const current = themeManager.getCurrentTheme();
      setCurrentTheme(current);
    }
  }, [themeManager, isLoaded]);

  const handleThemeChange = (themeId: string) => {
    if (themeManager) {
      themeManager.setTheme(themeId);
      setCurrentTheme(themeId);
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  const themes = themeManager?.getAvailableThemes() || [];

  return (
    <select 
      value={currentTheme} 
      onChange={(e) => handleThemeChange(e.target.value)}
      className="px-3 py-2 border border-input rounded-md bg-background"
    >
      {themes.map(theme => (
        <option key={theme.id} value={theme.id}>
          {theme.label || theme.name}
        </option>
      ))}
    </select>
  );
};
```

### Mode Toggle Button

```tsx
import { useTheme } from './ThemeProvider';
import { Moon, Sun } from 'lucide-react';

export const ModeToggle = () => {
  const { themeManager, isLoaded } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (themeManager && isLoaded) {
      const mode = themeManager.getCurrentMode();
      setIsDark(mode === 'dark');
    }
  }, [themeManager, isLoaded]);

  const toggleMode = async () => {
    if (themeManager) {
      await themeManager.toggleMode();
      const newMode = themeManager.getCurrentMode();
      setIsDark(newMode === 'dark');
    }
  };

  return (
    <button
      onClick={toggleMode}
      className="p-2 rounded-md border border-input hover:bg-accent"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};
```

### Theme Installation Hook

```tsx
import { useTheme } from './ThemeProvider';

export const useThemeInstaller = () => {
  const { themeManager } = useTheme();

  const installTheme = async (url: string) => {
    if (!themeManager) throw new Error('ThemeManager not available');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch theme: ${response.status}`);
      }

      const themeData = await response.json();
      const installedTheme = await themeManager.installTheme(themeData, url);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('theme-installed', {
        detail: { theme: installedTheme }
      }));

      return installedTheme;
    } catch (error) {
      console.error('Failed to install theme:', error);
      throw error;
    }
  };

  return { installTheme };
};
```

## 🛠️ Minimum Setup Checklist

### Required Files
- [ ] `src/components/ThemeProvider.tsx`
- [ ] `src/styles/globals.css` with theme imports
- [ ] `public/themes/registry.json`
- [ ] At least one theme CSS file pair (light/dark)
- [ ] `src/lib/utils.ts` with cn function
- [ ] Updated `src/App.tsx` with ThemeProvider

### Optional UI Components
- [ ] `ThemeSelector.tsx` (dropdown)
- [ ] `ThemeManagementModal.tsx` (full UI)
- [ ] `FontSettingsModal.tsx` (font customization)

### CLI Setup Steps (Automated)
```bash
# Prerequisite checks (CLI verifies automatically)
1. ✅ Verify React project exists
2. ✅ Check Tailwind CSS v4 installed
3. ✅ Check package manager availability

# Setup process (CLI executes automatically)  
4. 📦 Install theme manager and Radix UI packages
5. 📁 Create theme directory structure
6. 📄 Generate ThemeProvider.tsx with Context
7. 🎨 Add globals.css theme imports
8. 📋 Create themes registry.json
9. 🎯 Generate default theme CSS files
10. 🔧 Create lib/utils.ts if not exists
```

### Manual Setup Steps (Alternative)
1. Install packages: `npm install @mks2508/shadcn-basecoat-theme-manager @radix-ui/react-popover @radix-ui/react-dialog`
2. Create folder structure
3. Generate ThemeProvider.tsx
4. Update App.tsx with provider
5. Add globals.css imports
6. Create registry.json
7. Add theme CSS files

## 🎯 Key Integration Points

### 1. **React Context Pattern**
```tsx
// Access theme functionality anywhere in your app
const { themeManager, fontManager, isLoaded } = useTheme();

// Wait for initialization
useEffect(() => {
  if (isLoaded && themeManager) {
    // Use theme manager
  }
}, [isLoaded, themeManager]);
```

### 2. **Theme Application**
```tsx
// Set theme
themeManager.setTheme('theme-id', 'light|dark|auto');

// Toggle mode
await themeManager.toggleMode();

// Get current
const currentTheme = themeManager.getCurrentTheme();
const currentMode = themeManager.getCurrentMode();
```

### 3. **Font Management**
```tsx
// Enable font override
await fontManager.enableOverride();

// Set font
fontManager.setFontOverride('sans', 'Inter');

// Get configuration
const config = fontManager.getOverrideConfiguration();
```

### 4. **Event Handling**
```tsx
// Listen for theme changes
useEffect(() => {
  const handleThemeChange = () => {
    // Update UI
  };

  window.addEventListener('theme-installed', handleThemeChange);
  return () => window.removeEventListener('theme-installed', handleThemeChange);
}, []);
```

## 🚦 Common Patterns

### Loading States
```tsx
const { isLoaded, error } = useTheme();

if (!isLoaded) {
  return <div>Loading theme system...</div>;
}

if (error) {
  return <div>Error: {error}</div>;
}

// Render theme-dependent content
return <YourComponent />;
```

### Conditional Rendering
```tsx
const { themeManager, isLoaded } = useTheme();
const themes = themeManager?.getAvailableThemes() || [];

return (
  <div>
    {isLoaded && themes.length > 0 ? (
      <ThemeSelector />
    ) : (
      <div>No themes available</div>
    )}
  </div>
);
```

### Custom Hooks
```tsx
// Custom hook for theme state
export const useCurrentTheme = () => {
  const { themeManager, isLoaded } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>('default');

  useEffect(() => {
    if (isLoaded && themeManager) {
      setCurrentTheme(themeManager.getCurrentTheme());
    }
  }, [themeManager, isLoaded]);

  return { currentTheme, setTheme: themeManager?.setTheme };
};
```

## 🎨 FOUC Prevention (Optional)

For better initial load experience, add FOUC prevention:

### index.html (Vite)
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React + ThemeCore</title>
    
    <!-- FOUC Prevention -->
    <style>
      body {
        visibility: hidden;
        opacity: 0;
      }
    </style>
    
    <script>
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
        
        // Reveal body after theme applied
        setTimeout(() => {
          document.body.style.visibility = 'visible';
          document.body.style.opacity = '1';
          document.body.style.transition = 'opacity 0.3s ease';
        }, 0);
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## 🐛 Troubleshooting

### Theme not applying
- Check if ThemeProvider wraps your entire app
- Verify theme CSS files are accessible in public folder
- Check browser console for initialization errors
- Ensure Tailwind CSS variables are properly mapped

### Context errors
- Make sure useTheme() is called inside ThemeProvider
- Check that ThemeProvider is at the root level
- Verify React version compatibility

### Font loading issues
- Check if font override is enabled
- Verify font catalog is properly loaded
- Check network connectivity for Google Fonts

### Performance issues
- Theme switching should be <50ms
- Use React.memo for expensive theme-dependent components
- Consider lazy loading theme management modals

## 📚 Additional Resources

- [Core Package Documentation](../packages/theme-manager-core/README.md)
- [Astro Integration Guide](./ASTRO_INTEGRATION_GUIDE.md)
- [Theme Creation Guide](./THEME_CREATION.md)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 🔗 Related Examples

- **React Example**: `/examples/react/` - Complete React implementation
- **Astro Example**: `/examples/astro/` - Complete Astro implementation
- **CLI Tool**: `/packages/theme-manager-init/` - Automated setup tool