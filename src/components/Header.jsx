export default function Header() {
  return (
    <header style={{
      borderBottom: '1px solid #1e1e1e',
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: '#0a0a0a',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
          color: '#fff',
        }}>S</div>
        <span style={{
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '0.05em',
          background: 'linear-gradient(135deg, #e0e0e0, #a0a0a0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>SIANA WEB</span>
      </div>
      <span style={{
        marginLeft: 8,
        fontSize: 12,
        color: '#555',
        borderLeft: '1px solid #2a2a2a',
        paddingLeft: 12,
      }}>Lovable → Elementor Pro</span>
    </header>
  )
}
