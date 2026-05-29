import { useState } from 'react'

const CATEGORY_CONFIG = {
  native: {
    emoji: '🟢',
    label: 'Nativo puro',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.25)',
    hint: 'Se puede construir directamente con widgets nativos de Elementor sin modificaciones.',
  },
  native_css: {
    emoji: '🟡',
    label: 'Nativo + CSS custom',
    color: '#eab308',
    bg: 'rgba(234,179,8,0.08)',
    border: 'rgba(234,179,8,0.25)',
    hint: 'Widget nativo + CSS adicional en el panel "CSS personalizado" de Elementor o con un snippet.',
  },
  native_plugin: {
    emoji: '🟠',
    label: 'Nativo + Plugin',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.25)',
    hint: 'Requiere instalar un plugin específico además del widget nativo de Elementor.',
  },
  html: {
    emoji: '🔴',
    label: 'HTML inevitable',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    hint: 'Sin equivalente nativo razonable. Usar widget HTML/Code o shortcode personalizado.',
  },
}

function JsonViewer({ json }) {
  const [copied, setCopied] = useState(false)
  const str = JSON.stringify(json, null, 2)

  function copy() {
    navigator.clipboard.writeText(str)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'relative', marginTop: 4 }}>
      <button
        onClick={copy}
        style={{
          position: 'absolute', top: 8, right: 8, zIndex: 2,
          background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : '#333'}`,
          color: copied ? '#22c55e' : '#888',
          borderRadius: 5, padding: '3px 8px', fontSize: 11,
          cursor: 'pointer', fontFamily: 'monospace',
        }}
      >{copied ? '✓ Copiado' : 'Copiar'}</button>
      <pre style={{
        background: '#0d0d0d',
        border: '1px solid #1e1e1e',
        borderRadius: 8,
        padding: '14px 14px 14px 14px',
        fontSize: 11,
        color: '#7dd3fc',
        overflow: 'auto',
        maxHeight: 300,
        margin: 0,
        lineHeight: 1.5,
        fontFamily: 'ui-monospace, Consolas, monospace',
      }}>{str}</pre>
    </div>
  )
}

export default function SectionCard({ section, index }) {
  const [expanded, setExpanded] = useState(false)
  const [showJson, setShowJson] = useState(false)
  const cfg = CATEGORY_CONFIG[section.category] || CATEGORY_CONFIG.native

  return (
    <div style={{
      background: '#141414',
      border: `1px solid ${expanded ? cfg.border : '#1e1e1e'}`,
      borderRadius: 10,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Header row — always visible, clickable to expand */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 11, color: '#444', fontWeight: 600, flexShrink: 0 }}>#{index + 1}</span>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {section.name}
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: cfg.color,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap',
          }}>{cfg.emoji} {cfg.label}</span>
          <span style={{ color: '#444', fontSize: 12, transition: 'transform 0.2s', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Category hint */}
          <div style={{
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 12,
            color: cfg.color,
            lineHeight: 1.5,
          }}>
            <strong>{cfg.emoji} {cfg.label}:</strong> {cfg.hint}
          </div>

          {/* Widgets */}
          {section.widgets?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Widgets sugeridos</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {section.widgets.map(w => (
                  <span key={w} style={{
                    fontSize: 11, color: '#7dd3fc',
                    background: 'rgba(125,211,252,0.07)',
                    border: '1px solid rgba(125,211,252,0.15)',
                    borderRadius: 4, padding: '2px 8px',
                  }}>{w}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {section.notes && (
            <div>
              <p style={{ fontSize: 11, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notas de implementación</p>
              <p style={{
                fontSize: 12, color: '#aaa', lineHeight: 1.65,
                borderLeft: `2px solid ${cfg.border}`, paddingLeft: 10, margin: 0,
              }}>{section.notes}</p>
            </div>
          )}

          {/* JSON toggle */}
          {section.elementorSection && (
            <div>
              <button
                onClick={() => setShowJson(v => !v)}
                style={{
                  background: showJson ? 'rgba(108,99,255,0.15)' : 'transparent',
                  border: `1px solid ${showJson ? 'rgba(108,99,255,0.4)' : '#2a2a2a'}`,
                  color: showJson ? '#a5a0ff' : '#666',
                  borderRadius: 6, padding: '5px 12px',
                  fontSize: 11, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontFamily: 'monospace' }}>{'{}'}</span>
                {showJson ? 'Ocultar JSON Elementor' : 'Ver JSON de esta sección'}
              </button>
              {showJson && <JsonViewer json={section.elementorSection} />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
