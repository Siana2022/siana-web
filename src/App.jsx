import { useState } from 'react'
import Header from './components/Header'
import ResultPanel from './components/ResultPanel'
import { analyzeHTML } from './lib/gemini'

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
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleAnalyze() {
    if (!html.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await analyzeHTML(html)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSectionUpdate(index, updatedSection) {
    setResult(prev => {
      const sections = [...prev.sections]
      sections[index] = updatedSection
      const content = sections.map(s => s.elementorSection).filter(Boolean)
      return {
        ...prev,
        sections,
        elementorJson: { ...prev.elementorJson, content },
      }
    })
  }

  function handleDownload() {
    if (!result?.elementorJson) return
    const blob = new Blob([JSON.stringify(result.elementorJson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'elementor-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

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
        {/* Left panel - Input */}
        <div style={{
          borderRight: '1px solid #1e1e1e',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          gap: 16,
        }}>
          <div>
            <h2 style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#888',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>HTML de Lovable</h2>
            <p style={{ fontSize: 12, color: '#444' }}>
              Pega el código HTML generado por Lovable
            </p>
          </div>

          <textarea
            value={html}
            onChange={e => setHtml(e.target.value)}
            placeholder={PLACEHOLDER}
            style={{
              flex: 1,
              background: '#111',
              border: '1px solid #222',
              borderRadius: 10,
              padding: '16px',
              color: '#ccc',
              fontSize: 13,
              fontFamily: 'ui-monospace, Consolas, monospace',
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#333'}
            onBlur={e => e.target.style.borderColor = '#222'}
          />

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#f87171',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading || !html.trim()}
            style={{
              padding: '14px 24px',
              borderRadius: 10,
              border: 'none',
              background: loading || !html.trim()
                ? '#1a1a1a'
                : 'linear-gradient(135deg, #6c63ff, #a855f7)',
              color: loading || !html.trim() ? '#444' : '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading || !html.trim() ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 16,
                  height: 16,
                  border: '2px solid #444',
                  borderTopColor: '#888',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Analizando con Gemini…
              </>
            ) : '✨ Analizar HTML'}
          </button>
        </div>

        {/* Right panel - Results */}
        <div style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#888',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>Mapa de Secciones</h2>
            <p style={{ fontSize: 12, color: '#444' }}>
              Categorización automática para Elementor Pro
            </p>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ResultPanel
              result={result}
              onDownload={handleDownload}
              isGenerating={false}
              onSectionUpdate={handleSectionUpdate}
            />
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          main {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  )
}
