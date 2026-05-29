const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const MODEL = 'llama-3.3-70b-versatile'

async function groqCall(messages) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages
    })
  })
  if (!res.ok) {
    const err = await res.text()
    const error = new Error(`Groq API error ${res.status}: ${err}`)
    error.status = res.status
    throw error
  }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Respuesta vacía de Groq')
  return JSON.parse(text)
}

async function withRetry(fn, maxRetries = 3) {
  let lastError
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try { return await fn() } catch (e) {
      lastError = e
      if ((e.status !== 503 && e.status !== 429) || attempt === maxRetries) throw e
      await new Promise(r => setTimeout(r, 4000 * attempt))
    }
  }
  throw lastError
}

const SECTION_PROMPT = `Eres un experto en Elementor Pro. Analiza este bloque HTML y devuelve ÚNICAMENTE JSON válido sin markdown.

FORMATO EXACTO REQUERIDO (sigue esta estructura sin cambiarla):
{
  "name": "Nombre descriptivo de la sección (máx 50 chars)",
  "category": "native",
  "widgets": ["heading", "text-editor"],
  "notes": "Instrucciones concretas de implementación en Elementor (2-3 frases)",
  "elementorSection": {
    "id": "a1b2c3d",
    "elType": "section",
    "isInner": false,
    "settings": {
      "background_background": "classic",
      "background_color": "#070b18",
      "padding": {"unit":"px","top":"80","right":"28","bottom":"80","left":"28","isLinked":false}
    },
    "elements": [
      {
        "id": "e4f5a6b",
        "elType": "column",
        "isInner": false,
        "settings": {"_column_size": 100, "width": {"unit":"%","size":100}},
        "elements": [
          {
            "id": "c7d8e9f",
            "elType": "widget",
            "widgetType": "heading",
            "isInner": false,
            "elements": [],
            "settings": {
              "title": "Texto del heading aquí",
              "header_size": "h1",
              "title_color": "#e9eef9",
              "typography_typography": "custom",
              "typography_font_family": "Fraunces",
              "typography_font_size": {"unit":"px","size":60},
              "typography_font_weight": "700"
            }
          },
          {
            "id": "a1b2c3e",
            "elType": "widget",
            "widgetType": "text-editor",
            "isInner": false,
            "elements": [],
            "settings": {
              "editor": "<p>Texto descriptivo aquí</p>",
              "text_color": "#a9b3cf",
              "typography_typography": "custom",
              "typography_font_family": "Inter",
              "typography_font_size": {"unit":"px","size":18}
            }
          },
          {
            "id": "f1e2d3c",
            "elType": "widget",
            "widgetType": "button",
            "isInner": false,
            "elements": [],
            "settings": {
              "text": "Texto botón",
              "button_type": "info",
              "background_color": "#6c63ff",
              "button_text_color": "#ffffff",
              "border_radius": {"unit":"px","top":"8","right":"8","bottom":"8","left":"8","isLinked":true}
            }
          }
        ]
      }
    ]
  }
}

REGLAS CRÍTICAS:
1. Todos los IDs deben ser hex de 7 chars ÚNICOS (ej: "a1b2c3d", "e4f5a6b"). NUNCA repitas un ID.
2. Todos los widgets DEBEN tener: "elType":"widget", "widgetType":"nombre", "isInner":false, "elements":[]
3. Sections y columns DEBEN tener "isInner":false pero NO "widgetType"
4. Heading usa "title" (no "text"). Text-editor usa "editor" con HTML (no "text").
5. Colores oscuros para el fondo: #070b18, #080d1f, #0d1224 según el contexto
6. Colores de texto claros: #e9eef9 para títulos, #a9b3cf para párrafos, #6cc4ff para acentos

Categorías:
- "native": heading, text-editor, button, image, icon, divider, spacer, icon-box, call-to-action
- "native_css": widget nativo que necesita CSS extra
- "native_plugin": sliders avanzados, formularios complejos, mapas
- "html": grids CSS asimétricos, SVG animados, canvas

Widgets disponibles: heading, text-editor, button, image, icon, divider, spacer, video, testimonial, tabs, accordion, toggle, counter, progress-bar, star-rating, image-box, icon-box, call-to-action, flip-box, price-table, nav-menu, slides, carousel, form`

export async function analyzeSection(sectionHtml) {
  // Strip inline styles to save tokens, keep structure and text
  const stripped = sectionHtml
    .replace(/\s*style="[^"]*"/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\s+/g, ' ')
    .slice(0, 6000)

  return withRetry(() => groqCall([
    { role: 'system', content: SECTION_PROMPT },
    { role: 'user', content: `Analiza esta sección HTML:\n\n${stripped}` }
  ]))
}

const MODIFY_PROMPT = `Eres un experto en Elementor Pro. Modifica la sección indicada según las instrucciones del usuario.
Devuelve ÚNICAMENTE JSON válido sin markdown:
{
  "elementorSection": { ...JSON actualizado... },
  "notes": "...notas actualizadas..."
}`

export async function modifySection(section, modification) {
  return withRetry(() => groqCall([
    { role: 'system', content: MODIFY_PROMPT },
    {
      role: 'user',
      content: `Sección: ${section.name}
JSON actual:
${JSON.stringify(section.elementorSection, null, 2)}

Modificación solicitada: ${modification}`
    }
  ]))
}
