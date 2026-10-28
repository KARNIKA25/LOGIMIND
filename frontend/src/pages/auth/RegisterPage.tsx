import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  Mail, Lock, User, Phone, ChevronRight, ShieldCheck, ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

type Step = 'info' | 'email-otp' | 'phone-otp' | 'done'

const ROLES = [
  { value: 'EMPLOYEE', label: 'Employee', icon: '👤' },
  { value: 'MANAGER', label: 'Manager', icon: '📋' },
  { value: 'WAREHOUSE_MANAGER', label: 'Warehouse Manager', icon: '🏭' },
  { value: 'DRIVER', label: 'Driver', icon: '🚛' },
  { value: 'SUPPLIER', label: 'Supplier', icon: '📦' },
]

export default function RegisterPage() {
  const navigate = useNavigate()

  // Step
  const [step, setStep] = useState<Step>('info')
  const [userId, setUserId] = useState<number | null>(null)

  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('EMPLOYEE')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // OTP
  const [emailOtp, setEmailOtp] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [devEmailOtp, setDevEmailOtp] = useState('')
  const [devPhoneOtp, setDevPhoneOtp] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Password strength
  const passwordStrength = (() => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  })()
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['', '#ef4444', '#f59e0b', '#10b981', '#10b981']

  // ── Step 1: Register ──────────────────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        email, username, password,
        first_name: firstName, last_name: lastName,
        phone: phone || undefined, role,
      })
      setUserId(res.data.id)

      // Also request email OTP (it auto-sends on register, but confirm)
      const otpRes = await api.post('/auth/send-email-otp', { email, purpose: 'EMAIL_VERIFY' })
      if (otpRes.data.otp_code) setDevEmailOtp(otpRes.data.otp_code)

      toast.success('Account created! Please verify your email.')
      setStep('email-otp')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Verify Email OTP ──────────────────────────────────────────────
  async function handleEmailOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/verify-email-otp', { email, otp_code: emailOtp, purpose: 'EMAIL_VERIFY' })
      toast.success('Email verified! ✅')

      if (phone) {
        // Send phone OTP
        const smsRes = await api.post('/auth/send-phone-otp', { phone, purpose: 'PHONE_VERIFY' })
        if (smsRes.data.otp_code) setDevPhoneOtp(smsRes.data.otp_code)
        setStep('phone-otp')
      } else {
        setStep('done')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function resendEmailOtp() {
    try {
      const res = await api.post('/auth/send-email-otp', { email, purpose: 'EMAIL_VERIFY' })
      if (res.data.otp_code) setDevEmailOtp(res.data.otp_code)
      toast.success('New OTP sent to your email!')
    } catch { toast.error('Failed to resend OTP') }
  }

  // ── Step 3: Verify Phone OTP ──────────────────────────────────────────────
  async function handlePhoneOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/verify-phone-otp', { phone, otp_code: phoneOtp, user_id: userId })
      toast.success('Phone verified! ✅')
      setStep('done')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function resendPhoneOtp() {
    try {
      const res = await api.post('/auth/send-phone-otp', { phone, purpose: 'PHONE_VERIFY' })
      if (res.data.otp_code) setDevPhoneOtp(res.data.otp_code)
      toast.success('New OTP sent to your phone!')
    } catch { toast.error('Failed to resend OTP') }
  }

  // ── Step 4: Skip phone + go to login ─────────────────────────────────────
  function skipPhone() { setStep('done') }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="auth-page">
        <LeftPanel />
        <div className="auth-right">
          <div className="auth-box animate-slide-up" style={{ textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>✅</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 12 }}>You're all set!</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
              Your LOGIMIND v2 account has been successfully created and verified. Welcome aboard!
            </p>
            <button className="btn btn-primary btn-lg w-full" onClick={() => navigate('/login')}>
              Sign In to Your Account →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <LeftPanel />
      <div className="auth-right">
        <div className="auth-box animate-slide-up">
          {/* Progress Steps */}
          <StepIndicator current={step} hasPhone={!!phone} />

          {/* Header */}
          <div className="auth-logo-area" style={{ marginBottom: 24 }}>
            <div className="auth-logo">🧠</div>
            {step === 'info' && (
              <>
                <h2 className="auth-title">Create your account</h2>
                <p className="auth-subtitle">Join LOGIMIND v2 — take control of your logistics</p>
              </>
            )}
            {step === 'email-otp' && (
              <>
                <h2 className="auth-title">Verify your email</h2>
                <p className="auth-subtitle">We sent a 6-digit code to <strong style={{ color: 'var(--color-accent-1)' }}>{email}</strong></p>
              </>
            )}
            {step === 'phone-otp' && (
              <>
                <h2 className="auth-title">Verify your phone</h2>
                <p className="auth-subtitle">We sent a 6-digit code via SMS to <strong style={{ color: 'var(--color-accent-1)' }}>{phone}</strong></p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, marginBottom: 20 }}>
              <AlertCircle size={16} color="var(--color-danger)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--color-danger)' }}>{error}</span>
            </div>
          )}

          {/* ── Step 1: Registration Form ── */}
          {step === 'info' && (
            <form className="auth-form" onSubmit={handleRegister}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <InputField id="reg-fname" label="First Name" value={firstName} onChange={setFirstName} placeholder="First" icon={<User size={14} />} required />
                <InputField id="reg-lname" label="Last Name" value={lastName} onChange={setLastName} placeholder="Last" icon={<User size={14} />} />
              </div>

              <InputField id="reg-username" label="Username" value={username} onChange={setUsername} placeholder="e.g. john_doe" icon={<User size={14} />} required />
              <InputField id="reg-email" label="Email Address" type="email" value={email} onChange={setEmail} placeholder="you@company.com" icon={<Mail size={14} />} required />
              <InputField id="reg-phone" label="Phone Number (optional)" type="tel" value={phone} onChange={setPhone} placeholder="+91 9876543210" icon={<Phone size={14} />} hint="Used for SMS verification & account recovery" />

              {/* Role Selector */}
              <div className="form-group">
                <label className="form-label">Account Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {ROLES.map(r => (
                    <button key={r.value} type="button" onClick={() => setRole(r.value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                        background: role === r.value ? 'rgba(16,185,129,0.15)' : 'var(--color-bg-input)',
                        border: `1px solid ${role === r.value ? 'var(--color-accent-1)' : 'var(--color-border-subtle)'}`,
                        borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem',
                        color: role === r.value ? 'var(--color-accent-1)' : 'var(--color-text-secondary)',
                        fontWeight: role === r.value ? 600 : 400, transition: 'all 0.2s',
                      }}>
                      <span>{r.icon}</span> {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input id="reg-password" className="form-input" type={showPass ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters" required style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={eyeBtn}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= passwordStrength ? strengthColors[passwordStrength] : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: strengthColors[passwordStrength], marginTop: 4 }}>{strengthLabels[passwordStrength]}</div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input id="reg-confirm" className="form-input" type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password" required style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={eyeBtn}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {confirmPassword && confirmPassword === password && (
                    <CheckCircle2 size={16} color="#10b981" style={{ position: 'absolute', right: 36, top: '50%', transform: 'translateY(-50%)' }} />
                  )}
                </div>
              </div>

              <button type="submit" id="register-submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : <>Create Account <ChevronRight size={16} /></>}
              </button>

              <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--color-accent-1)', fontWeight: 600 }}>Sign in</Link>
              </p>
            </form>
          )}

          {/* ── Step 2: Email OTP ── */}
          {step === 'email-otp' && (
            <form className="auth-form" onSubmit={handleEmailOtp}>
              {devEmailOtp && <DevOtpHint otp={devEmailOtp} label="Email OTP (dev mode)" />}
              <OtpInput value={emailOtp} onChange={setEmailOtp} label="Email verification code" id="email-otp" />
              <button type="submit" id="verify-email-otp" className="btn btn-primary btn-lg w-full" disabled={loading || emailOtp.length !== 6}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <><ShieldCheck size={16} /> Verify Email</>}
              </button>
              <p style={{ textAlign: 'center', marginTop: 12, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                Didn't receive it?{' '}
                <button type="button" onClick={resendEmailOtp} style={{ background: 'none', border: 'none', color: 'var(--color-accent-1)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                  Resend OTP
                </button>
              </p>
            </form>
          )}

          {/* ── Step 3: Phone OTP ── */}
          {step === 'phone-otp' && (
            <form className="auth-form" onSubmit={handlePhoneOtp}>
              {devPhoneOtp && <DevOtpHint otp={devPhoneOtp} label="Phone OTP (dev mode)" />}
              <OtpInput value={phoneOtp} onChange={setPhoneOtp} label="Phone verification code" id="phone-otp" />
              <button type="submit" id="verify-phone-otp" className="btn btn-primary btn-lg w-full" disabled={loading || phoneOtp.length !== 6}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <><Phone size={16} /> Verify Phone</>}
              </button>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="button" onClick={resendPhoneOtp} style={{ flex: 1, background: 'none', border: '1px solid var(--color-border-subtle)', borderRadius: 8, color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '8px', fontSize: '0.82rem' }}>
                  Resend SMS
                </button>
                <button type="button" onClick={skipPhone} style={{ flex: 1, background: 'none', border: '1px solid var(--color-border-subtle)', borderRadius: 8, color: 'var(--color-text-muted)', cursor: 'pointer', padding: '8px', fontSize: '0.82rem' }}>
                  Skip for now
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StepIndicator({ current, hasPhone }: { current: Step; hasPhone: boolean }) {
  const steps = [
    { key: 'info', label: 'Account Info' },
    { key: 'email-otp', label: 'Email OTP' },
    ...(hasPhone ? [{ key: 'phone-otp', label: 'Phone OTP' }] : []),
    { key: 'done', label: 'Complete' },
  ]
  const currentIdx = steps.findIndex(s => s.key === current)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < currentIdx ? 'var(--color-accent-1)' : i === currentIdx ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
              border: `2px solid ${i <= currentIdx ? 'var(--color-accent-1)' : 'rgba(255,255,255,0.12)'}`,
              fontSize: '0.7rem', fontWeight: 700,
              color: i < currentIdx ? '#fff' : i === currentIdx ? 'var(--color-accent-1)' : 'var(--color-text-muted)',
            }}>
              {i < currentIdx ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: '0.65rem', color: i === currentIdx ? 'var(--color-accent-1)' : 'var(--color-text-muted)', whiteSpace: 'nowrap', fontWeight: i === currentIdx ? 600 : 400 }}>{s.label}</div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 32, height: 2, background: i < currentIdx ? 'var(--color-accent-1)' : 'rgba(255,255,255,0.08)', margin: '0 4px', marginBottom: 18, flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  )
}

function InputField({ id, label, value, onChange, placeholder, type = 'text', icon, required = false, hint }: any) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>{icon}</span>}
        <input id={id} className="form-input" type={type} value={value}
          onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
          required={required} style={{ paddingLeft: icon ? 36 : undefined }} />
      </div>
      {hint && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function OtpInput({ value, onChange, label, id }: { value: string; onChange: (v: string) => void; label: string; id: string }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <input
        id={id} className="form-input"
        type="text" inputMode="numeric" maxLength={6}
        value={value} onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        style={{ fontSize: '2rem', letterSpacing: '0.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
      />
    </div>
  )
}

function DevOtpHint({ otp, label }: { otp: string; label: string }) {
  return (
    <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 16 }}>🔑</span>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.3rem' }}>{otp}</div>
      </div>
    </div>
  )
}

function LeftPanel() {
  return (
    <div className="auth-left">
      <div style={{ maxWidth: 520, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
          <div style={{ width: 52, height: 52, background: 'var(--color-gradient-primary)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff' }}>L</div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, background: 'var(--color-gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>LOGIMIND v2</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Enterprise Logistics Intelligence</div>
          </div>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.2, marginBottom: 18 }}>
          Join thousands of<br />
          <span style={{ background: 'var(--color-gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>logistics leaders</span>
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 36 }}>
          Your account is protected with enterprise-grade security — email verification, phone OTP, and optional two-factor authentication.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { icon: '📧', title: 'Email Verification', desc: '6-digit OTP sent to your inbox to confirm identity' },
            { icon: '📱', title: 'Phone OTP (SMS)', desc: 'Secondary verification layer via SMS — like Google & Apple' },
            { icon: '🔐', title: 'Two-Factor Auth', desc: 'Optional 2FA for your account at login time' },
            { icon: '🌐', title: 'Sign in with Google', desc: 'One-click OAuth login — no password needed' },
          ].map(f => (
            <div key={f.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-primary)', marginBottom: 2 }}>{f.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const eyeBtn: React.CSSProperties = {
  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center',
}
