# @mks2508/theme-manager-react

React hooks and components for theme management (shadcn/ui compatible, Next.js 15 ready) with **animated transitions**

## 🚀 Features v3.3.0

- ✅ **Animated Theme Transitions**: Smooth View Transitions API integration
- ✅ **Next.js Optimized**: Dedicated `/nextjs` export for SSR/SSG
- ✅ **React 19 Compatible**: Full support with TypeScript fixes
- ✅ **Flexible Dependencies**: Compatible with wide range of peer dependency versions

## 📘 Quick Start Guide for Existing Next.js Projects

### **Prerequisites**:
- ✅ Next.js project configured
- ✅ `/public/themes/registry.json` present
- ✅ `/public/themes/` folder with CSS theme files

### **Installation**
```bash
npm install @mks2508/theme-manager-react@3.3.0
```

### **Setup in layout.tsx (App Router)**
```tsx
// app/layout.tsx
import { ThemeProvider } from '@mks2508/theme-manager-react/nextjs'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider 
          registryUrl="/themes/registry.json"
          defaultTheme="default"
          defaultMode="auto"
          enableTransitions={true}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### **Sidebar with Animated Components**
```tsx
// components/Sidebar.tsx
import { 
  ModeToggle,
  AnimatedThemeToggler,
  ThemeSelector
} from '@mks2508/theme-manager-react/nextjs'

export function Sidebar() {
  return (
    <aside className="w-64 p-4">
      {/* Toggle light/dark with animations */}
      <ModeToggle />
      
      {/* Custom animated toggler */}
      <AnimatedThemeToggler direction="ltr">
        {({ effective, toggleTheme }) => (
          <button onClick={() => toggleTheme()}>
            {effective === 'light' ? '🌙' : '☀️'} Toggle
          </button>
        )}
      </AnimatedThemeToggler>
      
      {/* Full theme selector */}
      <ThemeSelector />
    </aside>
  )
}
```

### **Expected File Structure**
```
/public/themes/
├── registry.json          ← Theme configuration
├── synthwave84-light.css  ← Individual themes
├── synthwave84-dark.css
├── rose-light.css
└── rose-dark.css
```

### **Registry.json Structure**
```json
{
  "themes": [
    {
      "id": "synthwave84",
      "name": "Synthwave84",
      "default": true,
      "modes": {
        "light": "/themes/synthwave84-light.css",
        "dark": "/themes/synthwave84-dark.css"
      }
    }
  ]
}
```

## Full Installation (New Projects)

```bash
npm install @mks2508/theme-manager-react@^3.3.0
npm install @mks2508/shadcn-basecoat-theme-manager@^3.2.1

# Required peer dependencies (flexible versions)
npm install react react-dom
npm install @radix-ui/react-popover @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-switch @radix-ui/react-label
npm install lucide-react class-variance-authority clsx tailwind-merge
```

### Pages Router Setup
```tsx
// pages/_app.tsx
import { ThemeProvider } from '@mks2508/theme-manager-react/nextjs'
import type { AppProps } from 'next/app'
import './index.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      registryUrl="/themes/registry.json"
      defaultTheme="default"
      defaultMode="auto"
      enableTransitions={true}
    >
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
```

## 🎨 Animated Components

### Animated Theme Toggler
```tsx
import { AnimatedThemeToggler } from '@mks2508/theme-manager-react/nextjs'

export default function Navigation() {
  return (
    <nav>
      <AnimatedThemeToggler direction="ltr">
        {({ effective, toggleTheme, isAnimating }) => (
          <button 
            onClick={() => toggleTheme()}
            disabled={isAnimating}
            className="animated-toggle"
          >
            {effective === 'light' ? '🌙' : '☀️'}
          </button>
        )}
      </AnimatedThemeToggler>
    </nav>
  )
}
```

### Animated Theme Selector
```tsx
import { AnimatedThemeSelector } from '@mks2508/theme-manager-react/nextjs'

export default function ThemeGrid() {
  const themes = ['default', 'rose', 'blue', 'green']
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {themes.map(theme => (
        <AnimatedThemeSelector 
          key={theme}
          targetTheme={theme}
          direction="ltr"
        >
          {({ switchToTheme, isCurrentTheme, isAnimating }) => (
            <button
              onClick={switchToTheme}
              disabled={isCurrentTheme || isAnimating}
              className={`theme-card ${isCurrentTheme ? 'active' : ''}`}
            >
              {theme} {isCurrentTheme && '✓'}
            </button>
          )}
        </AnimatedThemeSelector>
      ))}
    </div>
  )
}
```

### Mode Toggle (Enhanced)
```tsx
import { ModeToggle } from '@mks2508/theme-manager-react/nextjs'

export default function Header() {
  return (
    <header>
      <ModeToggle />
    </header>
  )
}
```

### Theme Selector
```tsx
import { ThemeSelector } from '@mks2508/theme-manager-react/nextjs'

export default function Sidebar() {
  return (
    <aside>
      <ThemeSelector 
        onThemeManagement={() => console.log('Open theme manager')}
        onFontSettings={() => console.log('Open font settings')}
      />
    </aside>
  )
}
```

### Font Settings
```tsx
import { FontSettingsModal } from '@mks2508/theme-manager-react'

export default function Settings() {
  return (
    <div>
      <FontSettingsModal />
    </div>
  )
}
```

### Theme Management
```tsx
import { ThemeManagementModal } from '@mks2508/theme-manager-react'

export default function Admin() {
  return (
    <div>
      <ThemeManagementModal />
    </div>
  )
}
```

## Hooks

### useTheme
```tsx
import { useTheme } from '@mks2508/theme-manager-react/nextjs'

export default function CustomComponent() {
  const { 
    currentTheme, 
    currentMode,
    setTheme,
    themes,
    themeManager 
  } = useTheme()

  return (
    <div>
      <p>Current theme: {currentTheme}</p>
      <p>Current mode: {currentMode}</p>
      <button onClick={() => setTheme('rose', 'dark')}>
        Switch to Rose Dark
      </button>
      <p>Available themes: {themes.length}</p>
    </div>
  )
}
```

## CSS Setup

Required CSS variables for theming:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

## Compatibility Matrix

| Next.js Version | React Version | Router | Status |
|----------------|---------------|---------|---------|
| 15.x | 19.x | App Router | ✅ Recommended |
| 15.x | 18.2+ | Pages Router | ✅ Fully Supported |
| 15.x | 19.x | Pages Router | ✅ Supported |
| 14.x | 18.x | Both | ✅ Legacy Support |

## Known Issues & Workarounds

### Radix UI Warnings with React 19
Some Radix UI components may show warnings in the console when using React 19. These are cosmetic and don't affect functionality:

```
Warning: useEffectEvent is not yet implemented
Warning: Accessing element.ref was removed in React 19
```

**Workaround**: These warnings are expected and will be resolved when Radix UI fully supports React 19.

### TypeScript Strict Mode
If using strict TypeScript settings, you may need to add:

```json
// tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

## Migration Guides

### From v3.2.x to v3.3.0

**New Features:**
- ✅ Animated theme transitions with View Transitions API
- ✅ New components: `AnimatedThemeToggler`, `AnimatedThemeSelector`
- ✅ Enhanced `ModeToggle` with animations
- ✅ Flexible peer dependencies

**Update package.json:**
```diff
- "@mks2508/theme-manager-react": "^3.2.1"
+ "@mks2508/theme-manager-react": "^3.3.0"
```

**Update imports for Next.js:**
```diff
- import { ThemeProvider } from '@mks2508/theme-manager-react'
+ import { ThemeProvider } from '@mks2508/theme-manager-react/nextjs'
```

### From v3.0.0 to v3.3.0

```diff
- "@mks2508/theme-manager-react": "^3.0.0"
+ "@mks2508/theme-manager-react": "^3.3.0"

- "lucide-react": "^0.400.0"
+ "lucide-react": ">=0.400.0"

- "tailwind-merge": "^2.0.0"
+ "tailwind-merge": ">=1.0.0"
```

## Support

- **React**: 18.2+ or 19.x
- **Next.js**: 14.x, 15.x
- **TypeScript**: 5.x
- **Tailwind CSS**: 3.x, 4.x

## License

MIT

## Author

MKS2508