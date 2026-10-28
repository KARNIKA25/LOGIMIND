import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Home } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '65vh', textAlign: 'center' }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.2)'
        }}
      >
        <AlertCircle size={40} style={{ color: 'var(--color-accent-1)' }} />
      </div>

      <h1 style={{ fontSize: '2.5rem', marginBottom: 8 }}>404 - Page Not Found</h1>
      <p style={{ color: 'var(--color-text-secondary)', maxWidth: 460, marginBottom: 32 }}>
        The logistics resource or route you requested could not be found. It may have been moved, archived, or does not exist.
      </p>

      <div style={{ display: 'flex', gap: 16 }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Go Back
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          <Home size={16} /> Return to Dashboard
        </button>
      </div>
    </div>
  )
}
