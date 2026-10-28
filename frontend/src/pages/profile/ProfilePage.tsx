import { useState } from 'react'
import { useAuthStore } from '../../store'
import { User, Mail, Phone, Globe, Shield, Key, Save, Lock, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const profile = user?.profile

  const [formData, setFormData] = useState({
    first_name: profile?.first_name || 'Sarah',
    last_name: profile?.last_name || 'Connor',
    email: user?.email || 'superadmin@logimind.ai',
    phone: profile?.phone || '+1-415-555-0199',
    country: profile?.country || 'United States',
    username: user?.username || 'superadmin',
  })

  const [securitySettings, setSecuritySettings] = useState({
    two_factor: false,
    api_tokens: true,
    session_logging: true,
  })

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (user) {
      const updatedUser = {
        ...user,
        email: formData.email,
        username: formData.username,
        profile: {
          ...user.profile,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          country: formData.country,
        }
      }
      setUser(updatedUser)
      toast.success('Profile details saved successfully!')
    }
  }

  function handleToggleSecurity(key: keyof typeof securitySettings) {
    setSecuritySettings(prev => {
      const nextVal = !prev[key]
      toast.success(`${key.replace('_', ' ').toUpperCase()} has been ${nextVal ? 'enabled' : 'disabled'}`)
      return { ...prev, [key]: nextVal }
    })
  }

  function handleChangePassword() {
    if (!passwordForm.newPassword) {
      toast.error('New password cannot be empty')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setShowPasswordModal(false)
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    toast.success('Password updated successfully!')
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-block">
          <h1>My Profile</h1>
          <p className="page-subtitle">Account settings, credentials, and preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Profile Card */}
        <div className="card card-body" style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, background: 'var(--color-gradient-primary)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 auto 16px', boxShadow: 'var(--shadow-glow)' }}>
            {(formData.first_name?.[0] || 'L')}{(formData.last_name?.[0] || 'M')}
          </div>
          <h3 style={{ marginBottom: 4 }}>{formData.first_name} {formData.last_name}</h3>
          <div className="text-sm text-muted mb-3">{formData.email}</div>
          <span className={`badge ${user?.role === 'admin' ? 'badge-danger' : user?.role === 'manager' ? 'badge-warning' : 'badge-accent'}`}>
            <Shield size={12} /> {user?.role?.toUpperCase().replace('_', ' ') || 'SYSTEM ADMIN'}
          </span>
          <div className="divider mt-4 mb-4" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="text-xs text-muted">USER ID</div>
            <div className="font-mono text-sm text-accent">#{user?.id || 1}</div>
            <div className="text-xs text-muted mt-2">STATUS</div>
            <span className="badge badge-success" style={{ margin: '0 auto' }}><span className="badge-dot success" />Active · Verified</span>
          </div>
        </div>

        {/* Profile Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <form className="card card-body" onSubmit={handleSaveProfile}>
            <h4 className="mb-5"><User size={16} style={{ display: 'inline', marginRight: 6 }} color="var(--color-accent-1)" />Personal Information</h4>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    value={formData.first_name}
                    onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    value={formData.last_name}
                    onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    value={formData.phone}
                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Country / Region</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    value={formData.country}
                    onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    value={formData.username}
                    onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="mt-5" style={{ display: 'flex', alignItems: 'center' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                <Save size={14} style={{ marginRight: 6 }} /> Save Profile Changes
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm ml-auto"
                style={{ marginLeft: 12 }}
                onClick={() => setShowPasswordModal(true)}
              >
                <Lock size={14} style={{ marginRight: 6 }} /> Change Password
              </button>
            </div>
          </form>

          <div className="card card-body">
            <h4 className="mb-4"><Shield size={16} style={{ display: 'inline', marginRight: 6 }} color="var(--color-accent-1)" />Security & Access Settings</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'two_factor' as const, label: 'Two-Factor Authentication (2FA)', desc: 'Protect account logins with TOTP authenticator app tokens', enabled: securitySettings.two_factor },
                { key: 'api_tokens' as const, label: 'API Access Tokens', desc: 'Enable programmatic REST and GraphQL token authorization', enabled: securitySettings.api_tokens },
                { key: 'session_logging' as const, label: 'Session Geo-Audit Logging', desc: 'Log real-time IP addresses and browser sessions for anomaly detection', enabled: securitySettings.session_logging },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    background: 'rgba(99,102,241,0.04)',
                    borderRadius: 10,
                    border: '1px solid rgba(99,102,241,0.1)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleToggleSecurity(item.key)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.label}</div>
                    <div className="text-xs text-muted">{item.desc}</div>
                  </div>
                  <button
                    type="button"
                    className={`badge ${item.enabled ? 'badge-success' : 'badge-neutral'}`}
                    style={{ border: 'none', cursor: 'pointer', padding: '6px 12px' }}
                  >
                    {item.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Account Password</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowPasswordModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="••••••••••••"
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPasswordModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleChangePassword}>
                <Save size={14} style={{ marginRight: 6 }} /> Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
