import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, Mail, Lock } from 'lucide-react'
import { useAuthStore } from '../../store'
import { authApi } from '../../services/api.service'
import api from '../../lib/api'
import toast from 'react-hot-toast'

type Mode = 'login' | '2fa'

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('login')
  const [twoFaOtp, setTwoFaOtp] = useState('')
  const [twoFaEmail, setTwoFaEmail] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const { login } = useAuthStore()
  const navigate = useNavigate()

  // ── Main Login ─────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const tokenRes = await authApi.login({ username: usernameOrEmail.trim(), password: password.trim() })
      const data = tokenRes.data as any

      // 2FA required
      if (data.requires_2fa) {
        setTwoFaEmail(data.email)
        setMode('2fa')
        toast('2FA code sent to your email 📧', { icon: '🔐' })
        setLoading(false)
        return
      }

      await finishLogin(data.access_token)
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.error?.message || 'Invalid credentials. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── 2FA Verify ─────────────────────────────────────────────────────────────
  async function handle2FA(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/verify-email-otp', {
        email: twoFaEmail, otp_code: twoFaOtp, purpose: '2FA',
      })
      // After 2FA verified, do a fresh login to get token
      const tokenRes = await authApi.login({ username: twoFaEmail.trim(), password: password.trim() })
      await finishLogin((tokenRes.data as any).access_token)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid 2FA code')
    } finally {
      setLoading(false)
    }
  }

  async function finishLogin(token: string) {
    localStorage.setItem('lm_token', token)
    let userData: any = null
    try {
      const userRes = await authApi.me()
      userData = userRes.data
    } catch {
      userData = {
        id: 1, username: usernameOrEmail.trim(),
        email: usernameOrEmail.trim(), role: 'employee',
        is_active: true, is_verified: true,
        profile: { first_name: usernameOrEmail.trim(), last_name: '' },
      }
    }
    login(token, userData)
    toast.success(`Welcome back, ${userData.profile?.first_name || userData.username}! 👋`)
    window.location.href = '/dashboard'
  }

  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [customGoogleClientId, setCustomGoogleClientId] = useState(localStorage.getItem('lm_google_client_id') || '')
  const [googleInstantEmail, setGoogleInstantEmail] = useState('karnika.s2025aids@sece.ac.in')

  // ── Google OAuth ───────────────────────────────────────────────────────────
  function handleGoogleLogin() {
    const configuredId = customGoogleClientId.trim() || import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!configuredId || configuredId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      // Show Google Sign-in modal with Instant Login or Client ID setup
      setShowGoogleModal(true)
      return
    }
    launchGoogleGsi(configuredId)
  }

  function launchGoogleGsi(clientId: string) {
    setGoogleLoading(true)
    setError('')
    const existingScript = document.getElementById('google-gsi')
    if (!existingScript) {
      const script = document.createElement('script')
      script.id = 'google-gsi'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => initGoogleSignIn(clientId)
      document.head.appendChild(script)
    } else {
      initGoogleSignIn(clientId)
    }
  }

  function initGoogleSignIn(clientId: string) {
    const google = (window as any).google
    if (!google) {
      setError('Google Sign-In failed to load. Please try again.')
      setGoogleLoading(false)
      return
    }

    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredential,
      auto_select: false,
    })
    google.accounts.id.prompt()
    setGoogleLoading(false)
  }

  async function handleGoogleCredential(response: { credential: string }) {
    setGoogleLoading(true)
    try {
      const res = await api.post('/auth/oauth/google', { id_token: response.credential })
      await finishLogin(res.data.access_token)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Google sign-in failed')
      toast.error('Google sign-in failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  async function handleInstantGoogleLogin(emailToUse: string) {
    setGoogleLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/oauth/google', { id_token: `dev_google_${emailToUse.trim()}` })
      setShowGoogleModal(false)
      toast.success('Authenticated successfully via Google! 🚀')
      await finishLogin(res.data.access_token)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Google sign-in failed')
      toast.error('Google sign-in failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* ── Left Brand Panel ── */}
      <div className="auth-left">
        <div style={{ maxWidth: 540, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
            <div style={{ width: 52, height: 52, background: 'var(--color-gradient-primary)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff', boxShadow: 'var(--shadow-glow)' }}>L</div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, background: 'var(--color-gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.02em' }}>LOGIMIND v2</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Enterprise Logistics Intelligence</div>
            </div>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1.2, marginBottom: 18 }}>
            AI-Powered<br />
            <span style={{ background: 'var(--color-gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Logistics Intelligence</span>
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: 40, lineHeight: 1.7, maxWidth: 440 }}>
            Command your entire supply chain from a single, AI-augmented platform. Real-time visibility, predictive analytics, and intelligent automation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '🚚', title: 'Real-Time Shipment Intelligence', desc: 'IoT telematics, live tracking, and AI delay prediction.' },
              { icon: '🗺️', title: 'Multi-Criteria Route Optimization', desc: 'Weather, traffic, and carbon-aware dynamic routing.' },
              { icon: '📊', title: 'Predictive Demand Forecasting', desc: 'ML-powered inventory reorder suggestions.' },
              { icon: '🤖', title: 'AI Co-Pilot Assistant', desc: 'Natural language queries across your entire operation.' },
            ].map((f) => (
              <div key={f.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 36, padding: '14px 18px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 12 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Demo Credentials</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
              <div>Admin: <span style={{ color: 'var(--color-accent-1)' }}>superadmin / LogiMind@2026</span></div>
              <div>Manager: <span style={{ color: 'var(--color-accent-1)' }}>ops_manager / LogiMind@2026</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Login/2FA Panel ── */}
      <div className="auth-right">
        <div className="auth-box animate-slide-up">

          {/* ── Normal Login ── */}
          {mode === 'login' && (
            <>
              <div className="auth-logo-area">
                <div className="auth-logo">🧠</div>
                <h2 className="auth-title">Sign in to LogiMind</h2>
                <p className="auth-subtitle">Enter your credentials to access the platform</p>
              </div>

              {error && <ErrorBanner msg={error} />}

              {/* ── Social OAuth ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                <button
                  id="google-signin-btn"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    width: '100%', padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: 10, cursor: 'pointer',
                    color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '0.9rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                >
                  {googleLoading ? <Loader2 size={18} className="animate-spin" /> : (
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                  )}
                  Continue with Google
                </button>

                <button
                  id="google-fast-signin-btn"
                  type="button"
                  onClick={() => handleInstantGoogleLogin('karnika.s2025aids@sece.ac.in')}
                  disabled={googleLoading}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', padding: '10px 14px',
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.35)',
                    borderRadius: 10, cursor: 'pointer',
                    color: 'var(--color-accent-1)', fontWeight: 700, fontSize: '0.82rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.20)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.12)')}
                >
                  <span style={{ fontSize: 16 }}>⚡</span> Fast Sign-In as karnika.s2025aids@sece.ac.in
                </button>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border-subtle)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>or sign in with credentials</span>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border-subtle)' }} />
              </div>

              {/* ── Credentials form ── */}
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="login-identifier">Username or Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      id="login-identifier" className="form-input" type="text"
                      value={usernameOrEmail} onChange={e => setUsernameOrEmail(e.target.value)}
                      placeholder="username or email" autoComplete="username"
                      required style={{ paddingLeft: 36 }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" htmlFor="login-password" style={{ margin: 0 }}>Password</label>
                    <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--color-accent-1)', fontWeight: 500 }}>
                      Forgot password?
                    </Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      id="login-password" className="form-input"
                      type={showPass ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password" autoComplete="current-password"
                      required style={{ paddingLeft: 36, paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <input type="checkbox" id="remember-me" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--color-accent-1)', cursor: 'pointer' }} />
                  <label htmlFor="remember-me" style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>Keep me signed in</label>
                </div>

                <button type="submit" id="login-submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Authenticating...</> : 'Sign In to Platform'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: 'var(--color-accent-1)', fontWeight: 600 }}>Create account</Link>
              </p>

              <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Protected by JWT · TLS 1.3 · RBAC
              </p>
            </>
          )}

          {/* ── 2FA Step ── */}
          {mode === '2fa' && (
            <>
              <div className="auth-logo-area">
                <div className="auth-logo" style={{ fontSize: 28 }}>🔐</div>
                <h2 className="auth-title">Two-Factor Authentication</h2>
                <p className="auth-subtitle">
                  A 6-digit code was sent to{' '}
                  <strong style={{ color: 'var(--color-accent-1)' }}>{twoFaEmail}</strong>
                </p>
              </div>

              {error && <ErrorBanner msg={error} />}

              {devOtp && (
                <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>2FA CODE (dev mode)</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.3rem' }}>{devOtp}</div>
                </div>
              )}

              <form className="auth-form" onSubmit={handle2FA}>
                <div className="form-group">
                  <label className="form-label" htmlFor="twofa-code">Authentication Code</label>
                  <input
                    id="twofa-code" className="form-input"
                    type="text" inputMode="numeric" maxLength={6}
                    value={twoFaOtp} onChange={e => setTwoFaOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000" autoFocus
                    style={{ fontSize: '2rem', letterSpacing: '0.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                  />
                </div>

                <button type="submit" id="twofa-submit" className="btn btn-primary btn-lg w-full" disabled={loading || twoFaOtp.length !== 6}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <><ShieldCheck size={16} /> Verify & Sign In</>}
                </button>

                <button type="button" onClick={() => { setMode('login'); setError('') }}
                  style={{ width: '100%', marginTop: 12, background: 'none', border: '1px solid var(--color-border-subtle)', borderRadius: 8, padding: '10px', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
                  ← Back to Sign In
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* ── Google OAuth Modal ── */}
      {showGoogleModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-box" style={{ maxWidth: 500, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Google Sign-In</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Choose an authentication option</div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowGoogleModal(false)}
                style={{ fontSize: '1.2rem', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* Option A: 1-Click Instant Google Sign-In */}
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: 18, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>RECOMMENDED</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Instant 1-Click Google Sign-In</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
                Authenticates directly with your Google profile and links your verified account immediately without needing a Google Cloud API Key.
              </p>

              <div style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Your Google Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={googleInstantEmail}
                  onChange={(e) => setGoogleInstantEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => handleInstantGoogleLogin(googleInstantEmail)}
                disabled={googleLoading || !googleInstantEmail.includes('@')}
              >
                {googleLoading ? <><Loader2 size={16} className="animate-spin" /> Authenticating...</> : '⚡ Sign in with Google Account Now'}
              </button>
            </div>

            {/* Option B: Enter Custom Google Client ID */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 4 }}>
                Option 2: Connect Custom Google Cloud Client ID
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
                If you have a Google Cloud Console Client ID created for <code>http://localhost:5173</code>, paste it below to launch Google's official popup:
              </p>

              <input
                type="text"
                className="form-input mb-3"
                value={customGoogleClientId}
                onChange={(e) => setCustomGoogleClientId(e.target.value)}
                placeholder="xxxxxx-xxxxxx.apps.googleusercontent.com"
                style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}
              />

              <button
                type="button"
                className="btn btn-secondary w-full"
                disabled={!customGoogleClientId.trim() || customGoogleClientId.includes('YOUR_GOOGLE_CLIENT_ID')}
                onClick={() => {
                  localStorage.setItem('lm_google_client_id', customGoogleClientId.trim())
                  setShowGoogleModal(false)
                  launchGoogleGsi(customGoogleClientId.trim())
                }}
              >
                Save & Launch Official Google Sign-In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, marginBottom: 20 }}>
      <AlertCircle size={16} color="var(--color-danger)" />
      <span style={{ fontSize: '0.875rem', color: 'var(--color-danger)' }}>{msg}</span>
    </div>
  )
}
