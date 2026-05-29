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

const SECTION_PROMPT = `Eres un experto en Elementor Pro. Analiza este bloque HTML y devuelve ÚNICAMENTE JSON válido sin markdown:

{
  "name": "Nombre descriptivo de la sección (máx 50 chars)",
  "category": "native" | "native_css" | "native_plugin" | "html",
  "widgets": ["widget1", "widget2"],
  "notes": "Instrucciones concretas de implementación en Elementor (2-3 frases)",
  "elementorSection": {
    "id": "sec-XXXX",
    "elType": "section",
    "settings": { "background_color": "#070b18", "padding": { "top": "80", "bottom": "80", "unit": "px" } },
    "elements": [{
      "id": "col-XXXX",
      "elType": "column",
      "settings": { "_column_size": 100 },
      "elements": [ ...widgets nativos aquí... ]
    }]
  }
}

Reglas de categorización:
- "native": heading, text-editor, button, image, icon, divider, spacer, icon-box, call-to-action
- "native_css": widget nativo que necesita CSS extra para replicar el diseño exacto
- "native_plugin": filtros, mapas, sliders avanzados, formularios complejos
- "html": grids CSS asimétricos, SVG animados, canvas, clip-path complejo

Widgets disponibles: heading, text-editor, button, image, icon, divider, spacer, video, testimonial, tabs, accordion, toggle, counter, progress-bar, star-rating, image-box, icon-box, call-to-action, flip-box, price-table, nav-menu, search-form, slides, carousel, loop-grid, posts, gallery, form, login, container

Para containers flex usa: { "elType": "container", "settings": { "flex_direction": "row", "flex_gap": { "size": 20, "unit": "px" } }, "elements": [...] }

Genera IDs únicos de 8 chars alfanuméricos para cada elemento.`

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
