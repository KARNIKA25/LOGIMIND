import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2, MapPin, Thermometer, Package, ArrowUpRight, Edit, Trash2, X, Check } from 'lucide-react'
import { warehouseApi } from '../../services/api.service'
import type { Warehouse } from '../../types'
import toast from 'react-hot-toast'

const INITIAL_DEMO: Warehouse[] = [
  { id: 1, warehouse_code: 'WH-SF-01', name: 'Bay Area Central Logistics Hub', city: 'San Francisco', state: 'CA', country: 'USA', latitude: 37.7749, longitude: -122.4194, total_capacity: 18000, current_utilization: 82.4, status: 'ACTIVE', created_at: '2026-01-01T00:00:00Z', contact_phone: '+1-415-001-9001' },
  { id: 2, warehouse_code: 'WH-LA-02', name: 'Pacific Coast Intermodal Port Hub', city: 'Los Angeles', state: 'CA', country: 'USA', latitude: 34.0522, longitude: -118.2437, total_capacity: 25000, current_utilization: 74.6, status: 'ACTIVE', created_at: '2026-01-01T00:00:00Z', contact_phone: '+1-213-555-0122' },
  { id: 3, warehouse_code: 'WH-CHI-03', name: 'Midwest Cold Chain Facility', city: 'Chicago', state: 'IL', country: 'USA', latitude: 41.8781, longitude: -87.6298, total_capacity: 20000, current_utilization: 69.2, status: 'ACTIVE', created_at: '2026-01-01T00:00:00Z', contact_phone: '+1-312-555-0188' },
  { id: 4, warehouse_code: 'WH-NYC-04', name: 'Eastern Gateway Megahub', city: 'New York', state: 'NY', country: 'USA', latitude: 40.7128, longitude: -74.0060, total_capacity: 30000, current_utilization: 88.5, status: 'ACTIVE', created_at: '2026-01-01T00:00:00Z', contact_phone: '+1-212-555-0199' },
]

function utilColor(u: number) {
  if (u >= 85) return 'danger'
  if (u >= 70) return 'warning'
  return 'emerald'
}

export default function WarehousesPage() {
  const navigate = useNavigate()
  const [localWarehouses, setLocalWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem('lm_custom_warehouses')
    return saved ? JSON.parse(saved) : INITIAL_DEMO
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [formData, setFormData] = useState<Partial<Warehouse>>({
    warehouse_code: '',
    name: '',
    city: '',
    state: '',
    country: 'USA',
    total_capacity: 20000,
    current_utilization: 70.0,
    status: 'ACTIVE',
    latitude: 37.7749,
    longitude: -122.4194,
    contact_phone: '+1-800-LOGIMIND',
  })

  const { data } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouseApi.list({ page: 1, size: 20 }),
  })

  const warehouses: Warehouse[] = data?.data?.items?.length ? data.data.items : localWarehouses

  function saveLocalWarehouses(updated: Warehouse[]) {
    setLocalWarehouses(updated)
    localStorage.setItem('lm_custom_warehouses', JSON.stringify(updated))
  }

  function handleOpenCreate() {
    setEditingWarehouse(null)
    setFormData({
      warehouse_code: `WH-HUB-${Math.floor(10 + Math.random() * 90)}`,
      name: '',
      city: '',
      state: 'CA',
      country: 'USA',
      total_capacity: 22000,
      current_utilization: 65.0,
      status: 'ACTIVE',
      latitude: 34.0522,
      longitude: -118.2437,
      contact_phone: '+1-800-LOGIMIND',
    })
    setModalOpen(true)
  }

  function handleOpenEdit(e: React.MouseEvent, wh: Warehouse) {
    e.stopPropagation()
    setEditingWarehouse(wh)
    setFormData({ ...wh })
    setModalOpen(true)
  }

  function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this warehouse facility?')) {
      warehouseApi.delete(id).catch(() => null)
      const updated = warehouses.filter(w => w.id !== id)
      saveLocalWarehouses(updated)
      toast.success('Warehouse removed successfully.')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name?.trim() || !formData.city?.trim()) {
      toast.error('Warehouse name and city are required.')
      return
    }

    try {
      if (editingWarehouse) {
        await warehouseApi.update(editingWarehouse.id, formData).catch(() => null)
        const updated = warehouses.map(w => w.id === editingWarehouse.id ? { ...w, ...formData } as Warehouse : w)
        saveLocalWarehouses(updated)
        toast.success(`Warehouse "${formData.name}" updated successfully!`)
      } else {
        const newWarehouse: Warehouse = {
          id: Date.now(),
          warehouse_code: formData.warehouse_code || `WH-${Date.now().toString().slice(-4)}`,
          name: formData.name || 'Regional Logistics Facility',
          city: formData.city || 'San Francisco',
          state: formData.state || 'CA',
          country: formData.country || 'USA',
          total_capacity: Number(formData.total_capacity) || 15000,
          current_utilization: Number(formData.current_utilization) || 60,
          status: formData.status || 'ACTIVE',
          latitude: Number(formData.latitude) || 37.7749,
          longitude: Number(formData.longitude) || -122.4194,
          contact_phone: formData.contact_phone || '+1-800-LOGIMIND',
          created_at: new Date().toISOString(),
        }
        await warehouseApi.create(newWarehouse).catch(() => null)
        saveLocalWarehouses([newWarehouse, ...warehouses])
        toast.success(`Warehouse "${newWarehouse.name}" created successfully!`)
      }
      setModalOpen(false)
    } catch {
      toast.error('Failed to save warehouse.')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-block">
          <h1>Warehouse Network</h1>
          <p className="page-subtitle">{warehouses.length} facilities · Capacity heatmaps & full editing enabled</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            <Plus size={14} /> Add Warehouse
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="metric-grid mb-5">
        {[
          { label: 'Total Facilities', value: warehouses.length, icon: Building2, cls: 'indigo' },
          { label: 'Total Capacity', value: `${(warehouses.reduce((a, w) => a + (Number(w.total_capacity) || 0), 0) / 1000).toFixed(0)}K sqft`, icon: Package, cls: 'violet' },
          { label: 'Avg. Utilization', value: `${(warehouses.reduce((a, w) => a + (Number(w.current_utilization) || 0), 0) / (warehouses.length || 1)).toFixed(1)}%`, icon: ArrowUpRight, cls: 'cyan' },
          { label: 'High Util Alerts', value: warehouses.filter(w => (Number(w.current_utilization) || 0) >= 85).length, icon: Thermometer, cls: 'amber' },
        ].map((m) => (
          <div key={m.label} className="metric-card">
            <div className={`metric-icon ${m.cls}`}><m.icon size={20} /></div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Warehouse Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            className="card"
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            onClick={() => navigate(`/warehouses/${wh.id}`)}
          >
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div className="font-mono text-xs text-accent mb-1">{wh.warehouse_code}</div>
                  <h4 style={{ marginBottom: 4 }}>{wh.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    <MapPin size={12} />
                    {wh.city}, {wh.state} · {wh.country}
                  </div>
                </div>
                <span className={`badge ${wh.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                  <span className={`badge-dot ${wh.status === 'ACTIVE' ? 'success' : 'neutral'}`} />
                  {wh.status}
                </span>
              </div>

              {/* Utilization Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="text-xs text-muted">Utilization</span>
                  <span className="text-xs font-semibold" style={{ color: utilColor(wh.current_utilization) === 'danger' ? 'var(--color-danger)' : utilColor(wh.current_utilization) === 'warning' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                    {Number(wh.current_utilization).toFixed(1)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${utilColor(wh.current_utilization)}`}
                    style={{ width: `${Math.min(100, Number(wh.current_utilization))}%` }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                <div>
                  <div className="text-xs text-muted">Total Capacity</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: 2 }}>{Number(wh.total_capacity).toLocaleString()} sqft</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Contact Phone</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: 2 }}>{wh.contact_phone || '—'}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--color-border-subtle)', background: 'rgba(15,23,42,0.4)' }} onClick={e => e.stopPropagation()}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={(e) => handleOpenEdit(e, wh)}>
                <Edit size={13} style={{ marginRight: 4 }} /> Edit Facility
              </button>
              <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--color-danger)' }} onClick={(e) => handleDelete(e, wh.id)} title="Delete Facility">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Warehouse Edit / Create Modal */}
      {modalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-box" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3>{editingWarehouse ? `Edit Warehouse — ${editingWarehouse.warehouse_code}` : 'Add New Warehouse Facility'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Warehouse Code *</label>
                    <input
                      className="form-input"
                      value={formData.warehouse_code || ''}
                      onChange={e => setFormData({ ...formData, warehouse_code: e.target.value })}
                      placeholder="WH-SF-01"
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
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="OFFLINE">OFFLINE</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Facility Name *</label>
                  <input
                    className="form-input"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Bay Area Intermodal Logistics Hub"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      className="form-input"
                      value={formData.city || ''}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      placeholder="San Francisco"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      className="form-input"
                      value={formData.state || ''}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      placeholder="CA"
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
                    <label className="form-label">Total Capacity (sqft)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.total_capacity || ''}
                      onChange={e => setFormData({ ...formData, total_capacity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Current Utilization (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={formData.current_utilization || ''}
                      onChange={e => setFormData({ ...formData, current_utilization: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={formData.latitude || ''}
                      onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={formData.longitude || ''}
                      onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    className="form-input"
                    value={formData.contact_phone || ''}
                    onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+1-415-555-0100"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} style={{ marginRight: 6 }} /> Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
