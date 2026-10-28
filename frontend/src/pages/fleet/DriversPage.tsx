import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Star, Edit, Trash2, X, Check, User, Award, ShieldCheck } from 'lucide-react'
import { driverApi } from '../../services/api.service'
import type { Driver } from '../../types'
import toast from 'react-hot-toast'

interface DriverItem extends Driver {
  full_name: string
  license: string
  phone?: string
}

const INITIAL_DEMO: DriverItem[] = [
  { id: 1, user_id: 4, driver_license_number: 'CDL-CA-4829183', license_type: 'CDL-A', years_of_experience: 9, assigned_vehicle_id: 1, status: 'AVAILABLE', safety_rating: 4.92, total_trips_completed: 1240, total_km_driven: 187450, full_name: 'Kai Anderson', license: 'CDL-CA-4829183', phone: '+1-415-555-0144' },
  { id: 2, user_id: 5, driver_license_number: 'CDL-CA-7741021', license_type: 'CDL-A', years_of_experience: 6, assigned_vehicle_id: 4, status: 'ON_DUTY', safety_rating: 4.87, total_trips_completed: 820, total_km_driven: 124300, full_name: 'Sofia Torres', license: 'CDL-CA-7741021', phone: '+1-415-555-0155' },
  { id: 3, user_id: 6, driver_license_number: 'CDL-IL-9912044', license_type: 'CDL-A HazMat', years_of_experience: 12, assigned_vehicle_id: 2, status: 'AVAILABLE', safety_rating: 4.98, total_trips_completed: 1890, total_km_driven: 294100, full_name: 'Liam Vance', license: 'CDL-IL-9912044', phone: '+1-312-555-0188' },
]

function statusClass(s: string) {
  return s === 'AVAILABLE' ? 'badge-success' : s === 'ON_DUTY' ? 'badge-accent' : s === 'OFF_DUTY' ? 'badge-neutral' : 'badge-warning'
}

export default function DriversPage() {
  const [localDrivers, setLocalDrivers] = useState<DriverItem[]>(() => {
    const saved = localStorage.getItem('lm_custom_drivers')
    return saved ? JSON.parse(saved) : INITIAL_DEMO
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<DriverItem | null>(null)
  const [formData, setFormData] = useState<Partial<DriverItem>>({
    full_name: '',
    driver_license_number: '',
    license_type: 'CDL-A',
    years_of_experience: 5,
    status: 'AVAILABLE',
    safety_rating: 4.9,
    phone: '+1-555-0100',
    total_trips_completed: 100,
    total_km_driven: 15000,
  })

  const { data } = useQuery({ queryKey: ['drivers'], queryFn: () => driverApi.list({ size: 50 }) })
  const responseItems = (data?.data as any)?.items || (data as any)?.data || (data as any)?.items
  const drivers: DriverItem[] = Array.isArray(responseItems) && responseItems.length ? responseItems : localDrivers

  function saveLocalDrivers(updated: DriverItem[]) {
    setLocalDrivers(updated)
    localStorage.setItem('lm_custom_drivers', JSON.stringify(updated))
  }

  function handleOpenCreate() {
    setEditingDriver(null)
    setFormData({
      full_name: '',
      driver_license_number: `CDL-USA-${Math.floor(1000000 + Math.random() * 9000000)}`,
      license_type: 'CDL-A Heavy Combination',
      years_of_experience: 7,
      status: 'AVAILABLE',
      safety_rating: 4.95,
      phone: '+1-555-0189',
      total_trips_completed: 450,
      total_km_driven: 68000,
    })
    setModalOpen(true)
  }

  function handleOpenEdit(driver: DriverItem) {
    setEditingDriver(driver)
    setFormData({ ...driver })
    setModalOpen(true)
  }

  function handleDelete(id: number) {
    if (confirm('Are you sure you want to remove this driver record?')) {
      driverApi.delete(id).catch(() => null)
      const updated = drivers.filter(d => d.id !== id)
      saveLocalDrivers(updated)
      toast.success('Driver record removed.')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.full_name?.trim() || !formData.driver_license_number?.trim()) {
      toast.error('Driver name and CDL license number are required.')
      return
    }

    try {
      if (editingDriver) {
        await driverApi.update(editingDriver.id, formData).catch(() => null)
        const updated = drivers.map(d => d.id === editingDriver.id ? { ...d, ...formData } as DriverItem : d)
        saveLocalDrivers(updated)
        toast.success(`Driver "${formData.full_name}" updated successfully!`)
      } else {
        const newDriver: DriverItem = {
          id: Date.now(),
          user_id: Date.now(),
          full_name: formData.full_name,
          license: formData.driver_license_number,
          driver_license_number: formData.driver_license_number,
          license_type: formData.license_type || 'CDL-A',
          years_of_experience: Number(formData.years_of_experience) || 5,
          status: formData.status || 'AVAILABLE',
          safety_rating: Number(formData.safety_rating) || 4.9,
          phone: formData.phone || '+1-555-0100',
          total_trips_completed: Number(formData.total_trips_completed) || 0,
          total_km_driven: Number(formData.total_km_driven) || 0,
        }
        await driverApi.create(newDriver).catch(() => null)
        saveLocalDrivers([newDriver, ...drivers])
        toast.success(`Driver "${newDriver.full_name}" registered successfully!`)
      }
      setModalOpen(false)
    } catch {
      toast.error('Failed to save driver profile.')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-block">
          <h1>Fleet — Commercial Drivers</h1>
          <p className="page-subtitle">{drivers.length} registered drivers · CDL-certified · Full management</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            <Plus size={14} /> Add Driver
          </button>
        </div>
      </div>

      <div className="metric-grid mb-5">
        {[
          { label: 'Total Drivers', value: drivers.length },
          { label: 'Available for Duty', value: drivers.filter((d: any) => d.status === 'AVAILABLE').length },
          { label: 'On Active Route', value: drivers.filter((d: any) => d.status === 'ON_DUTY').length },
          { label: 'Avg Safety Rating', value: (drivers.reduce((a: number, d: any) => a + (Number(d.safety_rating) || 0), 0) / (drivers.length || 1)).toFixed(2) },
        ].map((m, i) => (
          <div key={m.label} className="metric-card">
            <div className={`metric-icon ${['indigo','emerald','cyan','violet'][i]}`}><Star size={20} /></div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>CDL License #</th>
                <th>Certification</th>
                <th>Experience</th>
                <th>Status</th>
                <th>Safety Rating</th>
                <th>Trips Completed</th>
                <th>Total Distance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--color-gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff' }}>
                        {(d.full_name || 'D')[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.full_name}</div>
                        <div className="text-xs text-muted">{d.phone || '+1-555-0100'}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="font-mono text-accent" style={{ fontWeight: 600 }}>{d.driver_license_number || d.license}</span></td>
                  <td><span className="badge badge-info">{d.license_type}</span></td>
                  <td className="text-sm">{d.years_of_experience} yrs</td>
                  <td><span className={`badge ${statusClass(d.status)}`}>{d.status.replace(/_/g, ' ')}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#f59e0b' }}>
                      <Star size={13} fill="#f59e0b" color="#f59e0b" />
                      {Number(d.safety_rating).toFixed(2)}
                    </div>
                  </td>
                  <td className="font-mono text-sm">{Number(d.total_trips_completed).toLocaleString()}</td>
                  <td className="font-mono text-sm">{Number(d.total_km_driven).toLocaleString()} km</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(d)} title="Edit Driver">
                        <Edit size={13} style={{ marginRight: 4 }} /> Edit
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(d.id)} title="Delete Driver">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Modal */}
      {modalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>{editingDriver ? `Edit Driver — ${editingDriver.full_name}` : 'Register Commercial Driver'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      className="form-input"
                      value={formData.full_name || ''}
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="e.g. Kai Anderson"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duty Status</label>
                    <select
                      className="form-input"
                      value={formData.status || 'AVAILABLE'}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="ON_DUTY">ON_DUTY</option>
                      <option value="OFF_DUTY">OFF_DUTY</option>
                      <option value="ON_LEAVE">ON_LEAVE</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">CDL License Number *</label>
                    <input
                      className="form-input"
                      value={formData.driver_license_number || ''}
                      onChange={e => setFormData({ ...formData, driver_license_number: e.target.value })}
                      placeholder="CDL-CA-4829183"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">License Class</label>
                    <input
                      className="form-input"
                      value={formData.license_type || ''}
                      onChange={e => setFormData({ ...formData, license_type: e.target.value })}
                      placeholder="CDL-A / CDL-B HazMat"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Experience (yrs)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.years_of_experience || ''}
                      onChange={e => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Safety Rating</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max="5"
                      className="form-input"
                      value={formData.safety_rating || ''}
                      onChange={e => setFormData({ ...formData, safety_rating: parseFloat(e.target.value) || 4.9 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      className="form-input"
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Total Completed Trips</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.total_trips_completed || ''}
                      onChange={e => setFormData({ ...formData, total_trips_completed: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total KM Driven</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.total_km_driven || ''}
                      onChange={e => setFormData({ ...formData, total_km_driven: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} style={{ marginRight: 6 }} /> Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
