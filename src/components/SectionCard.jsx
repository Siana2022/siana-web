import { useState } from 'react'
import { modifySection } from '../lib/gemini'

const CATEGORY_CONFIG = {
  native: {
    emoji: '🟢', label: 'Nativo puro', color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)',
    hint: 'Se construye con widgets nativos de Elementor sin modificaciones.',
  },
  native_css: {
    emoji: '🟡', label: 'Nativo + CSS custom', color: '#eab308',
    bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.25)',
    hint: 'Widget nativo + CSS adicional en el panel "CSS personalizado" de Elementor.',
  },
  native_plugin: {
    emoji: '🟠', label: 'Nativo + Plugin', color: '#f97316',
    bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)',
    hint: 'Requiere instalar un plugin específico además del widget nativo.',
  },
  html: {
    emoji: '🔴', label: 'HTML inevitable', color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)',
    hint: 'Sin equivalente nativo razonable. Usar widget HTML/Code o shortcode.',
  },
}

function StatusBadge({ status }) {
  if (status === 'done') return null
  const map = {
    pending:   { label: '⏳ En cola',       color: '#555',    bg: '#1a1a1a' },
    analyzing: { label: '🔄 Analizando…',   color: '#a5a0ff', bg: 'rgba(108,99,255,0.1)' },
    error:     { label: '⚠️ Error',          color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  }
  const s = map[status] || map.pending
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color: s.color, background: s.bg,
      borderRadius: 20, padding: '2px 10px', whiteSpace: 'nowrap',
      animation: status === 'analyzing' ? 'pulse 1.5s ease-in-out infinite' : 'none',
    }}>{s.label}</span>
  )
}

function PreviewFrame({ sectionHtml, css }) {
  if (!sectionHtml) return (
    <div style={{
      background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 8,
      padding: 20, textAlign: 'center', color: '#444', fontSize: 12,
    }}>Sin preview disponible</div>
  )
  const srcDoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#070b18;color:#e9eef9;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
${css || ''}
/* hide sticky positioning inside iframe */
.site-header,.mockup-bar{position:relative!important;top:auto!important}
</style>
</head>
<body>${sectionHtml}</body>
</html>`

  return (
    <iframe
      srcDoc={srcDoc}
      sandbox="allow-same-origin"
      style={{ width: '100%', minHeight: 200, border: '1px solid #1e1e1e', borderRadius: 8, background: '#070b18', display: 'block' }}
      onLoad={e => {
        try {
          const h = e.target.contentDocument?.body?.scrollHeight
          if (h) e.target.style.height = Math.min(h + 16, 560) + 'px'
        } catch {}
      }}
    />
  )
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
    <div style={{ position: 'relative' }}>
      <button onClick={copy} style={{
        position: 'absolute', top: 8, right: 8, zIndex: 2,
        background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : '#333'}`,
        color: copied ? '#22c55e' : '#666',
        borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer',
      }}>{copied ? '✓ Copiado' : 'Copiar'}</button>
      <pre style={{
        background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 8,
        padding: '14px', fontSize: 11, color: '#7dd3fc',
        overflow: 'auto', maxHeight: 300, margin: 0,
        lineHeight: 1.5, fontFamily: 'ui-monospace, Consolas, monospace',
      }}>{str}</pre>
    </div>
  )
}

export default function SectionCard({ section, index, css, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState('preview')
  const [modText, setModText] = useState('')
  const [modifying, setModifying] = useState(false)
  const [modError, setModError] = useState(null)

  const cfg = CATEGORY_CONFIG[section.category] || null
  const isDone = section.status === 'done'

  async function handleModify() {
    if (!modText.trim()) return
    setModifying(true)
    setModError(null)
    try {
      const result = await modifySection(section, modText)
      onUpdate({
        ...section,
        elementorSection: result.elementorSection ?? section.elementorSection,
        notes: result.notes ?? section.notes,
      })
      setModText('')
    } catch (e) {
      setModError(e.message)
    } finally {
      setModifying(false)
    }
  }

  return (
    <div style={{
      background: '#141414',
      border: `1px solid ${expanded && cfg ? cfg.border : '#1e1e1e'}`,
      borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: '12px 14px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 8, cursor: 'pointer', userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 11, color: '#444', fontWeight: 600, flexShrink: 0 }}>#{index + 1}</span>
          <h3 style={{
            fontSize: 13, fontWeight: 600, color: '#e0e0e0', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{section.name}</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isDone && cfg ? (
            <span style={{
              fontSize: 11, fontWeight: 600, color: cfg.color,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap',
            }}>{cfg.emoji} {cfg.label}</span>
          ) : (
            <StatusBadge status={section.status} />
          )}
          <span style={{
            color: '#444', fontSize: 12, display: 'inline-block',
            transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
          }}>▾</span>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Category hint */}
          {isDone && cfg && (
            <div style={{
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              borderRadius: 6, padding: '8px 12px', fontSize: 12, color: cfg.color, lineHeight: 1.5,
            }}>
              <strong>{cfg.emoji} {cfg.label}:</strong> {cfg.hint}
            </div>
          )}

          {/* Widgets */}
          {isDone && section.widgets?.length > 0 && (
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
          {isDone && section.notes && (
            <p style={{
              fontSize: 12, color: '#888', lineHeight: 1.65, margin: 0,
              borderLeft: `2px solid ${cfg?.border || '#333'}`, paddingLeft: 10,
            }}>{section.notes}</p>
          )}

          {/* Error */}
          {section.status === 'error' && (
            <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>⚠️ {section.errorMsg || 'Error al analizar esta sección'}</p>
          )}

          {/* Tabs */}
          <div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
              {[
                { key: 'preview', label: '👁 Vista previa' },
                ...(isDone && section.elementorSection ? [{ key: 'json', label: '{} JSON' }] : []),
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  padding: '5px 14px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                  border: `1px solid ${tab === t.key ? 'rgba(108,99,255,0.5)' : '#2a2a2a'}`,
                  background: tab === t.key ? 'rgba(108,99,255,0.15)' : 'transparent',
                  color: tab === t.key ? '#a5a0ff' : '#555',
                }}>{t.label}</button>
              ))}
            </div>

            {tab === 'preview' && (
              <PreviewFrame sectionHtml={section.originalHtml} css={css} />
            )}
            {tab === 'json' && section.elementorSection && (
              <JsonViewer json={section.elementorSection} />
            )}
          </div>

          {/* Modify — only when done */}
          {isDone && (
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '12px' }}>
              <p style={{ fontSize: 11, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                ✏️ Solicitar modificación al JSON
              </p>
              <textarea
                value={modText}
                onChange={e => setModText(e.target.value)}
                placeholder="Ej: Añade un segundo botón, cambia el layout a 2 columnas, ajusta el padding..."
                rows={3}
                style={{
                  width: '100%', background: '#0d0d0d', border: '1px solid #222',
                  color: '#ccc', borderRadius: 6, padding: '10px 12px',
                  fontSize: 13, fontFamily: 'inherit', lineHeight: 1.5,
                  resize: 'vertical', outline: 'none',
                }}
              />
              {modError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>⚠️ {modError}</p>}
              <button
                onClick={handleModify}
                disabled={modifying || !modText.trim()}
                style={{
                  marginTop: 8, padding: '8px 16px', borderRadius: 6,
                  border: 'none', fontSize: 12, fontWeight: 600,
                  cursor: modifying || !modText.trim() ? 'not-allowed' : 'pointer',
                  background: modifying || !modText.trim() ? '#1a1a1a' : 'linear-gradient(135deg, #6c63ff, #a855f7)',
                  color: modifying || !modText.trim() ? '#444' : '#fff',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {modifying ? (
                  <><span style={{ width: 12, height: 12, border: '2px solid #444', borderTopColor: '#888', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Modificando…</>
                ) : '✨ Aplicar modificación'}
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>
    </div>
  )
}
