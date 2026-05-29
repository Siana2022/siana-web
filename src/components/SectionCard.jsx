const CATEGORY_CONFIG = {
  native: {
    emoji: '🟢',
    label: 'Nativo puro',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.25)',
  },
  native_css: {
    emoji: '🟡',
    label: 'Nativo + CSS custom',
    color: '#eab308',
    bg: 'rgba(234,179,8,0.08)',
    border: 'rgba(234,179,8,0.25)',
  },
  native_plugin: {
    emoji: '🟠',
    label: 'Nativo + Plugin',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.25)',
  },
  html: {
    emoji: '🔴',
    label: 'HTML inevitable',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
  },
}

export default function SectionCard({ section, index }) {
  const cfg = CATEGORY_CONFIG[section.category] || CATEGORY_CONFIG.native

  return (
    <div style={{
      background: '#141414',
      border: `1px solid ${cfg.border}`,
      borderRadius: 10,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11,
            color: '#555',
            fontWeight: 600,
            minWidth: 20,
          }}>#{index + 1}</span>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#e8e8e8',
            margin: 0,
            lineHeight: 1.3,
          }}>{section.name}</h3>
        </div>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: cfg.color,
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          borderRadius: 20,
          padding: '2px 8px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>{cfg.emoji} {cfg.label}</span>
      </div>

      {section.widgets?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {section.widgets.map(w => (
            <span key={w} style={{
              fontSize: 11,
              color: '#888',
              background: '#1e1e1e',
              border: '1px solid #2a2a2a',
              borderRadius: 4,
              padding: '2px 7px',
            }}>{w}</span>
          ))}
        </div>
      )}

      {section.notes && (
        <p style={{
          fontSize: 12,
          color: '#666',
          lineHeight: 1.5,
          borderLeft: `2px solid ${cfg.border}`,
          paddingLeft: 8,
        }}>{section.notes}</p>
      )}
    </div>
  )
}
