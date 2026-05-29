import SectionCard from './SectionCard'

const CATEGORY_ORDER = ['native', 'native_css', 'native_plugin', 'html']
const LABELS = {
  native: { emoji: '🟢', label: 'Nativo puro' },
  native_css: { emoji: '🟡', label: 'Nativo + CSS' },
  native_plugin: { emoji: '🟠', label: 'Nativo + Plugin' },
  html: { emoji: '🔴', label: 'HTML inevitable' },
}

function StatPill({ category, count }) {
  if (!count) return null
  const cfg = LABELS[category]
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      background: '#141414', border: '1px solid #222', borderRadius: 8, padding: '8px 14px',
    }}>
      <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
      <span style={{ fontSize: 20, fontWeight: 700, color: '#e8e8e8' }}>{count}</span>
      <span style={{ fontSize: 10, color: '#555' }}>{cfg.label}</span>
    </div>
  )
}

export default function ResultPanel({ sections, css, allDone, hasJson, onDownload, onSectionUpdate }) {
  if (!sections) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 16, color: '#333',
    }}>
      <div style={{ fontSize: 48 }}>🗺️</div>
      <p style={{ fontSize: 14 }}>El mapa de secciones aparecerá aquí</p>
    </div>
  )

  const done = sections.filter(s => s.status === 'done')
  const counts = {}
  done.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1 })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

      {/* Stats — only when at least some are done */}
      {done.length > 0 && (
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ fontSize: 12, color: '#555', marginBottom: 10 }}>
            {sections.length} secciones detectadas · {done.length} analizadas
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORY_ORDER.map(cat => <StatPill key={cat} category={cat} count={counts[cat]} />)}
          </div>
        </div>
      )}

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
        {sections.map((section, i) => (
          <SectionCard
            key={section.id}
            section={section}
            index={i}
            css={css}
            onUpdate={(updated) => onSectionUpdate(i, updated)}
          />
        ))}
      </div>

      {/* Download */}
      {allDone && hasJson && (
        <button
          onClick={onDownload}
          style={{
            padding: '13px', borderRadius: 8,
            border: '1px solid rgba(108,99,255,0.4)',
            background: 'rgba(108,99,255,0.15)',
            color: '#a5a0ff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          ⬇️ Descargar JSON Elementor
        </button>
      )}
    </div>
  )
}
