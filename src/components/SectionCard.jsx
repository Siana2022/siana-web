import { useState } from 'react'
import { modifySection } from '../lib/gemini'

const CATEGORY_CONFIG = {
  native: {
    emoji: '🟢', label: 'Nativo puro', color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)',
    hint: 'Se construye directamente con widgets nativos de Elementor sin modificaciones.',
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
    <div style={{ position: 'relative' }}>
      <button onClick={copy} style={{
        position: 'absolute', top: 8, right: 8, zIndex: 2,
        background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : '#333'}`,
        color: copied ? '#22c55e' : '#888',
        borderRadius: 5, padding: '3px 8px', fontSize: 11,
        cursor: 'pointer', fontFamily: 'monospace',
      }}>{copied ? '✓ Copiado' : 'Copiar'}</button>
      <pre style={{
        background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 8,
        padding: '14px', fontSize: 11, color: '#7dd3fc',
        overflow: 'auto', maxHeight: 280, margin: 0,
        lineHeight: 1.5, fontFamily: 'ui-monospace, Consolas, monospace',
      }}>{str}</pre>
    </div>
  )
}

function PreviewFrame({ sectionHtml, css }) {
  if (!sectionHtml) return (
    <div style={{
      background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 8,
      padding: 24, textAlign: 'center', color: '#444', fontSize: 12,
    }}>Sin preview disponible — vuelve a analizar el HTML</div>
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
</style>
</head>
<body>${sectionHtml}</body>
</html>`

  return (
    <iframe
      srcDoc={srcDoc}
      sandbox="allow-same-origin"
      style={{
        width: '100%', minHeight: 300, border: '1px solid #1e1e1e',
        borderRadius: 8, background: '#070b18', display: 'block',
      }}
      onLoad={e => {
        try {
          const h = e.target.contentDocument?.body?.scrollHeight
          if (h) e.target.style.height = Math.min(h + 24, 600) + 'px'
        } catch {}
      }}
    />
  )
}

export default function SectionCard({ section: initialSection, index, originalCss, onUpdate }) {
  const [section, setSection] = useState(initialSection)
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState('preview') // 'preview' | 'json'
  const [modText, setModText] = useState('')
  const [modifying, setModifying] = useState(false)
  const [modError, setModError] = useState(null)

  const cfg = CATEGORY_CONFIG[section.category] || CATEGORY_CONFIG.native

  async function handleModify() {
    if (!modText.trim()) return
    setModifying(true)
    setModError(null)
    try {
      const result = await modifySection(section, modText)
      const updated = {
        ...section,
        elementorSection: result.elementorSection ?? section.elementorSection,
        previewHtml: result.previewHtml ?? section.previewHtml,
        notes: result.notes ?? section.notes,
      }
      setSection(updated)
      onUpdate?.(index, updated)
      setModText('')
      setTab('preview')
    } catch (e) {
      setModError(e.message)
    } finally {
      setModifying(false)
    }
  }

  return (
    <div style={{
      background: '#141414',
      border: `1px solid ${expanded ? cfg.border : '#1e1e1e'}`,
      borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: '13px 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 8, cursor: 'pointer', userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 11, color: '#444', fontWeight: 600, flexShrink: 0 }}>#{index + 1}</span>
          <h3 style={{
            fontSize: 13, fontWeight: 600, color: '#e0e0e0', margin: 0,
            lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{section.name}</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: cfg.color,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap',
          }}>{cfg.emoji} {cfg.label}</span>
          <span style={{
            color: '#444', fontSize: 12, display: 'inline-block',
            transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
          }}>▾</span>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Category hint */}
          <div style={{
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: 6, padding: '8px 12px', fontSize: 12, color: cfg.color, lineHeight: 1.5,
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
            <p style={{
              fontSize: 12, color: '#888', lineHeight: 1.65,
              borderLeft: `2px solid ${cfg.border}`, paddingLeft: 10, margin: 0,
            }}>{section.notes}</p>
          )}

          {/* Tabs: Preview / JSON */}
          <div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
              {['preview', 'json'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '5px 14px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                  border: `1px solid ${tab === t ? 'rgba(108,99,255,0.5)' : '#2a2a2a'}`,
                  background: tab === t ? 'rgba(108,99,255,0.15)' : 'transparent',
                  color: tab === t ? '#a5a0ff' : '#555',
                }}>
                  {t === 'preview' ? '👁 Vista previa' : '{} JSON'}
                </button>
              ))}
            </div>

            {tab === 'preview' && <PreviewFrame sectionHtml={section.originalHtml} css={originalCss} />}
            {tab === 'json' && section.elementorSection && <JsonViewer json={section.elementorSection} />}
          </div>

          {/* Modification request */}
          <div style={{
            background: '#111', border: '1px solid #1e1e1e',
            borderRadius: 8, padding: '14px',
          }}>
            <p style={{ fontSize: 11, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ✏️ Solicitar modificación
            </p>
            <textarea
              value={modText}
              onChange={e => setModText(e.target.value)}
              placeholder="Ej: Cambia el fondo a blanco, añade un segundo botón, convierte el grid en 2 columnas..."
              rows={3}
              style={{
                width: '100%', background: '#0d0d0d', border: '1px solid #252525',
                color: '#ccc', borderRadius: 6, padding: '10px 12px',
                fontSize: 13, fontFamily: 'inherit', lineHeight: 1.5,
                resize: 'vertical', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#333'}
              onBlur={e => e.target.style.borderColor = '#252525'}
            />
            {modError && (
              <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>⚠️ {modError}</p>
            )}
            <button
              onClick={handleModify}
              disabled={modifying || !modText.trim()}
              style={{
                marginTop: 8, padding: '8px 16px', borderRadius: 6,
                border: 'none', fontSize: 12, fontWeight: 600, cursor: modifying || !modText.trim() ? 'not-allowed' : 'pointer',
                background: modifying || !modText.trim() ? '#1a1a1a' : 'linear-gradient(135deg, #6c63ff, #a855f7)',
                color: modifying || !modText.trim() ? '#444' : '#fff',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {modifying ? (
                <>
                  <span style={{
                    width: 12, height: 12, border: '2px solid #444', borderTopColor: '#888',
                    borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite',
                  }} />
                  Modificando…
                </>
              ) : '✨ Aplicar modificación'}
            </button>
          </div>

        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
