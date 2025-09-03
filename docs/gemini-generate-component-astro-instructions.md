# Genera Componente Astro desde Basecoat UI

## Reglas:
1. **Busca HTML principal** en "Step 2: Add your HTML"
2. **Crea props tipadas**: variant, size, disabled, class
3. **Mantén clases Basecoat**: btn, select, card, etc.  
4. **Genera IDs únicos** si el componente es interactivo
5. **Preserva ARIA** y accesibilidad
6. **Comenta JavaScript** si lo requiere

## Estructura Astro:
```astro
---
export interface Props {
  variant?: string;
  class?: string;
}
const { variant = "primary", class: className = "" } = Astro.props;
---
<button class={`btn-${variant} ${className}`}>
  <slot />
</button>
```

## Responde con:
Análisis breve + componente en `<component></component>`