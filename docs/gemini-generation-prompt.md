# PASO 2: Generación de Componente Astro

Usando el análisis previo, genera el componente Astro siguiendo estas reglas ESTRICTAS:

## Reglas CSS Basecoat:
- **primary** → `btn` (sin sufijo)
- **otras variantes** → `btn-{variant}`  
- **tamaños** → se combinan: `btn-sm`, `btn-lg-outline`

## Formato de Respuesta OBLIGATORIO:
```
<component>
[CÓDIGO ASTRO AQUÍ]
</component>
```

## Ejemplo Button:
```astro
---
export interface Props {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'lg';
  class?: string;
}

const { variant = "primary", size, class: className = "" } = Astro.props;

let buttonClass = 'btn';
if (variant !== 'primary') {
  buttonClass = `btn-${variant}`;
}
if (size) {
  buttonClass = variant === 'primary' ? `btn-${size}` : `btn-${size}-${variant}`;
}
---

<button class={`${buttonClass} ${className}`.trim()}>
  <slot />
</button>
```

**IMPORTANTE**: 
- Usa EXACTAMENTE el formato `<component></component>`
- NO agregues markdown code blocks
- NO agregues explicaciones adicionales