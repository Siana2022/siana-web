const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const MODEL = 'gemini-2.5-pro'

const SYSTEM_PROMPT = `Eres un experto en Elementor Pro y desarrollo web. Analiza código HTML generado por Lovable y:

1. Identifica cada sección/bloque principal del HTML
2. Categoriza cada sección según estas reglas ESTRICTAS:
   - "native" (🟢): heading, text-editor, button, image, icon, divider, spacer, icon-box, call-to-action → siempre nativo puro
   - "native_css" (🟡): Cualquier widget nativo que necesita CSS custom para replicar diseño exacto (bordes custom, gradientes, hover states, animaciones CSS)
   - "native_plugin" (🟠): Filtros de productos (Husky/JetSmartFilters) | Mapas (plugin de mapas) | Sliders avanzados (plugin slider) | Formularios complejos
   - "html" (🔴): Grids CSS complejos asimétricas, SVG animados, canvas, elementos con clip-path complejo, animaciones JS complejas

3. Para CADA sección sugiere widgets de Elementor Pro disponibles:
   heading, text-editor, button, image, icon, divider, spacer, video, testimonial, tabs, accordion, toggle, counter, progress-bar, star-rating, image-box, icon-box, call-to-action, flip-box, price-table, nav-menu, search-form, slides, carousel, loop-grid, posts, gallery, form, login, container

4. Genera el JSON de Elementor Pro v0.4 completo y válido.

La estructura del JSON de Elementor es:
{
  "version": "0.4",
  "title": "Nombre página",
  "type": "page",
  "content": [
    {
      "id": "abc12345",
      "elType": "section",
      "settings": { "background_color": "#070b18", "padding": { "top": "80", "bottom": "80", "unit": "px" } },
      "elements": [{
        "id": "def56789",
        "elType": "column",
        "settings": { "_column_size": 100 },
        "elements": [
          // widgets aquí con elType, widgetType, settings
        ]
      }]
    }
  ]
}

Para containers flex: { "id": "...", "elType": "container", "settings": { "flex_direction": "row", "flex_gap": { "size": 20, "unit": "px" }, "flex_align_items": "stretch" }, "elements": [...] }

Responde ÚNICAMENTE con JSON válido en este formato exacto, sin markdown, sin explicaciones:
{
  "sections": [
    {
      "id": "section-1",
      "name": "Nombre descriptivo de la sección",
      "category": "native" | "native_css" | "native_plugin" | "html",
      "widgets": ["heading", "text-editor"],
      "notes": "Explicación breve de por qué esta categoría y qué hacer",
      "elementorSection": { ... objeto JSON de Elementor para esta sección ... }
    }
  ],
  "elementorJson": {
    "version": "0.4",
    "title": "Página importada desde Lovable",
    "type": "page",
    "content": [ ... todas las secciones ... ]
  }
}`

export async function analyzeHTML(html) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: [{
      parts: [{
        text: `Analiza este HTML de Lovable y genera el análisis y JSON de Elementor:\n\n${html}`
      }]
    }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Respuesta vacía de Gemini')

  return JSON.parse(text)
}
