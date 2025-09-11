# Project Utils - Sistema de Automatización Theme Manager

## 🚀 Comandos de Workflow Automatizado

### Release Automatizado (RECOMENDADO)
```bash
# Release completo con auto-commit + versión + build + GitHub
npm run release:auto

# Release con publicación NPM
npm run release:auto -- --type minor --publish-npm

# Release alpha para testing
npm run release:auto -- --type patch --prefix alpha --publish-npm

# Release beta feature-complete
npm run release:auto -- --type minor --prefix beta --publish-npm --publish-github

# Ver qué haría sin ejecutar (dry run)
npm run release:auto -- --dry-run --type minor --publish-npm
```

### Comandos Individuales
```bash
# Commits automatizados
npm run commit:auto           # Commit automático con análisis AI
npm run commit:generate       # Solo generar propuesta (sin commit)

# Versionado de monorepo
npm run version:auto          # Auto-detectar tipo de versión
npm run version:patch         # Forzar versión patch
npm run version:minor         # Forzar versión minor  
npm run version:major         # Forzar versión major

# Builds y validaciones
npm run build:packages        # Build todos los packages
npm run type-check:all        # TypeCheck todos los packages
```

## 🎯 Casos de Uso Principales

### 🤖 Desarrollo con Release Automatizado
```bash
# 1. Hacer cambios en cualquier package
# 2. Release completo en un comando
npm run release:auto -- --type patch --publish-npm

# Para releases importantes con changelog
npm run release:auto -- --type minor --publish-npm --publish-github
```

### 🧪 Testing y Validación
```bash
# Alpha releases para testing
npm run release:auto -- --type patch --prefix alpha --publish-npm

# Beta releases feature-complete  
npm run release:auto -- --type minor --prefix beta --publish-npm

# Ver qué cambios se harían
npm run release:auto -- --dry-run --type minor
```

### 🚀 Production Releases
```bash
# Release estable con GitHub release
npm run release:auto -- --type minor --publish-npm --publish-github

# Release major con breaking changes
npm run release:auto -- --type major --publish-npm --publish-github
```

## ⚙️ Configuración del Monorepo

### Packages Gestionados
- **theme-manager-core**: `@mks2508/shadcn-basecoat-theme-manager`
- **template-engine**: `@mks2508/simple-html-component-template-engine`
- **theme-manager-vanilla**: `@mks2508/theme-manager-vanilla`
- **theme-manager-react**: `@mks2508/theme-manager-react`
- **theme-manager-astro**: `@mks2508/theme-manager-astro`
- **theme-manager-web-components**: `@mks2508/theme-manager-web-components`
- **theme-manager-init**: `@mks2508/theme-manager-cli`

### Versionado Coordinado
- Todos los packages mantienen la misma versión
- Dependencies workspace actualizadas automáticamente
- Tags git creados para cada release
- Changelog generado automáticamente

## 📝 Formato de Commits

### Estructura Automática
```
tipo(scope): descripción

Descripción detallada de los cambios

<technical>
- Detalles técnicos específicos
- Archivos modificados y funciones
- Implementaciones realizadas
</technical>

<changelog>
✨ Entrada optimizada para changelog de usuarios finales
</changelog>
```

### Tipos Soportados
- **feat**: Nueva funcionalidad
- **fix**: Corrección de bugs  
- **feat-phase**: Desarrollo de feature en progreso
- **refactor**: Mejoras de código sin cambio funcional
- **docs**: Actualizaciones de documentación
- **chore**: Tareas de mantenimiento
- **perf**: Mejoras de rendimiento

## 🔧 Parámetros Avanzados

### Auto-Release Completo
```bash
# Release con todas las opciones
bun project-utils/workflows/auto-release.ts \
  --type minor \
  --prefix alpha \
  --increment 2 \
  --publish-npm \
  --publish-github \
  --auto-approve
```

**Parámetros disponibles:**
- **Version**: `--type` (major|minor|patch), `--prefix` (alpha|beta|rc|'')
- **Publishing**: `--publish-npm`, `--publish-github`
- **Control**: `--dry-run`, `--auto-approve`, `--skip-build`, `--skip-commit`

### Scripts Individuales
```bash
# Commit inteligente
bun project-utils/core/commit-generator.ts --auto-approve

# Version manager
bun project-utils/core/version-manager.ts --type minor --auto-approve --create-tag

# Solo análisis (sin ejecución)
bun project-utils/core/commit-generator.ts  # Solo genera propuesta
```

## 📁 Archivos Temporales

Ubicación: `project-utils/.temp/`
- `commit-proposal-YYYYMMDD-HHMMSS.md` - Propuestas de commit generadas
- Archivos de análisis y contexto temporal

## 🔒 Validaciones de Seguridad

- Solo funciona en rama `master`
- Validación de conflictos antes de ejecutar  
- Commits atómicos con rollback en caso de error
- Type-check completo antes de publish
- Build verification en todos los packages
- Validación de estado del repositorio

## 🌐 CI/CD Integration

### GitHub Actions Compatible
```yaml
- name: Auto Release
  run: npm run release:auto -- --auto-approve --type patch --publish-npm
```

### NPM Tags por Prefix
- **alpha**: `npm install @pkg@alpha`
- **beta**: `npm install @pkg@beta`  
- **rc**: `npm install @pkg@next`
- **stable**: `npm install @pkg@latest`

## 🔍 Debugging y Logs

- Logs detallados de cada paso del proceso
- Archivos temporales para debugging
- Rollback automático en caso de error
- Validación post-release

## 📊 Métricas y Reportes

- Tiempo de build por package
- Análisis de cambios por área funcional
- Reporte de dependencies actualizadas
- Changelog automático por release

---

## 🚨 Troubleshooting

### Error: "No hay cambios para hacer commit"
```bash
# Verificar estado
git status
# Si hay cambios unstaged
git add . && npm run commit:auto
```

### Error: "Build falló"
```bash
# Type-check individual
npm run type-check:all
# Build individual
npm run build:packages
```

### Error: "NPM publish falló"
```bash
# Verificar login
npm whoami
# Re-login si es necesario  
npm login
```

---

*Sistema creado para optimizar el workflow de desarrollo del Theme Manager monorepo*