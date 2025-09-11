# GitHub Secrets Configuration

## Required Secrets for Release Workflow

Para que el workflow `release-full.yml` funcione correctamente, deben configurarse estos secrets en GitHub:

### 🔑 NPM Publishing
```
NPM_TOKEN
```
**Descripción**: Token de autenticación para publicar packages en NPM  
**Obtención**: 
1. `npm login` en terminal
2. `npm token create --type=automation`
3. Copiar el token generado

**Permisos necesarios**: Publish, Read

### 🤖 AI Integration
```
GOOGLE_AI_API_KEY
```
**Descripción**: API key para Google Gemini AI (usado en commit generation)  
**Obtención**:
1. Acceder a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crear nueva API key
3. Copiar la key generada

**Uso**: Análisis automático de cambios y generación de commits inteligentes

### 🔐 GitHub Token
```
GITHUB_TOKEN
```
**Descripción**: Token automático de GitHub Actions (ya disponible)  
**Configuración**: No requiere configuración manual, GitHub lo proporciona automáticamente

**Permisos**: Contents write, Pull requests write, Actions read

## 🛠️ Configuración en GitHub

### Pasos para configurar secrets:
1. Ir a **Settings** del repositorio
2. Seleccionar **Secrets and variables** → **Actions**
3. Hacer click en **New repository secret**
4. Agregar cada secret con el nombre exacto especificado arriba

### Verificación de configuración:
```bash
# Test local (debe funcionar igual que en CI)
npm run release:auto -- --dry-run --type patch

# Verificar que los commands del workflow funcionan
tsx project-utils/workflows/auto-release.ts --help
```

## 🚀 Workflow Usage

### Manual Dispatch (Recomendado)
1. Ir a **Actions** → **Release Full - Theme Manager**
2. Click en **Run workflow**
3. Configurar parámetros:
   - **Release type**: patch/minor/major
   - **Version prefix**: '', alpha, beta, rc
   - **Publish NPM**: true/false
   - **Create GitHub Release**: true/false
   - **Dry run**: true/false (para testing)

### Automatic Trigger
- Se ejecuta automáticamente en push a `master`
- Solo si hay cambios en `packages/`, `project-utils/`, o `package.json`
- Auto-detecta tipo de release basado en commit messages

## 🔧 Local Testing

Antes de usar en CI, verificar que funciona localmente:

```bash
# Test completo local
npm run release:auto -- --dry-run --type patch --publish-npm

# Test sin AI (si no tienes GOOGLE_AI_API_KEY)
npm run commit:generate  # Sin --auto-approve para revisar
npm run version:patch
npm run build:packages
```

## 📊 Monitoring

El workflow genera reportes automáticos en:
- **GitHub Actions Summary**: Estado detallado de cada paso
- **Release Notes**: Si se crea GitHub release
- **NPM Registry**: Packages publicados con tags apropiados

## 🚨 Troubleshooting

### Error: NPM authentication failed
- Verificar que `NPM_TOKEN` está configurado
- Verificar que el token tiene permisos de publish
- Re-generar token si ha expirado

### Error: AI API failed
- Verificar que `GOOGLE_AI_API_KEY` está configurado  
- Workflow continuará sin AI, pero commits serán manuales

### Error: Git push failed
- Verificar permisos del repositorio
- Verificar que no hay protected branch rules bloqueando

### Dry run para debugging
```bash
# En GitHub Actions, usar:
dry_run: true

# Localmente:
npm run release:auto -- --dry-run --type patch
```