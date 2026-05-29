import { useState, useCallback } from 'react'
import Header from './components/Header'
import ResultPanel from './components/ResultPanel'
import { extractSections } from './lib/parser'
import { analyzeSection } from './lib/gemini'

const PLACEHOLDER = `<!-- Pega aquí tu HTML de Lovable -->
<section class="hero">
  <div class="container">
    <h1>Tu título aquí</h1>
    <p>Descripción del hero section</p>
    <button>CTA Button</button>
  </div>
</section>

<section class="features">
  ...
</section>`

export default function App() {
  const [html, setHtml] = useState('')
  const [css, setCss] = useState('')
  const [sections, setSections] = useState(null)   // array of section objects
  const [analyzing, setAnalyzing] = useState(false) // AI running
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState(null)

  async function handleAnalyze() {
    if (!html.trim()) return
    setError(null)
    setAnalyzing(true)

    // 1. Parse sections client-side — instant
    const { sections: parsed, css: extractedCss } = extractSections(html)
    setCss(extractedCss)

    // Initialise with parsed data (preview works immediately)
    const initial = parsed.map(s => ({ ...s, status: 'pending' }))
    setSections(initial)
    setProgress({ done: 0, total: parsed.length })

    // 2. Analyse each section with Groq one by one
    for (let i = 0; i < parsed.length; i++) {
      setSections(prev => prev.map((s, idx) =>
        idx === i ? { ...s, status: 'analyzing' } : s
      ))
      try {
        const result = await analyzeSection(parsed[i].originalHtml)
        setSections(prev => prev.map((s, idx) =>
          idx === i ? {
            ...s,
            status: 'done',
            name: result.name || s.name,
            category: result.category || 'native',
            widgets: result.widgets || [],
            notes: result.notes || '',
            elementorSection: result.elementorSection || null,
          } : s
        ))
      } catch (e) {
        setSections(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'error', errorMsg: e.message } : s
        ))
      }
      setProgress({ done: i + 1, total: parsed.length })
    }

    setAnalyzing(false)
  }

  function handleSectionUpdate(index, updatedSection) {
    setSections(prev => prev.map((s, i) => i === index ? { ...s, ...updatedSection } : s))
  }

  function handleDownload() {
    const content = sections
      .filter(s => s.elementorSection)
      .map(s => s.elementorSection)

    const json = { content }

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'elementor-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const allDone = sections && !analyzing && sections.every(s => s.status === 'done' || s.status === 'error')
  const hasJson = sections?.some(s => s.elementorSection)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 0,
        height: 'calc(100vh - 65px)',
      }}>
        {/* LEFT — Input */}
        <div style={{
          borderRight: '1px solid #1e1e1e',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          gap: 16,
        }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              HTML de Lovable
            </h2>
            <p style={{ fontSize: 12, color: '#444' }}>Pega el código HTML generado por Lovable</p>
          </div>

          <textarea
            value={html}
            onChange={e => setHtml(e.target.value)}
            placeholder={PLACEHOLDER}
            style={{
              flex: 1, background: '#111', border: '1px solid #222', borderRadius: 10,
              padding: '16px', color: '#ccc', fontSize: 13,
              fontFamily: 'ui-monospace, Consolas, monospace',
              lineHeight: 1.6, resize: 'none', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = '#333'}
            onBlur={e => e.target.style.borderColor = '#222'}
          />

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171',
            }}>⚠️ {error}</div>
          )}

          {/* Progress bar */}
          {analyzing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
                <span>Analizando secciones con IA…</span>
                <span style={{ color: '#888' }}>{progress.done}/{progress.total}</span>
              </div>
              <div style={{ height: 4, background: '#1a1a1a', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  background: 'linear-gradient(90deg, #6c63ff, #a855f7)',
                  width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !html.trim()}
            style={{
              padding: '14px 24px', borderRadius: 10, border: 'none',
              background: analyzing || !html.trim()
                ? '#1a1a1a'
                : 'linear-gradient(135deg, #6c63ff, #a855f7)',
              color: analyzing || !html.trim() ? '#444' : '#fff',
              fontSize: 15, fontWeight: 600,
              cursor: analyzing || !html.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {analyzing ? (
              <>
                <span style={{
                  width: 16, height: 16, border: '2px solid #444', borderTopColor: '#888',
                  borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite',
                }} />
                Analizando… ({progress.done}/{progress.total})
              </>
            ) : '✨ Analizar HTML'}
          </button>
        </div>

        {/* RIGHT — Results */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Mapa de Secciones
            </h2>
            <p style={{ fontSize: 12, color: '#444' }}>Categorización automática para Elementor Pro</p>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ResultPanel
              sections={sections}
              css={css}
              allDone={allDone}
              hasJson={hasJson}
              onDownload={handleDownload}
              onSectionUpdate={handleSectionUpdate}
            />
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          main { grid-template-columns: 1fr !important; height: auto !important; }
        }
      `}</style>
    </div>
  )
}
