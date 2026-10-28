import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Star, Globe, Phone, Mail, Edit, Trash2, X, Check, MapPin } from 'lucide-react'
import { supplierApi } from '../../services/api.service'
import type { Supplier } from '../../types'
import toast from 'react-hot-toast'

const INITIAL_DEMO: Supplier[] = [
  { id: 1, supplier_code: 'SUP-APEX-001', company_name: 'Apex Precision Technologies', contact_person: 'James Whitfield', email: 'james@apextech.com', phone: '+1-206-555-0101', city: 'Seattle', country: 'USA', rating: 4.95, reliability_score: 99.0, status: 'ACTIVE' },
  { id: 2, supplier_code: 'SUP-NTEC-002', company_name: 'Nordic Thermal Components Ltd', contact_person: 'Anna Lindstrom', email: 'anna@nordictherm.eu', phone: '+46-8-555-0202', city: 'Stockholm', country: 'Sweden', rating: 4.82, reliability_score: 96.4, status: 'ACTIVE' },
  { id: 3, supplier_code: 'SUP-GLTF-003', company_name: 'Global TransLogistics Freight Co', contact_person: 'Carlos Mendez', email: 'carlos@gltfreight.com', phone: '+1-305-555-0303', city: 'Miami', country: 'USA', rating: 4.88, reliability_score: 97.6, status: 'ACTIVE' },
  { id: 4, supplier_code: 'SUP-PIND-004', company_name: 'Pacific Industrial Hardware', contact_person: 'Mei Zhang', email: 'mei@pacifichw.com', phone: '+86-755-5550-404', city: 'Shenzhen', country: 'China', rating: 4.76, reliability_score: 95.2, status: 'ACTIVE' },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={13} fill={s <= Math.round(rating) ? '#f59e0b' : 'transparent'} color={s <= Math.round(rating) ? '#f59e0b' : '#475569'} />
      ))}
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', marginLeft: 4 }}>{rating.toFixed(2)}</span>
    </div>
  )
}

export default function SuppliersPage() {
  const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('lm_custom_suppliers')
    return saved ? JSON.parse(saved) : INITIAL_DEMO
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState<Partial<Supplier>>({
    supplier_code: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    city: '',
    country: 'USA',
    rating: 4.8,
    reliability_score: 98.0,
    status: 'ACTIVE',
  })

  const { data } = useQuery({ queryKey: ['suppliers'], queryFn: () => supplierApi.list({ size: 50 }) })
  const suppliers: Supplier[] = data?.data?.items?.length ? data.data.items : localSuppliers

  function saveLocalSuppliers(updated: Supplier[]) {
    setLocalSuppliers(updated)
    localStorage.setItem('lm_custom_suppliers', JSON.stringify(updated))
  }

  function handleOpenCreate() {
    setEditingSupplier(null)
    setFormData({
      supplier_code: `SUP-VEN-${Math.floor(100 + Math.random() * 900)}`,
      company_name: '',
      contact_person: '',
      email: '',
      phone: '+1-555-0100',
      city: 'San Francisco',
      country: 'USA',
      rating: 4.9,
      reliability_score: 98.5,
      status: 'ACTIVE',
    })
    setModalOpen(true)
  }

  function handleOpenEdit(supplier: Supplier) {
    setEditingSupplier(supplier)
    setFormData({ ...supplier })
    setModalOpen(true)
  }

  function handleDelete(id: number) {
    if (confirm('Are you sure you want to delete this supplier partner?')) {
      supplierApi.delete(id).catch(() => null)
      const updated = suppliers.filter(s => s.id !== id)
      saveLocalSuppliers(updated)
      toast.success('Supplier partner removed successfully.')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.company_name?.trim() || !formData.email?.trim()) {
      toast.error('Company name and email are required.')
      return
    }

    try {
      if (editingSupplier) {
        await supplierApi.update(editingSupplier.id, formData).catch(() => null)
        const updated = suppliers.map(s => s.id === editingSupplier.id ? { ...s, ...formData } as Supplier : s)
        saveLocalSuppliers(updated)
        toast.success(`Supplier "${formData.company_name}" updated successfully!`)
      } else {
        const newSupplier: Supplier = {
          id: Date.now(),
          supplier_code: formData.supplier_code || `SUP-${Date.now().toString().slice(-4)}`,
          company_name: formData.company_name,
          contact_person: formData.contact_person || 'Partner Rep',
          email: formData.email,
          phone: formData.phone || '+1-555-0100',
          city: formData.city || 'Global Hub',
          country: formData.country || 'USA',
          rating: Number(formData.rating) || 4.8,
          reliability_score: Number(formData.reliability_score) || 97.0,
          status: formData.status || 'ACTIVE',
        }
        await supplierApi.create(newSupplier).catch(() => null)
        saveLocalSuppliers([newSupplier, ...suppliers])
        toast.success(`Supplier "${newSupplier.company_name}" registered successfully!`)
      }
      setModalOpen(false)
    } catch {
      toast.error('Failed to save supplier partner.')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-block">
          <h1>Supplier Partner Management</h1>
          <p className="page-subtitle">{suppliers.length} suppliers · Performance-rated · SLA tracked · Full editing</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            <Plus size={14} /> Add Supplier
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
        {suppliers.map((s) => (
          <div key={s.id} className="card card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div className="font-mono text-xs text-muted mb-1">{s.supplier_code}</div>
                  <h4 style={{ marginBottom: 4 }}>{s.company_name}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Contact: {s.contact_person}</div>
                </div>
                <span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                  <span className={`badge-dot ${s.status === 'ACTIVE' ? 'success' : 'neutral'}`} />
                  {s.status}
                </span>
              </div>

              {s.rating && <div className="mb-4"><StarRating rating={s.rating} /></div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{ padding: '8px 12px', background: 'rgba(99,102,241,0.06)', borderRadius: 8 }}>
                  <div className="text-xs text-muted">Reliability Score</div>
                  <div style={{ fontWeight: 700, color: (s.reliability_score ?? 0) >= 95 ? 'var(--color-success)' : 'var(--color-warning)', marginTop: 2 }}>
                    {s.reliability_score?.toFixed(1) ?? '—'}%
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(6,182,212,0.06)', borderRadius: 8 }}>
                  <div className="text-xs text-muted">Location</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: 2, color: 'var(--color-text-primary)' }}>
                    {s.city}, {s.country}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={12} color="var(--color-accent-1)" /> {s.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={12} color="var(--color-accent-1)" /> {s.phone}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--color-border-subtle)' }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleOpenEdit(s)}>
                <Edit size={13} style={{ marginRight: 4 }} /> Edit Partner
              </button>
              <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(s.id)} title="Delete Supplier">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Supplier Modal */}
      {modalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>{editingSupplier ? `Edit Supplier — ${editingSupplier.company_name}` : 'Register New Supplier Partner'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Supplier Code</label>
                    <input
                      className="form-input"
                      value={formData.supplier_code || ''}
                      onChange={e => setFormData({ ...formData, supplier_code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-input"
                      value={formData.status || 'ACTIVE'}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input
                    className="form-input"
                    value={formData.company_name || ''}
                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="e.g. Apex Precision Technologies"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input
                      className="form-input"
                      value={formData.contact_person || ''}
                      onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="James Whitfield"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@supplier.com"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      className="form-input"
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      className="form-input"
                      value={formData.city || ''}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input
                      className="form-input"
                      value={formData.country || 'USA'}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Quality Rating (1-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      className="form-input"
                      value={formData.rating || ''}
                      onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) || 5 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reliability Score (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-input"
                      value={formData.reliability_score || ''}
                      onChange={e => setFormData({ ...formData, reliability_score: parseFloat(e.target.value) || 98 })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} style={{ marginRight: 6 }} /> Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
