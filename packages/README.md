# Theme Manager Monorepo

Sistema modular de gestión de temas para shadcn/ui y Basecoat CSS.

## 📦 Packages

### @mks2508/shadcn-basecoat-theme-manager (Core)
Package principal con la lógica core de gestión de temas y fuentes. Sin dependencias de UI.

**Características:**
- Gestión de temas con CSS variables
- Sistema de overrides de fuentes
- Carga dinámica de Google Fonts
- Persistencia en IndexedDB
- Instalación desde URLs (TweakCN)
- Cache y optimización de rendimiento

### @mks2508/simple-html-component-template-engine
Sistema de componentes y templates para vanilla JS.

**Características:**
- Motor de templates Mustache-like
- Sistema de componentes con BaseComponent
- Gestión automática de eventos
- Sin dependencias externas

### @mks2508/theme-manager-vanilla
Implementación para Basecoat CSS y vanilla JS.

**Características:**
- API programática simple
- Métodos para montar selectores
- Compatible con cualquier framework CSS

### @mks2508/theme-manager-react
Hooks y componentes React para gestión de temas.

**Características:**
- Context API con ThemeProvider
- Hook useTheme
- Componentes pre-construidos
- Compatible con shadcn/ui

### @mks2508/theme-manager-web-components
Web Components autónomos para gestión de temas.

**Características:**
- Custom elements nativos
- Shadow DOM encapsulation
- Auto-registro
- Framework agnostic

## 🚀 Instalación

### Core + Vanilla
```bash
npm install @mks2508/shadcn-basecoat-theme-manager @mks2508/theme-manager-vanilla
```

### React
```bash
npm install @mks2508/shadcn-basecoat-theme-manager @mks2508/theme-manager-react
```

### Web Components
```bash
npm install @mks2508/shadcn-basecoat-theme-manager @mks2508/theme-manager-web-components
```

## 💻 Uso

### Vanilla JS
```javascript
import { createThemeManager } from '@mks2508/theme-manager-vanilla';

const themeManager = createThemeManager({
  autoInit: true
});

// Montar selector de temas
themeManager.mountThemeSelector('#theme-selector');

// API programática
await themeManager.setTheme('supabase', 'dark');
```

### React
```jsx
import { ThemeProvider, ThemeSelector, useTheme } from '@mks2508/theme-manager-react';

function App() {
  return (
    <ThemeProvider defaultTheme="default" defaultMode="auto">
      <ThemeSelector />
      <MyApp />
    </ThemeProvider>
  );
}

function MyComponent() {
  const { setTheme, currentTheme } = useTheme();
  // ...
}
```

### Web Components
```html
<!-- Auto-registrado -->
<script type="module" src="@mks2508/theme-manager-web-components"></script>

<!-- Usar los componentes -->
<theme-selector></theme-selector>
<dark-mode-toggle></dark-mode-toggle>
```

## 🏗️ Arquitectura

```
packages/
├── theme-manager-core/      # Lógica core sin UI
├── template-engine/         # Sistema de componentes vanilla
├── theme-manager-vanilla/   # Implementación Basecoat
├── theme-manager-react/     # Hooks y componentes React
└── theme-manager-web-components/ # Custom elements
```

## 📄 Licencia

MIT