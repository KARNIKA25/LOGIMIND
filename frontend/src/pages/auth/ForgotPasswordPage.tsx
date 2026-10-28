import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Loader2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

type Step = 'email' | 'otp' | 'newpassword' | 'done'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email })
      if (res.data.otp_code) setDevOtp(res.data.otp_code)
      toast.success('Reset code sent to your email!')
      setStep('otp')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/verify-email-otp', { email, otp_code: otp, purpose: 'PASSWORD_RESET' })
      toast.success('Code verified! Set your new password.')
      setStep('newpassword')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: Reset Password ────────────────────────────────────────────────
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { email, otp_code: otp, new_password: newPassword })
      toast.success('Password updated successfully!')
      setStep('done')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left">
        <div style={{ maxWidth: 480, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
            <div style={{ width: 52, height: 52, background: 'var(--color-gradient-primary)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff', fontWeight: 900 }}>L</div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, background: 'var(--color-gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>LOGIMIND v2</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Enterprise Logistics Intelligence</div>
            </div>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.2, marginBottom: 16 }}>
            Forgot your<br />
            <span style={{ background: 'var(--color-gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>password?</span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 32 }}>
            No worries! We'll send a secure 6-digit verification code to your registered email address.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '📧', text: 'Enter your registered email' },
              { icon: '🔑', text: 'Enter the 6-digit OTP from your inbox' },
              { icon: '🔒', text: 'Set your new secure password' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-box animate-slide-up">
          {/* Step indicators */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 28, justifyContent: 'center' }}>
            {(['email', 'otp', 'newpassword', 'done'] as Step[]).map((s, i) => (
              <div key={s} style={{ width: 32, height: 4, borderRadius: 2, background: ['email', 'otp', 'newpassword', 'done'].indexOf(step) >= i ? 'var(--color-accent-1)' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
            ))}
          </div>

          <div className="auth-logo-area" style={{ marginBottom: 24 }}>
            <div className="auth-logo" style={{ fontSize: 28 }}>🔐</div>
            {step === 'email' && <><h2 className="auth-title">Reset Password</h2><p className="auth-subtitle">Enter your account email address</p></>}
            {step === 'otp' && <><h2 className="auth-title">Enter Reset Code</h2><p className="auth-subtitle">Check <strong style={{ color: 'var(--color-accent-1)' }}>{email}</strong> for the code</p></>}
            {step === 'newpassword' && <><h2 className="auth-title">New Password</h2><p className="auth-subtitle">Create a strong, unique password</p></>}
            {step === 'done' && <><h2 className="auth-title">Password Updated!</h2><p className="auth-subtitle">You can now sign in with your new password</p></>}
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, marginBottom: 20 }}>
              <AlertCircle size={16} color="var(--color-danger)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--color-danger)' }}>{error}</span>
            </div>
          )}

          {/* Email step */}
          {step === 'email' && (
            <form className="auth-form" onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label" htmlFor="fp-email">Registered Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input id="fp-email" className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required style={{ paddingLeft: 36 }} />
                </div>
              </div>
              <button type="submit" id="fp-send-otp" className="btn btn-primary btn-lg w-full" disabled={loading}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Reset Code'}
              </button>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                <Link to="/login" style={{ color: 'var(--color-accent-1)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ArrowLeft size={13} /> Back to Sign In
                </Link>
              </p>
            </form>
          )}

          {/* OTP step */}
          {step === 'otp' && (
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              {devOtp && (
                <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reset OTP (dev mode)</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.3rem' }}>{devOtp}</div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label" htmlFor="fp-otp">6-Digit Reset Code</label>
                <input id="fp-otp" className="form-input" type="text" inputMode="numeric" maxLength={6}
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  style={{ fontSize: '2rem', letterSpacing: '0.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                />
              </div>
              <button type="submit" id="fp-verify-otp" className="btn btn-primary btn-lg w-full" disabled={loading || otp.length !== 6}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <><ShieldCheck size={16} /> Verify Code</>}
              </button>
              <p style={{ textAlign: 'center', marginTop: 12, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                <button type="button" onClick={() => setStep('email')} style={{ background: 'none', border: 'none', color: 'var(--color-accent-1)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ArrowLeft size={13} /> Change email
                </button>
              </p>
            </form>
          )}

          {/* New password step */}
          {step === 'newpassword' && (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label" htmlFor="fp-newpass">New Password</label>
                <input id="fp-newpass" className="form-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="fp-confirm">Confirm New Password</label>
                <input id="fp-confirm" className="form-input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required />
              </div>
              <button type="submit" id="fp-reset" className="btn btn-primary btn-lg w-full" disabled={loading}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Updating...</> : '🔒 Update Password'}
              </button>
            </form>
          )}

          {/* Done */}
          {step === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>✅</div>
              <Link to="/login" className="btn btn-primary btn-lg w-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
                Sign In Now →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
