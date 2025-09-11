/**
 * Plantillas de prompts estandarizadas para AI
 * @description Asegura respuestas consistentes y parseables en todos los scripts
 * @author MKS2508
 */

import { PROJECT_INFO } from '../config/project-config';

export interface AIPromptConfig {
  /** Contexto base del proyecto */
  projectContext: {
    name: string;
    description: string;
    version: string;
    techStack: string[];
    targetPlatform: string;
  };
  /** Tipo de análisis requerido */
  analysisType: 'commit' | 'workflow' | 'release';
  /** Contexto adicional específico */
  specificContext?: string;
  /** Datos estructurados para el análisis */
  data?: any;
}

export interface StandardResponseFormat {
  /** Análisis o resumen principal */
  analysis: string;
  /** Recomendaciones o acciones */
  recommendations: string;
  /** Datos estructurados (commits, comandos, etc.) */
  structured_data: any[];
}

/**
 * Configuración base del proyecto Theme Manager
 */
export const THEME_MANAGER_PROJECT_CONFIG = {
  name: PROJECT_INFO.displayName,
  description: PROJECT_INFO.description,
  version: '1.0.0', // Se actualizará dinámicamente
  techStack: ['TypeScript', 'React', 'Astro', 'Vanilla JS', 'shadcn/ui', 'Basecoat CSS', 'Tailwind CSS', 'Vite'] as const,
  targetPlatform: 'Multi-framework (React, Astro, Vanilla JS, Web Components)',
} as const;

/**
 * Prefijo estándar para todos los prompts de AI
 */
const STANDARD_PROMPT_PREFIX = `# Sistema de Análisis Inteligente - Theme Manager

Eres un asistente especializado en análisis de código y automatización para el proyecto Theme Manager. Tu función es proporcionar respuestas estructuradas, precisas y consistentes que puedan ser parseadas automáticamente.

## REGLAS CRÍTICAS DE FORMATO

1. **FORMATO DE RESPUESTA OBLIGATORIO**: Todas tus respuestas deben seguir exactamente el formato especificado más abajo.
2. **CONSISTENCIA**: Mantén la misma estructura sin importar la complejidad del análisis.
3. **PARSEABLE**: El formato debe ser fácil de procesar automáticamente con expresiones regulares.
4. **BLOQUES MARKDOWN**: Usa \`\`\`markdown para bloques de código cuando se especifique.
5. **SECCIONES TÉCNICAS**: Siempre incluye las secciones <technical> y <changelog> cuando sea aplicable.

## Contexto del Proyecto
**Nombre**: ${THEME_MANAGER_PROJECT_CONFIG.name}
**Descripción**: ${THEME_MANAGER_PROJECT_CONFIG.description}
**Versión Actual**: ${THEME_MANAGER_PROJECT_CONFIG.version}
**Stack Tecnológico**: ${THEME_MANAGER_PROJECT_CONFIG.techStack.join(', ')}
**Plataforma Objetivo**: ${THEME_MANAGER_PROJECT_CONFIG.targetPlatform}

## Arquitectura del Monorepo
- **packages/theme-manager-core**: Sistema central de gestión de temas y fuentes
- **packages/template-engine**: Motor de templates para vanilla JS
- **packages/theme-manager-vanilla**: Implementación para Basecoat CSS
- **packages/theme-manager-react**: Hooks y componentes React con shadcn/ui
- **packages/theme-manager-astro**: Componentes Astro e islands
- **packages/theme-manager-web-components**: Web Components nativos
- **packages/theme-manager-init**: CLI para instalación de temas

---
`;

/**
 * Sufijo estándar con instrucciones de formato
 */
const STANDARD_PROMPT_SUFFIX = `

---

## INSTRUCCIONES FINALES

1. **Lee cuidadosamente** toda la información proporcionada
2. **Analiza el contexto** y los datos específicos
3. **Genera una respuesta** siguiendo EXACTAMENTE el formato especificado
4. **Mantén consistencia** en la estructura y sintaxis
5. **No desvíes** del formato requerido bajo ninguna circunstancia

**IMPORTANTE**: La respuesta debe ser parseada automáticamente. Cualquier desviación del formato especificado causará errores en el sistema.`;

/**
 * Genera prompt para análisis de commits
 */
export function createCommitPrompt(config: AIPromptConfig): string {
  const { data, specificContext } = config;
  
  return `${STANDARD_PROMPT_PREFIX}

# ANÁLISIS DE COMMITS

## Datos del Análisis
${JSON.stringify(data, null, 2)}

## Contexto Adicional
${specificContext || 'No se proporcionó contexto adicional'}

## FORMATO DE RESPUESTA REQUERIDO

### **ANÁLISIS PRINCIPAL**

[Resumen conciso del análisis de los cambios, contexto funcional y técnico de las modificaciones]

---

### **Propuesta de Commit #1**

\`\`\`markdown
[tipo](packages - descripción): título del commit

Descripción detallada del commit explicando el QUE y el POR QUÉ de los cambios realizados.

<technical>
[Detalles técnicos específicos de la implementación, archivos modificados, funciones agregadas, etc.]
</technical>

<changelog>
[Entrada de changelog en formato markdown optimizada para usuarios finales]
</changelog>
\`\`\`

---

**DECISIÓN**: [Justificación de por qué se propone este formato de commit específico]

${STANDARD_PROMPT_SUFFIX}`;
}

/**
 * Genera prompt para análisis de releases
 */
export function createReleasePrompt(config: AIPromptConfig): string {
  const { data, specificContext } = config;
  
  return `${STANDARD_PROMPT_PREFIX}

# ANÁLISIS DE RELEASE

## Datos del Análisis
${JSON.stringify(data, null, 2)}

## Contexto Adicional
${specificContext || 'No se proporcionó contexto adicional'}

## FORMATO DE RESPUESTA REQUERIDO

### **ANÁLISIS DE VERSIÓN**

[Análisis del tipo de cambios y recomendación de versión (major/minor/patch)]

### **CHANGELOG GENERADO**

\`\`\`markdown
## [Versión] - YYYY-MM-DD

### ✨ Features
- [Nuevas funcionalidades]

### 🐛 Fixes  
- [Correcciones de bugs]

### 🔧 Chores
- [Tareas de mantenimiento]

### 📝 Documentation
- [Actualizaciones de documentación]

### ⚡ Performance
- [Mejoras de rendimiento]
\`\`\`

### **RELEASE NOTES**

[Notas de release para GitHub con contexto para usuarios finales]

${STANDARD_PROMPT_SUFFIX}`;
}

/**
 * Genera prompt para análisis de workflow
 */
export function createWorkflowPrompt(config: AIPromptConfig): string {
  const { data, specificContext } = config;
  
  return `${STANDARD_PROMPT_PREFIX}

# ANÁLISIS DE WORKFLOW

## Datos del Análisis
${JSON.stringify(data, null, 2)}

## Contexto Adicional
${specificContext || 'No se proporcionó contexto adicional'}

## FORMATO DE RESPUESTA REQUERIDO

### **ANÁLISIS DEL WORKFLOW**

[Resumen del análisis del workflow y recomendaciones]

### **COMANDOS SUGERIDOS**

\`\`\`bash
# [Descripción de los comandos]
[comandos específicos a ejecutar]
\`\`\`

### **VALIDACIONES NECESARIAS**

- [Lista de validaciones requeridas antes de ejecutar]

${STANDARD_PROMPT_SUFFIX}`;
}

/**
 * Template para commit que sigue el patrón del proyecto
 */
export const COMMIT_TEMPLATE = {
  prefix: (type: string, scope: string, description: string) => 
    `${type}(${scope}): ${description}`,
  
  body: (description: string) => description,
  
  technical: (details: string[]) => 
    `<technical>\n${details.map(d => `- ${d}`).join('\n')}\n</technical>`,
  
  changelog: (entry: string) =>
    `<changelog>\n${entry}\n</changelog>`
};