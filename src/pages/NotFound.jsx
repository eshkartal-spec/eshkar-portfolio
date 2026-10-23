import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="wrap" style={{ paddingTop: 'clamp(48px, 8vw, 120px)' }}>
      <p className="label">404</p>
      <h1 className="display" style={{ fontSize: 'clamp(56px, 12vw, 180px)', marginTop: 16 }}>
        Page not found
      </h1>
      <p style={{ marginTop: 32 }}>
        <Link to="/" className="pill">← Back home</Link>
      </p>
    </main>
  )
}
