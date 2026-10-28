import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Thermometer, Box, Zap, Edit3, Plus, Trash2, X, Save } from 'lucide-react'
import { warehouseApi } from '../../services/api.service'
import LeafletMap from '../../components/common/LeafletMap'
import toast from 'react-hot-toast'

interface StorageZone {
  id: number
  zone_code: string
  zone_name: string
  zone_type: 'DRY_STORAGE' | 'COLD_CHAIN' | 'HAZARDOUS' | string
  capacity: number
  current_load: number
  temperature_celsius?: number
  humidity_percentage?: number
}

interface WarehouseData {
  id: number
  warehouse_code: string
  name: string
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
  total_capacity: number
  current_utilization: number
  status: string
  contact_email?: string
  contact_phone?: string
  created_at?: string
  zones: StorageZone[]
}

const DEMO_WH: WarehouseData = {
  id: 1,
  warehouse_code: 'WH-SF-01',
  name: 'Bay Area Central Logistics Hub',
  city: 'San Francisco',
  state: 'CA',
  country: 'USA',
  latitude: 37.7749,
  longitude: -122.4194,
  total_capacity: 18000,
  current_utilization: 82.4,
  status: 'ACTIVE',
  contact_email: 'ops@whsf01.logimind.ai',
  contact_phone: '+1-415-001-9001',
  created_at: '2026-01-01T00:00:00Z',
  zones: [
    { id: 1, zone_code: 'ZONE-A-DRY', zone_name: 'Dry Bulk Storage', zone_type: 'DRY_STORAGE', capacity: 9000, current_load: 7560 },
    { id: 2, zone_code: 'ZONE-B-COLD', zone_name: 'Temperature-Controlled Cold Chain', zone_type: 'COLD_CHAIN', capacity: 5400, current_load: 3996, temperature_celsius: 4, humidity_percentage: 60 },
    { id: 3, zone_code: 'ZONE-C-HAZ', zone_name: 'High-Security HazMat Zone', zone_type: 'HAZARDOUS', capacity: 3600, current_load: 2196 },
  ],
}

function zoneTypeColor(type: string) {
  const m: Record<string, string> = { DRY_STORAGE: '#6366f1', COLD_CHAIN: '#06b6d4', HAZARDOUS: '#f59e0b' }
  return m[type] ?? '#94a3b8'
}

export default function WarehouseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const storageKey = `lm_wh_override_${id}`
  const savedData = (() => {
    try {
      const item = localStorage.getItem(storageKey)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  })()

  const [localWarehouse, setLocalWarehouse] = useState<WarehouseData>(savedData || DEMO_WH)
  const [showEditWhModal, setShowEditWhModal] = useState(false)
  const [editWhForm, setEditWhForm] = useState<Partial<WarehouseData>>(localWarehouse)

  const [showZoneModal, setShowZoneModal] = useState(false)
  const [editingZone, setEditingZone] = useState<StorageZone | null>(null)
  const [zoneForm, setZoneForm] = useState({
    zone_code: '',
    zone_name: '',
    zone_type: 'DRY_STORAGE',
    capacity: 5000,
    current_load: 2500,
    temperature_celsius: 20,
    humidity_percentage: 50,
  })

  const { data } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: async () => {
      try {
        const res = await warehouseApi.get(Number(id))
        return res.data
      } catch {
        return localWarehouse
      }
    },
    enabled: !!id,
  })

  const wh: WarehouseData = localWarehouse

  function handleSaveWarehouse() {
    const updated: WarehouseData = {
      ...wh,
      ...editWhForm,
      latitude: Number(editWhForm.latitude ?? wh.latitude),
      longitude: Number(editWhForm.longitude ?? wh.longitude),
      total_capacity: Number(editWhForm.total_capacity ?? wh.total_capacity),
    }
    setLocalWarehouse(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    setShowEditWhModal(false)
    toast.success('Warehouse facility updated successfully')
  }

  function handleOpenAddZone() {
    setEditingZone(null)
    setZoneForm({
      zone_code: `ZONE-${String.fromCharCode(65 + (wh.zones?.length || 0))}-DRY`,
      zone_name: 'Storage Zone',
      zone_type: 'DRY_STORAGE',
      capacity: 4000,
      current_load: 1500,
      temperature_celsius: 20,
      humidity_percentage: 50,
    })
    setShowZoneModal(true)
  }

  function handleOpenEditZone(zone: StorageZone) {
    setEditingZone(zone)
    setZoneForm({
      zone_code: zone.zone_code,
      zone_name: zone.zone_name,
      zone_type: zone.zone_type,
      capacity: zone.capacity,
      current_load: zone.current_load,
      temperature_celsius: zone.temperature_celsius ?? 20,
      humidity_percentage: zone.humidity_percentage ?? 50,
    })
    setShowZoneModal(true)
  }

  function handleSaveZone() {
    let newZones: StorageZone[] = []
    if (editingZone) {
      newZones = (wh.zones || []).map(z =>
        z.id === editingZone.id
          ? {
              ...z,
              zone_code: zoneForm.zone_code,
              zone_name: zoneForm.zone_name,
              zone_type: zoneForm.zone_type,
              capacity: Number(zoneForm.capacity),
              current_load: Number(zoneForm.current_load),
              temperature_celsius: zoneForm.zone_type === 'COLD_CHAIN' ? Number(zoneForm.temperature_celsius) : undefined,
              humidity_percentage: zoneForm.zone_type === 'COLD_CHAIN' ? Number(zoneForm.humidity_percentage) : undefined,
            }
          : z
      )
    } else {
      const newId = (wh.zones?.length || 0) + 1
      newZones = [
        ...(wh.zones || []),
        {
          id: newId,
          zone_code: zoneForm.zone_code,
          zone_name: zoneForm.zone_name,
          zone_type: zoneForm.zone_type,
          capacity: Number(zoneForm.capacity),
          current_load: Number(zoneForm.current_load),
          temperature_celsius: zoneForm.zone_type === 'COLD_CHAIN' ? Number(zoneForm.temperature_celsius) : undefined,
          humidity_percentage: zoneForm.zone_type === 'COLD_CHAIN' ? Number(zoneForm.humidity_percentage) : undefined,
        },
      ]
    }

    const totalLoad = newZones.reduce((s, z) => s + z.current_load, 0)
    const totalCap = newZones.reduce((s, z) => s + z.capacity, 0)
    const newUtil = totalCap > 0 ? (totalLoad / totalCap) * 100 : wh.current_utilization

    const updated = {
      ...wh,
      zones: newZones,
      current_utilization: newUtil,
    }

    setLocalWarehouse(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    setShowZoneModal(false)
    toast.success(editingZone ? 'Storage zone updated' : 'New storage zone added')
  }

  function handleDeleteZone(zoneId: number) {
    if (!confirm('Are you sure you want to remove this storage zone?')) return
    const newZones = (wh.zones || []).filter(z => z.id !== zoneId)
    const totalLoad = newZones.reduce((s, z) => s + z.current_load, 0)
    const totalCap = newZones.reduce((s, z) => s + z.capacity, 0)
    const newUtil = totalCap > 0 ? (totalLoad / totalCap) * 100 : wh.current_utilization

    const updated = {
      ...wh,
      zones: newZones,
      current_utilization: newUtil,
    }
    setLocalWarehouse(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    toast.success('Storage zone removed')
  }

  const utilPct = wh.current_utilization

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/warehouses')}><ArrowLeft size={18} /></button>
          <div>
            <h1 style={{ fontSize: '1.4rem' }}>{wh.name}</h1>
            <p className="page-subtitle">{wh.warehouse_code} · {wh.city}, {wh.state}</p>
          </div>
        </div>
        <div className="page-actions">
          <span className={`badge ${utilPct >= 85 ? 'badge-danger' : utilPct >= 70 ? 'badge-warning' : 'badge-success'}`}>
            {utilPct.toFixed(1)}% Utilized
          </span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditWhForm(wh)
              setShowEditWhModal(true)
            }}
          >
            <Edit3 size={14} style={{ marginRight: 6 }} /> Edit Warehouse
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Map */}
          {wh.latitude && wh.longitude && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="card-header"><h3>Facility Location & Geofence</h3></div>
              <div style={{ height: 300 }}>
                <LeafletMap
                  center={[wh.latitude, wh.longitude]}
                  zoom={14}
                  markers={[{
                    position: [wh.latitude, wh.longitude],
                    title: wh.warehouse_code,
                    popup: `<b>${wh.name}</b><br/>${wh.city}, ${wh.state}`,
                    color: '#6366f1'
                  }]}
                  circles={[{
                    center: [wh.latitude, wh.longitude],
                    radius: 600,
                    color: '#6366f1',
                    fillColor: '#6366f1'
                  }]}
                  height={300}
                  fitBounds={false}
                />
              </div>
            </div>
          )}

          {/* Storage Zones */}
          <div className="card card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Storage Zones ({wh.zones?.length || 0})</h3>
              <button className="btn btn-secondary btn-sm" onClick={handleOpenAddZone}>
                <Plus size={14} style={{ marginRight: 4 }} /> Add Zone
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(wh.zones ?? []).map((zone) => {
                const pct = zone.capacity > 0 ? (zone.current_load / zone.capacity) * 100 : 0
                const col = zoneTypeColor(zone.zone_type)
                return (
                  <div key={zone.id} style={{ padding: '16px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: 2 }}>{zone.zone_name}</div>
                        <div className="font-mono text-xs" style={{ color: col }}>{zone.zone_code} · {zone.zone_type.replace('_', ' ')}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: pct >= 85 ? 'var(--color-danger)' : pct >= 70 ? 'var(--color-warning)' : 'var(--color-success)' }}>{pct.toFixed(1)}%</div>
                          <div className="text-xs text-muted">{zone.current_load.toLocaleString()} / {zone.capacity.toLocaleString()} sqft</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Edit Zone"
                            onClick={() => handleOpenEditZone(zone)}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm text-danger"
                            title="Delete Zone"
                            onClick={() => handleDeleteZone(zone.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: col, borderRadius: '9999px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    </div>
                    {zone.temperature_celsius !== undefined && (
                      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                        <span className="text-xs text-muted"><Thermometer size={11} style={{ display: 'inline', marginRight: 3 }} />{zone.temperature_celsius}°C</span>
                        {zone.humidity_percentage && <span className="text-xs text-muted">💧 {zone.humidity_percentage}% RH</span>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card card-body">
            <h4 className="mb-4">Facility Details</h4>
            {[
              { label: 'CODE', value: wh.warehouse_code },
              { label: 'STATUS', value: <span className={`badge ${wh.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}><span className="badge-dot success" />{wh.status}</span> },
              { label: 'CITY', value: `${wh.city}, ${wh.state}` },
              { label: 'COUNTRY', value: wh.country },
              { label: 'CAPACITY', value: `${wh.total_capacity.toLocaleString()} sqft` },
              { label: 'UTILIZATION', value: `${utilPct.toFixed(1)}%` },
              { label: 'CONTACT', value: wh.contact_phone ?? '—' },
              { label: 'EMAIL', value: <span className="text-accent">{wh.contact_email ?? '—'}</span> },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <span className="text-xs text-muted">{row.label}</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="card card-body">
            <h4 className="mb-4">Amenities</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Cold Storage', 'HazMat Approved', 'Dock Levelers', 'CCTV 360°', 'EV Charging Bays', 'Automation Conveyors', '24/7 Security'].map((a) => (
                <span key={a} className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{a}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Warehouse Modal */}
      {showEditWhModal && (
        <div className="modal-overlay" onClick={() => setShowEditWhModal(false)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Warehouse Facility</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowEditWhModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Warehouse Code</label>
                  <input
                    className="form-input"
                    value={editWhForm.warehouse_code || ''}
                    onChange={e => setEditWhForm(p => ({ ...p, warehouse_code: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={editWhForm.status || 'ACTIVE'}
                    onChange={e => setEditWhForm(p => ({ ...p, status: e.target.value }))}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Facility Name</label>
                <input
                  className="form-input"
                  value={editWhForm.name || ''}
                  onChange={e => setEditWhForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="form-grid form-grid-3">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    className="form-input"
                    value={editWhForm.city || ''}
                    onChange={e => setEditWhForm(p => ({ ...p, city: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    className="form-input"
                    value={editWhForm.state || ''}
                    onChange={e => setEditWhForm(p => ({ ...p, state: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    className="form-input"
                    value={editWhForm.country || ''}
                    onChange={e => setEditWhForm(p => ({ ...p, country: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    value={editWhForm.latitude || 0}
                    onChange={e => setEditWhForm(p => ({ ...p, latitude: Number(e.target.value) }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    value={editWhForm.longitude || 0}
                    onChange={e => setEditWhForm(p => ({ ...p, longitude: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Total Capacity (sqft)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editWhForm.total_capacity || 0}
                  onChange={e => setEditWhForm(p => ({ ...p, total_capacity: Number(e.target.value) }))}
                />
              </div>

              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    className="form-input"
                    value={editWhForm.contact_phone || ''}
                    onChange={e => setEditWhForm(p => ({ ...p, contact_phone: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input
                    className="form-input"
                    value={editWhForm.contact_email || ''}
                    onChange={e => setEditWhForm(p => ({ ...p, contact_email: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEditWhModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveWarehouse}>
                <Save size={14} style={{ marginRight: 6 }} /> Save Facility Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Zone Modal */}
      {showZoneModal && (
        <div className="modal-overlay" onClick={() => setShowZoneModal(false)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingZone ? 'Edit Storage Zone' : 'Add Storage Zone'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowZoneModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Zone Code</label>
                  <input
                    className="form-input"
                    value={zoneForm.zone_code}
                    onChange={e => setZoneForm(p => ({ ...p, zone_code: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Zone Type</label>
                  <select
                    className="form-select"
                    value={zoneForm.zone_type}
                    onChange={e => setZoneForm(p => ({ ...p, zone_type: e.target.value }))}
                  >
                    <option value="DRY_STORAGE">DRY_STORAGE</option>
                    <option value="COLD_CHAIN">COLD_CHAIN</option>
                    <option value="HAZARDOUS">HAZARDOUS</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Zone Name</label>
                <input
                  className="form-input"
                  value={zoneForm.zone_name}
                  onChange={e => setZoneForm(p => ({ ...p, zone_name: e.target.value }))}
                />
              </div>

              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Capacity (sqft)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={zoneForm.capacity}
                    onChange={e => setZoneForm(p => ({ ...p, capacity: Number(e.target.value) }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Load (sqft)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={zoneForm.current_load}
                    onChange={e => setZoneForm(p => ({ ...p, current_load: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {zoneForm.zone_type === 'COLD_CHAIN' && (
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Target Temp (°C)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={zoneForm.temperature_celsius}
                      onChange={e => setZoneForm(p => ({ ...p, temperature_celsius: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Humidity (% RH)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={zoneForm.humidity_percentage}
                      onChange={e => setZoneForm(p => ({ ...p, humidity_percentage: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowZoneModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveZone}>
                <Save size={14} style={{ marginRight: 6 }} /> {editingZone ? 'Update Zone' : 'Add Zone'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
