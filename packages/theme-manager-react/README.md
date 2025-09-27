# @mks2508/theme-manager-react

React hooks and components for theme management (shadcn/ui compatible, Next.js 15 ready)

## 🚀 Next.js 15 Compatibility

This package is compatible with **Next.js 15** with the following considerations:

### ✅ Fully Compatible
- **Pages Router**: Full support with React 18.2+ and React 19
- **App Router**: Compatible with React 19 (recommended)
- **TypeScript**: Full type safety with both React versions

### ⚠️ Known Limitations
- **Radix UI + React 19**: Some Radix UI components may show warnings with React 19 due to ongoing compatibility work
- **useEffectEvent warnings**: May appear in development but don't affect functionality
- **Mixed Router Usage**: Not recommended to use different React versions across routers in the same app

## Installation

```bash
npm install @mks2508/theme-manager-react@^3.1.0
npm install @mks2508/shadcn-basecoat-theme-manager@^3.0.0

# Required peer dependencies
npm install react react-dom
npm install @radix-ui/react-popover @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-switch @radix-ui/react-label
npm install lucide-react class-variance-authority clsx tailwind-merge
```

## Next.js 15 Setup

### App Router (React 19)
```tsx
// app/layout.tsx
import { ThemeProvider } from '@mks2508/theme-manager-react'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Pages Router (React 18.2+ or 19)
```tsx
// pages/_app.tsx
import { ThemeProvider } from '@mks2508/theme-manager-react'
import type { AppProps } from 'next/app'
import './globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
```

## Components

### Theme Selector
```tsx
import { ThemeSelector } from '@mks2508/theme-manager-react'

export default function Header() {
  return (
    <header>
      <ThemeSelector />
    </header>
  )
}
```

### Mode Toggle (Dark/Light)
```tsx
import { ModeToggle } from '@mks2508/theme-manager-react'

export default function Navigation() {
  return (
    <nav>
      <ModeToggle />
    </nav>
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
import { useTheme } from '@mks2508/theme-manager-react'

export default function CustomComponent() {
  const { 
    currentTheme, 
    setTheme, 
    isDarkMode, 
    toggleDarkMode,
    availableThemes 
  } = useTheme()

  return (
    <div>
      <p>Current theme: {currentTheme}</p>
      <p>Dark mode: {isDarkMode ? 'Yes' : 'No'}</p>
      <button onClick={toggleDarkMode}>
        Toggle mode
      </button>
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

## Migration from v3.0.0

Update your package.json:

```diff
- "@mks2508/theme-manager-react": "^3.0.0"
+ "@mks2508/theme-manager-react": "^3.1.0"

- "lucide-react": "^0.400.0"
+ "lucide-react": "^0.540.0"

- "tailwind-merge": "^2.0.0"
+ "tailwind-merge": "^2.5.0"
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