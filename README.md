# Multi-Theme Manager - Superando las Limitaciones de Tailwind CSS

**El problema**: Tailwind CSS solo permite un tema por defecto. Para tener múltiples temas necesitas configuración manual compleja con CSS variables, plugins, o refactorizar todo tu sistema.

**Mi solución**: Un sistema completo que extiende Tailwind CSS para soportar múltiples temas dinámicos, compatible con el ecosistema de [tweakcn.com](https://tweakcn.com) y adaptado tanto para shadcn/ui (React) como Basecoat UI (otros frameworks).

## ¿Por qué existe esto?

- **Tailwind CSS nativo**: Solo 1 tema, cambios requieren rebuild
- **shadcn/ui nativo**: Solo React, theming limitado  
- **Basecoat UI**: Excelente alternativa a shadcn, pero sin multi-tema
- **tweakcn.com**: Crea temas hermosos, pero no los gestiona dinámicamente

**Este sistema conecta todo**: instala temas de tweakcn, los gestiona desde el cliente, persiste preferencias de usuario, y funciona en cualquier framework.

## 🎯 Lo que realmente resuelve

### **Para Developers**
- **Múltiples temas sin refactorizar**: Cambias `data-theme="dark"` y funciona
- **Compatible tweakcn**: Instalas cualquier tema de tweakcn.com directamente
- **Multi-framework**: Mismo sistema para React (shadcn style) y Astro/Vanilla (Basecoat style)
- **Sin configuración**: CLI automatiza toda la integración

### **Para Usuarios Finales**
- **Selector de temas visual**: Los usuarios pueden elegir y cambiar temas
- **Instalación de temas**: URLs de tweakcn.com → instalan automáticamente  
- **Persistencia**: IndexedDB + localStorage mantiene preferencias
- **Personalización de fuentes**: Google Fonts con override por usuario

## 📦 Arquitectura del Sistema

### **Core Engine** (Framework-Agnostic)
- **[@mks2508/shadcn-basecoat-theme-manager](packages/theme-manager-core/)** - ThemeManager, CSS variables injection, tweakcn integration
- **[@mks2508/simple-html-component-template-engine](packages/template-engine/)** - Template system para componentes vanilla

### **Framework Implementations** (Plug & Play)
- **[@mks2508/theme-manager-react](packages/theme-manager-react/)** - Hooks, providers, componentes estilo shadcn/ui
- **[@mks2508/theme-manager-astro](packages/theme-manager-astro/)** - Mi implementación Basecoat personalizada para Astro
- **[@mks2508/theme-manager-vanilla](packages/theme-manager-vanilla/)** - Basecoat CSS + componentes de gestión
- **[@mks2508/theme-manager-web-components](packages/theme-manager-web-components/)** - Custom elements reutilizables

### **Developer Tools**
- **[@mks2508/theme-manager-cli](packages/theme-manager-init/)** - Automatización de setup e instalación de temas

## 🚀 Inicio Rápido

### Uso de Packages NPM

#### Implementación Vanilla JS
```bash
npm install @mks2508/shadcn-basecoat-theme-manager @mks2508/theme-manager-vanilla
```

```javascript
import { createThemeManager } from '@mks2508/theme-manager-vanilla';

const themeManager = createThemeManager({
  autoInit: true
});

// Montar selector de temas
themeManager.mountThemeSelector('#theme-selector');

// Uso programático
await themeManager.setTheme('supabase', 'dark');
await themeManager.installThemeFromUrl('https://tweakcn.com/r/themes/tema.json');
```

#### React (Estilo shadcn/ui)
```bash
npm install @mks2508/shadcn-basecoat-theme-manager @mks2508/theme-manager-react
```

```jsx
import { ThemeProvider, ThemeSelector, useTheme } from '@mks2508/theme-manager-react';

// Plug & play - funciona como shadcn/ui pero con multi-tema
function App() {
  return (
    <ThemeProvider defaultTheme="supabase" defaultMode="auto">
      <ThemeSelector /> {/* Dropdown con todos los temas instalados */}
      <DashboardShadcn /> {/* Tus componentes shadcn normales */}
    </ThemeProvider>
  );
}

function MiComponente() {
  const { setTheme, installTheme, themes } = useTheme();
  
  // Instalar tema desde tweakcn dinámicamente
  const handleInstallTheme = async () => {
    await installTheme('https://tweakcn.com/r/themes/kodama-grove.json');
  };
}
```

#### Astro (Con @mks2508/basecoat-astro-components)
```bash
npm install @mks2508/shadcn-basecoat-theme-manager @mks2508/theme-manager-astro @mks2508/basecoat-astro-components
```

```astro
---
// Usa mi set personalizado de componentes Basecoat adaptados para Astro
// Basados en basecoat-css pero con mis cambios de estilos y completamente Astro-friendly
import { ThemeProvider, ThemeSelector, ThemeInstaller } from '@mks2508/theme-manager-astro';
import { Button, Card, Modal } from '@mks2508/basecoat-astro-components';
---

<ThemeProvider client:load>
  <header>
    <ThemeSelector client:visible />
    <ThemeInstaller client:visible /> {/* Modal para instalar temas de tweakcn */}
  </header>
  <main>
    <!-- Mis componentes Basecoat personalizados con multi-tema automático -->
    <Card>
      <Button variant="primary">Cambia automáticamente con cada tema</Button>
    </Card>
  </main>
</ThemeProvider>
```

> **Crédito**: La implementación Astro está basada en [Basecoat UI](https://basecoatui.com/) con adaptaciones y modificaciones personalizadas para funcionar nativamente en Astro y con mis preferencias de estilos.

#### Web Components
```bash
npm install @mks2508/shadcn-basecoat-theme-manager @mks2508/theme-manager-web-components
```

```html
<!-- Custom elements auto-registrados -->
<script type="module" src="@mks2508/theme-manager-web-components"></script>

<theme-selector></theme-selector>
<dark-mode-toggle></dark-mode-toggle>
```

#### CLI de Inicialización
```bash
# Instalar globalmente
npm install -g @mks2508/theme-manager-cli

# Inicializar en proyecto existente
theme-manager init astro
theme-manager init react

# Instalar tema desde URL
theme-manager install https://tweakcn.com/r/themes/tema.json
```

---

### Configuración de Desarrollo (Monorepo)

#### Prerrequisitos
- Node.js 18+
- pnpm (recomendado) o npm con soporte workspaces

#### Instalación y Desarrollo

1. **Configurar workspaces:**
```bash
pnpm install  # Configura automáticamente workspaces y enlaza packages
```

2. **Desarrollo con Debugging Remoto (Recomendado):**
```bash
# Terminal 1: Servidor de logging WebSocket
npm run dev:logger

# Terminal 2: Servidor de desarrollo
npm run dev

# Resultado: Los logs del navegador aparecen en Terminal 1 con timestamps
# Abre: http://localhost:3000
```

3. **Desarrollo Estándar:**
```bash
npm run dev
# Abre: http://localhost:3000
```

### Build para Producción

```bash
# Build de todos los packages (listos para NPM)
npm run build:packages

# Verificar tipos en todos los packages
npm run type-check:all

# Build de aplicación demo
npm run build

# Previsualizar build de producción
npm run preview
```

### Comandos Disponibles

#### Comandos de Monorepo
```bash
pnpm install                    # Configurar workspaces y enlazar packages
pnpm run build:packages         # Build de todos los packages NPM
pnpm run type-check:all         # Validación TypeScript de todos los packages
```

#### Comandos de la Aplicación Demo
```bash
npm run dev                     # Servidor de desarrollo (puerto 3000)
npm run dev:logger              # Servidor de logging WebSocket (puerto 8081)
npm run build                   # Build de producción (app demo)
npm run preview                 # Previsualizar build de producción
npm run install-theme           # Instalar tema desde URL
```

#### Build de Packages Individuales
```bash
npm run build:core              # Build package core
npm run build:vanilla           # Build package vanilla
npm run build:react             # Build package React
npm run build:astro             # Build package Astro
npm run build:web-components    # Build package web-components
npm run build:template-engine   # Build template engine
```

#### Automatización y Release
```bash
npm run commit:auto             # Generar commit inteligente
npm run commit:ui               # Interfaz de commits interactiva
npm run release:patch           # Release patch version
npm run release:minor           # Release minor version
npm run release:major           # Release major version (publica en ambos registries)
npm run workflow:full           # Pipeline completo de automatización
```

> **Documentación Técnica Completa**: Para detalles sobre project-utils, configuración de WebStorm, pipelines CI/CD, y workflows de desarrollo avanzados, consulta la [**Wiki del Proyecto**](../../wiki) en GitHub.

## 🎨 Visión General de la Arquitectura

### Sistema de Packages del Monorepo
Este proyecto utiliza una **arquitectura de monorepo NPM modular** con desarrollo basado en workspaces:

| **Package** | **Propósito** | **Dependencies** |
|-------------|---------------|------------------|
| `@mks2508/shadcn-basecoat-theme-manager` | **CORE** - Lógica de temas y fuentes (sin UI) | `@mks2508/better-logger` |
| `@mks2508/simple-html-component-template-engine` | Sistema de componentes + templates | None (standalone) |
| `@mks2508/theme-manager-vanilla` | Implementación Basecoat CSS | core + template-engine |
| `@mks2508/theme-manager-react` | Hooks React & componentes | core + React |
| `@mks2508/theme-manager-astro` | Componentes Astro | core + Astro |
| `@mks2508/theme-manager-web-components` | Custom Elements | core |
| `@mks2508/theme-manager-cli` | CLI de automatización | core + commander |

### Características Core
- **Carga Dinámica de Temas**: Archivos CSS cargados bajo demanda con tracking de rendimiento
- **Packages Modulares**: Packages NPM independientes con APIs limpias
- **Múltiples Implementaciones**: Vanilla JS, React, Astro, Web Components
- **Debugging Remoto**: Streaming de logs del navegador al terminal vía WebSocket
- **Logging Avanzado**: @mks2508/better-logger con salida categorizada y estilizada
- **Desarrollo en Workspace**: Enlazado automático de packages y resolución de dependencias

### Temas Disponibles

| Tema | Descripción | Características |
|------|-------------|----------------|
| **Default** | Tema limpio del sistema | Fuentes del sistema, diseño minimalista |
| **Supabase** | Tema inspirado en la marca | Fuente Outfit, acentos verdes |
| **Tangerine** | Tema cálido | Inter + JetBrains Mono, tonos naranjas |
| **Custom** | Instalación desde URLs | Compatible con TweakCN |

### Instalación de Temas Personalizados

#### 1. **Via CLI**:
```bash
npm run install-theme https://tweakcn.com/r/themes/[nombre-tema].json
```

#### 2. **Via interfaz web**: 
- Abrir navegador → Dropdown de temas → "Browse themes"
- Pegar URL del tema → Preview → Instalar

#### 3. **Via CLI de inicialización**:
```bash
theme-manager install https://tweakcn.com/r/themes/tema.json
```

### Ejemplo: Instalación de Tema

```bash
# Instalar tema via CLI
npm run install-theme https://tweakcn.com/r/themes/kodama-grove.json

# Ver progreso en terminal WebSocket:
# 📦 Tema descargado: kodama-grove
# 🎨 CSS generado: src/themes/kodama-grove-light.css  
# ✅ Tema instalado exitosamente
```

## 🤝 Comparación Honesta con Alternativas

| Solución | Multi-tema | Framework Support | User Theme Installation | Setup |
|----------|-----------|-------------------|-------------------------|--------|
| **Este Sistema** | ✅ Dinámico | React, Astro, Vanilla, Web Components | ✅ tweakcn.com URLs | CLI automático |
| **shadcn/ui nativo** | ❌ Solo 1 | Solo React | ❌ Manual | Manual complejo |
| **Basecoat UI nativo** | ❌ Solo 1 | Framework agnostic | ❌ No soportado | Manual |
| **DaisyUI** | ✅ Múltiples | Framework agnostic | ❌ Solo predefinidos | Manual |
| **NextUI** | ✅ Light/Dark | Solo React | ❌ Solo predefinidos | Manual |
| **tweakcn.com** | ✅ Generador | No gestiona | ❌ Solo generación | N/A |

## ⚙️ Cómo funciona técnicamente

### **Superando la Limitación de Tailwind**
```css
/* Tailwind nativo - Solo 1 tema */
:root {
  --color-primary: #3b82f6;
}

/* Mi sistema - Múltiples temas dinámicos */
[data-theme="supabase"] {
  --color-primary: #10b981;
}
[data-theme="tangerine"] {
  --color-primary: #f97316;
}
```

### **Integración tweakcn**
```bash
# Usuario instala tema con URL
npm run install-theme https://tweakcn.com/r/themes/kodama-grove.json

# Sistema automáticamente:
# 1. Descarga configuración JSON
# 2. Genera CSS variables
# 3. Registra en ThemeManager
# 4. Disponible inmediatamente
```

### **Persistencia de Usuario**
- **IndexedDB**: Temas instalados, configuraciones
- **localStorage**: Tema activo, preferencias de fuentes
- **CSS data attributes**: Cambio instantáneo sin reload

### **Performance Real**
- **Cambio de tema**: ~12ms (medido, no estimado)
- **Instalación de tema**: ~200ms (download + parsing + registration)
- **Bundle size**: Core 8KB, frameworks 15-25KB c/u

## 🔍 Debugging y Desarrollo

### Logging Remoto WebSocket

El proyecto incluye un **sistema de debugging remoto vía WebSocket** para ver los logs del navegador en tu terminal:

```bash
# Terminal 1: Servidor de logging
npm run dev:logger

# Terminal 2: Desarrollo
npm run dev

# Los logs del navegador aparecen en Terminal 1 en tiempo real:
# 18:13:26 [LOG] 🎨 Cambiando a tema: supabase
# 18:13:26 [LOG] ⚡ Variables CSS aplicadas: 0.2ms
# 18:13:26 [LOG] 🚀 Cambio de tema [supabase-light]: 12.1ms
```

### Tipos de Log Soportados
- `console.log/info/error/warn/debug` - Información general y errores
- **Better-logger**: Logs estilizados y categorizados con timestamps

## 📁 Estructura del Proyecto

```
# Monorepo Structure
├── packages/                     # 7 packages NPM modulares
│   ├── theme-manager-core/           # Sistema core (framework-agnostic)
│   ├── template-engine/              # Engine de templates
│   ├── theme-manager-vanilla/        # Implementación Basecoat CSS
│   ├── theme-manager-react/          # Hooks y componentes React
│   ├── theme-manager-astro/          # Componentes Astro
│   ├── theme-manager-web-components/ # Custom Elements
│   └── theme-manager-init/           # CLI de automatización
├── src/                          # Demo application
├── examples/                     # Ejemplos de uso
├── project-utils/               # Automatización y pipelines
├── .github/workflows/           # CI/CD con publicación dual
└── logger-server.js             # Debugging remoto WebSocket
```

## 🚀 Pipeline de Publicación

### Publicación Automática
```bash
npm run release:patch      # Release patch → NPM registry
npm run release:minor      # Release minor → NPM registry  
npm run release:major      # Release major → NPM + GitHub Packages
```

### Workflow Completo con AI
```bash
npm run workflow:full      # Commit automático + release + publicación
```

> **Pipeline CI/CD Detallada**: Para detalles sobre workflows de GitHub, configuración de secrets, automatización con AI, y project-utils, consulta la [**Wiki de Desarrollo**](../../wiki/Development-Workflow).

## 🛠️ Workflow de Desarrollo Recomendado

```bash
# 1. Inicializar con debugging remoto
npm run dev:logger    # Terminal 1: Servidor WebSocket
npm run dev          # Terminal 2: Desarrollo

# 2. Ver logs en tiempo real en Terminal 1
# 3. Navegar a: http://localhost:3000
```

## 📚 Recursos y Documentación

### Tecnologías Core
- [Tailwind CSS v4](https://tailwindcss.com/docs) - Framework CSS utility-first
- [Basecoat UI](https://basecoat.design) - Librería de componentes moderna
- [Vite](https://vitejs.dev) - Build tool y servidor de desarrollo rápido
- [TypeScript](https://www.typescriptlang.org) - JavaScript tipado

### Herramientas de Desarrollo
- [@mks2508/better-logger](https://www.npmjs.com/package/@mks2508/better-logger) - Sistema de logging avanzado
- [WebSocket API](https://developer.mozilla.org/es/docs/Web/API/WebSockets_API) - Comunicación en tiempo real
- [IndexedDB](https://developer.mozilla.org/es/docs/Web/API/IndexedDB_API) - Almacenamiento client-side

### Documentación Técnica Completa
- [**Wiki del Proyecto**](../../wiki) - Setup avanzado, configuración, troubleshooting
- [**Development Workflow**](../../wiki/Development-Workflow) - Pipeline CI/CD con publicación dual NPM + GitHub
- [**Technical Implementation**](../../wiki/Technical-Implementation) - Arquitectura interna, Vite config, debugging
- [**WebStorm Configuration**](../../wiki/WebStorm-Configuration) - Run configurations para desarrollo
- [**Project Utils**](../../wiki/Project-Utils) - Automatización con AI, commit workflows

## 🤝 Contribuir

El proyecto está en desarrollo activo. Si encuentras bugs o tienes ideas:

1. Fork del repositorio
2. Branch para tu feature: `git checkout -b feature/mejora-tema`
3. Commit usando la herramienta: `npm run commit:ui` 
4. Push y PR

**Áreas donde necesito ayuda**:
- Testing suite (actualmente placeholder)
- Más adaptadores de frameworks (Vue, Svelte)
- Optimizaciones de performance
- Documentación de componentes

## 📄 Licencia

MIT License

---

**Hecho por MKS2508** con frustración hacia las limitaciones de Tailwind CSS y amor por los sistemas de diseño flexibles.

**Inspirado por**:
- [Basecoat UI](https://basecoatui.com/) - Filosofía de componentes sin React
- [tweakcn.com](https://tweakcn.com) - Ecosystem de temas para shadcn  
- [shadcn/ui](https://ui.shadcn.com/) - La forma correcta de hacer component libraries

[GitHub](https://github.com/MKS2508) • [NPM Profile](https://www.npmjs.com/~mks2508)