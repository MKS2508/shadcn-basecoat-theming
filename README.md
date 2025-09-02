# Vite + shadcn/ui + TweakCN Theme Demo

A production-ready demonstration of modern theme switching using **Tailwind CSS v4**, **shadcn/ui**, and **TweakCN** theme integration. Built with TypeScript and optimized for performance.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone and setup the project:**
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

2. **Open your browser:**
The development server will automatically open at `http://localhost:3000`

### Build for Production

```bash
# Type check
npm run type-check

# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

### Adding TweakCN Themes

You can now add themes directly from TweakCN using the shadcn CLI:

```bash
# Add a theme from TweakCN
npx shadcn@latest add https://tweakcn.com/r/themes/kodama-grove.json
```

## 🎨 Theme System Overview

### Architecture
This project uses shadcn/ui's theme system with TweakCN integration:

- **CSS Variables**: Uses HSL color space for theme variables
- **Class-based Switching**: Themes applied via CSS classes (light/dark/custom)
- **TweakCN Integration**: Direct import of themes from TweakCN gallery
- **shadcn/ui Compatible**: Full compatibility with shadcn/ui components

### Available Themes

| Theme | Description | Primary Color |
|-------|-------------|---------------|
| **Light** | Default light theme | Blue |
| **Dark** | Default dark theme | Blue |
| **Cyberpunk** | Custom neon theme | Cyan |
| **+ TweakCN** | Import any theme from TweakCN | Variable |

### Adding Custom Themes from TweakCN

1. **Browse TweakCN Gallery**: Visit [TweakCN.com](https://tweakcn.com) and find a theme you like
2. **Copy the theme URL**: Right-click on "Add to shadcn" and copy the URL
3. **Run the CLI command**:
   ```bash
   npx shadcn@latest add https://tweakcn.com/r/themes/[theme-name].json
   ```
4. **Update theme selector**: Add the new theme option to the dropdown in `index.html`
5. **Update ThemeManager**: Add the theme configuration in `src/theme-manager.ts`

### Example: Adding Kodama Grove Theme

```bash
# Add the Kodama Grove theme from TweakCN
npx shadcn@latest add https://tweakcn.com/r/themes/kodama-grove.json
```

This will automatically update your `src/style.css` with the new theme variables.

## 🔧 Technical Implementation

### Core Components

#### ThemeManager (`src/theme-manager.ts`)
- Handles theme switching via CSS classes
- Manages localStorage persistence and system preference detection
- Provides comprehensive error handling and fallbacks

#### DropdownManager (`src/dropdown-manager.ts`)
- Manages Basecoat UI dropdown interactions
- Implements full keyboard navigation support
- Provides accessible ARIA states and focus management

### Configuration Files

#### Tailwind CSS v4 Setup
```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  // ... additional config
});
```

#### shadcn/ui + TweakCN Integration
The `tailwind.config.cjs` follows shadcn/ui standards and works with TweakCN:

```javascript
theme: {
  extend: {
    colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      // ... additional color mappings
    }
  }
}
```

## 🎭 Working with shadcn/ui + TweakCN

### Adding Themes from TweakCN

1. **Browse TweakCN Gallery**: Visit [TweakCN.com](https://tweakcn.com) 
2. **Find a theme**: Browse the community themes or create your own
3. **Use the CLI**: Copy the shadcn add command from TweakCN
4. **Run the command**:
   ```bash
   npx shadcn@latest add https://tweakcn.com/r/themes/[theme-name].json
   ```
5. **Update theme configuration** in `src/theme-manager.ts`:

```typescript
export const THEMES: Record<string, ThemeConfig> = {
  // ... existing themes
  'kodama-grove': {
    name: 'kodama-grove',
    label: 'Kodama Grove',
    cssFile: 'kodama-grove'
  }
};
```

6. **Add theme option** to the dropdown in `index.html`

### Available TweakCN Commands

```bash
# Popular themes from TweakCN
npx shadcn@latest add https://tweakcn.com/r/themes/kodama-grove.json
npx shadcn@latest add https://tweakcn.com/r/themes/midnight-purple.json
npx shadcn@latest add https://tweakcn.com/r/themes/ocean-breeze.json
npx shadcn@latest add https://tweakcn.com/r/themes/sunset-glow.json
```

### Adding shadcn/ui Components

```bash
# Add shadcn/ui components
npx shadcn@latest add button
npx shadcn@latest add dropdown-menu
npx shadcn@latest add card
```

## 🧪 Testing & Verification

### Manual Testing Checklist

1. **Theme Switching**
   - [ ] All themes load without FOUC
   - [ ] Theme selection persists on page reload
   - [ ] System preference detection works correctly
   - [ ] CSS class switching works correctly

2. **Accessibility**
   - [ ] Keyboard navigation works in dropdown
   - [ ] ARIA states update correctly
   - [ ] Focus management is proper
   - [ ] Screen reader compatibility

3. **Performance**
   - [ ] Theme switching is instant (CSS classes)
   - [ ] No network requests for theme switching
   - [ ] Smooth animations without jank
   - [ ] Proper localStorage behavior

### Browser DevTools Verification

1. **Elements Tab**: Verify CSS classes change on theme switch
2. **Performance Tab**: Check for smooth 60fps transitions
3. **Accessibility Tab**: Validate ARIA implementation
4. **Console**: No JavaScript errors during theme switching

### CSS Variable Inspection

Open DevTools and inspect the `:root` element to verify CSS variables are properly applied:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... etc */
}
```

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   └── utils.ts          # Utility functions
│   ├── main.ts                # Application entry point
│   ├── theme-manager.ts       # Theme loading and management
│   ├── dropdown-manager.ts    # Dropdown component logic
│   └── style.css             # Base styles and Tailwind imports
├── index.html                 # Main HTML template
├── components.json           # shadcn/ui configuration
├── package.json              # Dependencies and scripts
├── tailwind.config.cjs       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
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

## 🎯 Performance Considerations

### Optimization Strategies
- **CSS Classes**: Instant theme switching via CSS classes
- **No Network Requests**: All themes bundled in main CSS
- **Minimal Reflows**: Theme switching only updates CSS variables
- **Efficient Caching**: localStorage for theme persistence

### Bundle Size
- Base bundle: ~35KB (gzipped)
- Themes included in main CSS bundle
- No additional network requests for theme switching

## 🛠️ Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run type-check # Run TypeScript type checking
```

### Code Quality
- TypeScript strict mode enabled
- Comprehensive error handling
- ESLint and Prettier ready (configurations can be added)
- Performance monitoring hooks

## 📚 Additional Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TweakCN Theme Generator](https://tweakcn.com)
- [Vite Configuration Guide](https://vitejs.dev/config/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-theme`
3. Commit changes: `git commit -am 'Add new theme'`
4. Push to branch: `git push origin feature/new-theme`
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project as a starting point for your own theme switching implementations.