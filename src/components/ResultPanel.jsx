import SectionCard from './SectionCard'

const CATEGORY_ORDER = ['native', 'native_css', 'native_plugin', 'html']
const LABELS = {
  native: { emoji: '🟢', label: 'Nativo puro' },
  native_css: { emoji: '🟡', label: 'Nativo + CSS' },
  native_plugin: { emoji: '🟠', label: 'Nativo + Plugin' },
  html: { emoji: '🔴', label: 'HTML inevitable' },
}

function StatPill({ category, count }) {
  const cfg = LABELS[category]
  if (!count) return null
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      background: '#141414',
      border: '1px solid #222',
      borderRadius: 8,
      padding: '8px 14px',
    }}>
      <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
      <span style={{ fontSize: 20, fontWeight: 700, color: '#e8e8e8' }}>{count}</span>
      <span style={{ fontSize: 10, color: '#555' }}>{cfg.label}</span>
    </div>
  )
}

export default function ResultPanel({ result, onDownload, onGenerateJson, isGenerating }) {
  if (!result) return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 16,
      color: '#333',
    }}>
      <div style={{ fontSize: 48 }}>🗺️</div>
      <p style={{ fontSize: 14 }}>El mapa de secciones aparecerá aquí</p>
    </div>
  )

  const counts = {}
  result.sections.forEach(s => {
    counts[s.category] = (counts[s.category] || 0) + 1
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      {/* Stats */}
      <div style={{
        background: '#111',
        border: '1px solid #1e1e1e',
        borderRadius: 10,
        padding: '16px',
      }}>
        <p style={{ fontSize: 12, color: '#555', marginBottom: 12 }}>
          {result.sections.length} secciones detectadas
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORY_ORDER.map(cat => (
            <StatPill key={cat} category={cat} count={counts[cat]} />
          ))}
        </div>
      </div>

      {/* Section cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
        {result.sections.map((section, i) => (
          <SectionCard key={section.id || i} section={section} index={i} />
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        {result.elementorJson ? (
          <button
            onClick={onDownload}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 8,
              border: '1px solid rgba(108,99,255,0.4)',
              background: 'rgba(108,99,255,0.15)',
              color: '#a5a0ff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            ⬇️ Descargar JSON Elementor
          </button>
        ) : (
          <button
            onClick={onGenerateJson}
            disabled={isGenerating}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 8,
              border: '1px solid #2a2a2a',
              background: isGenerating ? '#1a1a1a' : '#1e1e1e',
              color: isGenerating ? '#555' : '#ccc',
              fontSize: 14,
              fontWeight: 600,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
            }}
          >
            {isGenerating ? '⏳ Generando...' : '📦 Generar JSON Elementor'}
          </button>
        )}
      </div>
    </div>
  )
}
