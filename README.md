# Sistema de Gestión de Temas - Monorepo de Producción

Un **ecosistema completo de gestión de temas** construido como monorepo NPM modular. Maneja temas dinámicos, gestión de fuentes, e inyección de variables CSS a través de múltiples frameworks. Usado en producción para cambio de temas fluido con shadcn/ui, Basecoat CSS, y sistemas de diseño personalizados.

> **Lo que realmente hace**: Proporciona infraestructura de cambio de temas que funciona con React, Astro, Vanilla JS, y Web Components. Gestiona variables CSS, carga de Google Fonts, y estado de temas persistente con rendimiento de cambio <15ms.

## 📦 Arquitectura de Packages NPM

### **Sistema Core**
- **[@mks2508/shadcn-basecoat-theme-manager](packages/theme-manager-core/)** - Lógica de temas, gestión de variables CSS, sistema de fuentes (agnóstico al framework)
- **[@mks2508/simple-html-component-template-engine](packages/template-engine/)** - Sistema de templates de componentes para vanilla JS

### **Implementaciones por Framework**  
- **[@mks2508/theme-manager-vanilla](packages/theme-manager-vanilla/)** - Integración con Basecoat CSS y sistema de componentes
- **[@mks2508/theme-manager-react](packages/theme-manager-react/)** - Hooks de React, providers, y componentes
- **[@mks2508/theme-manager-astro](packages/theme-manager-astro/)** - Componentes Astro e islands
- **[@mks2508/theme-manager-web-components](packages/theme-manager-web-components/)** - Custom elements nativos

### **Herramientas de Desarrollo**
- **[@mks2508/theme-manager-cli](packages/theme-manager-init/)** - CLI para inicialización de proyectos e instalación de temas

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

#### Implementación React
```bash
npm install @mks2508/shadcn-basecoat-theme-manager @mks2508/theme-manager-react
```

```jsx
import { ThemeProvider, ThemeSelector, useTheme } from '@mks2508/theme-manager-react';

function App() {
  return (
    <ThemeProvider defaultTheme="default" defaultMode="auto">
      <ThemeSelector />
      <MiApp />
    </ThemeProvider>
  );
}

function MiComponente() {
  const { setTheme, currentTheme } = useTheme();
  // ...
}
```

#### Implementación Astro
```bash
npm install @mks2508/shadcn-basecoat-theme-manager @mks2508/theme-manager-astro
```

```astro
---
import { ThemeProvider, ThemeSelector } from '@mks2508/theme-manager-astro';
---

<ThemeProvider client:load>
  <ThemeSelector client:visible />
  <main>
    <!-- Tu contenido -->
  </main>
</ThemeProvider>
```

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

## ⚡ Rendimiento y Características Técnicas

### Métricas de Rendimiento
- **Cambio de tema**: <15ms promedio (visible en logs WebSocket)
- **Inyección de variables CSS**: <1ms para la mayoría de temas
- **Carga de fuentes**: Con caché después de primera carga
- **Renderizado de componentes**: <5ms para la mayoría de componentes

### Características Técnicas Destacadas
- **Carga Dinámica CSS**: Temas cargados bajo demanda desde archivos separados
- **Caché de Fuentes**: Google Fonts cacheadas automáticamente
- **Limpieza de Eventos**: Prevención automática de memory leaks
- **Almacenamiento IndexedDB**: Persistencia rápida para temas y preferencias
- **Caché de Templates**: Templates HTML estáticos bundleados en build time

### Stack Tecnológico
- **@mks2508/better-logger**: Sistema de logging avanzado con categorías
- **@tailwindcss/vite**: Tailwind CSS v4 con integración Vite
- **basecoat-css**: Librería de componentes moderna
- **ws**: Soporte WebSocket para logging remoto
- **tsx**: Ejecución TypeScript para scripts de instalación

> **Implementación Técnica Detallada**: Para arquitectura del sistema, configuración de Vite, debugging avanzado, y detalles de implementación, consulta la [**Wiki Técnica**](../../wiki/Technical-Implementation) en GitHub.

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
- 📖 [**Wiki del Proyecto**](../../wiki) - Documentación técnica completa
- 🔧 [**Development Workflow**](../../wiki/Development-Workflow) - Pipeline CI/CD y automatización
- 🏗️ [**Technical Implementation**](../../wiki/Technical-Implementation) - Arquitectura y configuración
- 🎮 [**WebStorm Setup**](../../wiki/WebStorm-Configuration) - Configuraciones de IDE
- 🤖 [**Project Utils**](../../wiki/Project-Utils) - Herramientas de automatización

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama de feature: `git checkout -b feature/nuevo-tema`
3. Commit de cambios: `npm run commit:ui` (interfaz interactiva)
4. Push a la rama: `git push origin feature/nuevo-tema`
5. Enviar pull request

## 📄 Licencia

MIT License - siéntete libre de usar este proyecto como punto de partida para tus propias implementaciones de cambio de temas.

---

**Desarrollado por MKS2508** | [GitHub](https://github.com/MKS2508) | [NPM Profile](https://www.npmjs.com/~mks2508)