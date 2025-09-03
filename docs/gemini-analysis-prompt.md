# PASO 1: Análisis de Componente Basecoat

Analiza la documentación de Basecoat y responde en formato JSON:

```json
{
  "componentType": "button|card|alert|badge|select|etc",
  "baseClass": "btn|card|alert|badge|select",
  "requiresJavaScript": true|false,
  "jsFiles": ["basecoat.min.js", "component.min.js"],
  "variants": ["primary", "secondary", "outline", "ghost"],
  "sizes": ["sm", "lg"],
  "hasGroups": true|false,
  "isInteractive": true|false,
  "ariaDependencies": ["aria-controls", "aria-labelledby"]
}
```

**SOLO responde con el JSON. No agregues texto adicional.**