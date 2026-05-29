const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const MODEL = 'llama-3.3-70b-versatile'

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
          { "id": "wid12345", "elType": "widget", "widgetType": "heading", "settings": { "title": "Texto", "header_size": "h1" } }
        ]
      }]
    }
  ]
}

Para containers flex: { "id": "...", "elType": "container", "settings": { "flex_direction": "row", "flex_gap": { "size": 20, "unit": "px" }, "flex_align_items": "stretch" }, "elements": [...] }

Responde ÚNICAMENTE con JSON válido en este formato exacto, sin markdown, sin bloques de código, sin explicaciones:
{
  "sections": [
    {
      "id": "section-1",
      "name": "Nombre descriptivo de la sección",
      "category": "native",
      "widgets": ["heading", "text-editor"],
      "notes": "Explicación breve de por qué esta categoría y qué hacer",
      "elementorSection": { }
    }
  ],
  "elementorJson": {
    "version": "0.4",
    "title": "Página importada desde Lovable",
    "type": "page",
    "content": []
  }
}`

async function callGroq(html) {
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
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analiza este HTML de Lovable y genera el análisis y JSON de Elementor:\n\n${html}` }
      ]
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

export async function analyzeHTML(html, { maxRetries = 3, baseDelay = 3000 } = {}) {
  let lastError
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callGroq(html)
    } catch (e) {
      lastError = e
      const retryable = e.status === 503 || e.status === 429
      if (!retryable || attempt === maxRetries) throw e
      await new Promise(r => setTimeout(r, baseDelay * attempt))
    }
  }
  throw lastError
}
