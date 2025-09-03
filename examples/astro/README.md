# 🚀 Astro Theme Manager Example

A modern theme management example built with Astro's island architecture, React components, and the `@mks2508/shadcn-basecoat-theme-manager` core package.

## ✨ Features

- **🎨 Dynamic Themes**: Switch between multiple themes instantly with no FOUC
- **🌙 Smart Mode Toggle**: Light/Dark/Auto modes with system preference detection  
- **🔤 Font Management**: Google Fonts integration with customizable typography
- **⚡ Astro Islands**: Hydrated React components only where needed for optimal performance
- **📱 Responsive Design**: Mobile-first approach with Basecoat UI components
- **💾 Persistent Settings**: Theme preferences saved to localStorage
- **🎯 TypeScript**: Full type safety with IntelliSense

## 🛠️ Tech Stack

- **[Astro](https://astro.build/)** - Static site generator with island architecture
- **[React](https://react.dev/)** - UI components for theme management
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Basecoat UI](https://basecoatui.com/)** - Component library with consistent design
- **[Core Theme Manager](../../packages/theme-manager-core/)** - Theme management logic

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js 18+ and pnpm installed.

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

The development server will start at `http://localhost:4321`

## 🏗️ Architecture

### Core Package Integration

This example uses only the core package (`@mks2508/shadcn-basecoat-theme-manager`) which provides:

- `ThemeManager` - Core theme switching logic
- `FontManager` - Font loading and management
- `ThemeRegistry` - Theme configuration and caching
- `StorageManager` - Persistent settings storage

### React Components

- **`ThemeProvider`** - Context provider that initializes the ThemeManager
- **`ThemeDropdown`** - Theme selection dropdown with live preview
- **`ModeToggle`** - Light/Dark/Auto mode cycling button  
- **`FontSelector`** - Font configuration interface (placeholder)

### Astro Islands

Components are hydrated with `client:load` directive only where interactivity is needed:

```astro
<ThemeDropdown client:load />
<ModeToggle client:load />
```

This ensures minimal JavaScript is shipped to the client.

## 🎨 Theming

### Adding Custom Themes

Themes are defined in CSS variables following the shadcn/ui convention:

```css
.theme-custom {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... other variables */
}
```

### FOUC Prevention

The layout includes inline scripts that:
1. Apply saved theme immediately on page load
2. Detect system dark mode preference
3. Remove loading states once hydration completes

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ThemeProvider.tsx
│   ├── ThemeDropdown.tsx
│   ├── ModeToggle.tsx
│   └── FontSelector.tsx
├── layouts/
│   └── Layout.astro     # Base layout with FOUC prevention
├── pages/
│   └── index.astro      # Demo page
└── styles/
    └── global.css       # Tailwind + Basecoat + theme variables
```

## 🔧 Configuration

### Astro Config

```js
export default defineConfig({
  integrations: [
    tailwind({ applyBaseStyles: false }), // Use Basecoat instead
    react(),
  ],
  vite: {
    resolve: {
      alias: { '@': '/src' }
    }
  }
});
```

### TypeScript Paths

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 📝 Usage Examples

### Theme Context

```tsx
import { useTheme } from '@/components/ThemeProvider';

function MyComponent() {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  
  return (
    <button onClick={() => setTheme('dark', 'dark')}>
      Switch to Dark Theme
    </button>
  );
}
```

### Programmatic Control

```js
// Available globally after initialization
const themeManager = window.__vanillaThemeManager;

// Switch theme and mode
await themeManager.setTheme('supabase', 'light');

// Get current state
console.log(themeManager.getCurrentTheme());
console.log(themeManager.getAvailableThemes());
```

## 🚀 Deployment

This is a static Astro site that can be deployed to any static hosting provider:

```bash
pnpm run build
```

The `dist/` folder contains the production build ready for deployment.

## 🤝 Contributing

This example is part of the theme manager monorepo. See the main [CLAUDE.md](../../CLAUDE.md) for development guidelines.

## 📄 License

MIT License - see the main package for details.