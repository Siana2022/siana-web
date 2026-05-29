// Extracts sections from raw HTML client-side using a DOM parser
export function extractSections(rawHtml) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(rawHtml, 'text/html')

  // Extract all CSS from <style> tags
  const styleBlocks = [...doc.querySelectorAll('style')].map(s => s.textContent).join('\n')

  // Candidate selectors for "sections" in order of priority
  const sectionEls = [
    ...doc.querySelectorAll('section'),
    ...doc.querySelectorAll('header:not(.site-header)'),
    ...doc.querySelectorAll('.site-header'),
    ...doc.querySelectorAll('footer'),
    ...doc.querySelectorAll('.trust-bar'),
    ...doc.querySelectorAll('.hero'),
    ...doc.querySelectorAll('.cta-strip'),
    ...doc.querySelectorAll('.how'),
  ]

  // Deduplicate (some elements may be caught by multiple selectors)
  const seen = new Set()
  const unique = []
  for (const el of sectionEls) {
    if (!seen.has(el)) {
      seen.add(el)
      unique.push(el)
    }
  }

  // If no semantic sections found, fall back to direct children of body
  const candidates = unique.length > 0
    ? unique
    : [...doc.body.children].filter(el => {
        const tag = el.tagName.toLowerCase()
        return ['section', 'header', 'footer', 'div', 'main', 'article', 'nav'].includes(tag)
      })

  // Filter out tiny/empty elements
  const sections = candidates
    .filter(el => el.innerHTML.trim().length > 50)
    .map((el, i) => {
      // Try to derive a readable name from the element
      const h = el.querySelector('h1,h2,h3,h4')?.textContent?.trim()
      const cls = el.className?.split(' ').filter(Boolean).join(' ')
      const id = el.id
      const tag = el.tagName.toLowerCase()
      const name = h
        || (id ? `#${id}` : null)
        || (cls ? cls.split(' ')[0] : null)
        || `${tag} ${i + 1}`

      return {
        id: `section-${i + 1}`,
        name: name.slice(0, 60),
        originalHtml: el.outerHTML,
      }
    })

  return { sections, css: styleBlocks }
}
