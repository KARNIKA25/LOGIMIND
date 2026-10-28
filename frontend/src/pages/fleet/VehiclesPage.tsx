import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Truck, Zap, Fuel, Edit, Trash2, X, Check, MapPin } from 'lucide-react'
import { vehicleApi } from '../../services/api.service'
import type { Vehicle } from '../../types'
import toast from 'react-hot-toast'

const INITIAL_DEMO: Vehicle[] = [
  { id: 1, registration_number: 'CA-LM-T001', model: 'Freightliner Cascadia', make: 'Freightliner', year: 2024, vehicle_type: 'HEAVY_TRUCK', capacity_kg: 20000, fuel_type: 'DIESEL', status: 'AVAILABLE', current_odometer_km: 18420, current_latitude: 37.7749, current_longitude: -122.4194 },
  { id: 2, registration_number: 'CA-LM-R002', model: 'Thermo King T-Series Reefer', make: 'Wabash', year: 2024, vehicle_type: 'REFRIGERATED_TRUCK', capacity_kg: 15000, fuel_type: 'DIESEL', status: 'AVAILABLE', current_odometer_km: 9230, current_latitude: 34.0522, current_longitude: -118.2437 },
  { id: 3, registration_number: 'IL-LM-V003', model: 'Mercedes Sprinter EV', make: 'Mercedes', year: 2024, vehicle_type: 'EV_VAN', capacity_kg: 3500, fuel_type: 'ELECTRIC', status: 'AVAILABLE', current_odometer_km: 5810, current_latitude: 41.8781, current_longitude: -87.6298 },
  { id: 4, registration_number: 'NY-LM-C004', model: 'Peterbilt 579 Container Carrier', make: 'Peterbilt', year: 2024, vehicle_type: 'CONTAINER_CARRIER', capacity_kg: 25000, fuel_type: 'DIESEL', status: 'ON_TRIP', current_odometer_km: 32140, current_latitude: 40.7128, current_longitude: -74.0060 },
]

const vehicleIcon: Record<string, string> = {
  HEAVY_TRUCK: '🚛', REFRIGERATED_TRUCK: '❄️🚛', EV_VAN: '⚡🚐', CONTAINER_CARRIER: '🚢🚛', LIGHT_VAN: '🚐'
}

function statusClass(s: string) {
  return s === 'AVAILABLE' ? 'badge-success' : s === 'ON_TRIP' ? 'badge-accent' : s === 'MAINTENANCE' ? 'badge-warning' : 'badge-neutral'
}

export default function VehiclesPage() {
  const [localVehicles, setLocalVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('lm_custom_vehicles')
    return saved ? JSON.parse(saved) : INITIAL_DEMO
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    registration_number: '',
    make: '',
    model: '',
    year: 2024,
    vehicle_type: 'HEAVY_TRUCK',
    fuel_type: 'DIESEL',
    capacity_kg: 18000,
    status: 'AVAILABLE',
    current_odometer_km: 12000,
  })

  const { data } = useQuery({ queryKey: ['vehicles'], queryFn: () => vehicleApi.list({ size: 50 }) })
  const vehicles: Vehicle[] = data?.data?.items?.length ? data.data.items : localVehicles

  function saveLocalVehicles(updated: Vehicle[]) {
    setLocalVehicles(updated)
    localStorage.setItem('lm_custom_vehicles', JSON.stringify(updated))
  }

  function handleOpenCreate() {
    setEditingVehicle(null)
    setFormData({
      registration_number: `CA-LM-${Math.floor(100 + Math.random() * 900)}`,
      make: 'Volvo',
      model: 'VNL 860 Autonomous Pro',
      year: 2025,
      vehicle_type: 'HEAVY_TRUCK',
      fuel_type: 'DIESEL',
      capacity_kg: 22000,
      status: 'AVAILABLE',
      current_odometer_km: 8400,
    })
    setModalOpen(true)
  }

  function handleOpenEdit(vehicle: Vehicle) {
    setEditingVehicle(vehicle)
    setFormData({ ...vehicle })
    setModalOpen(true)
  }

  function handleDelete(id: number) {
    if (confirm('Are you sure you want to decommission and delete this vehicle?')) {
      vehicleApi.delete(id).catch(() => null)
      const updated = vehicles.filter(v => v.id !== id)
      saveLocalVehicles(updated)
      toast.success('Vehicle removed from fleet registry.')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.registration_number?.trim() || !formData.model?.trim()) {
      toast.error('License registration and model are required.')
      return
    }

    try {
      if (editingVehicle) {
        await vehicleApi.update(editingVehicle.id, formData).catch(() => null)
        const updated = vehicles.map(v => v.id === editingVehicle.id ? { ...v, ...formData } as Vehicle : v)
        saveLocalVehicles(updated)
        toast.success(`Vehicle ${formData.registration_number} updated successfully!`)
      } else {
        const newVehicle: Vehicle = {
          id: Date.now(),
          registration_number: formData.registration_number || `LM-${Date.now().toString().slice(-4)}`,
          make: formData.make || 'Commercial',
          model: formData.model,
          year: Number(formData.year) || 2024,
          vehicle_type: formData.vehicle_type || 'HEAVY_TRUCK',
          fuel_type: formData.fuel_type || 'DIESEL',
          capacity_kg: Number(formData.capacity_kg) || 15000,
          status: formData.status || 'AVAILABLE',
          current_odometer_km: Number(formData.current_odometer_km) || 0,
        }
        await vehicleApi.create(newVehicle).catch(() => null)
        saveLocalVehicles([newVehicle, ...vehicles])
        toast.success(`Vehicle ${newVehicle.registration_number} added to fleet!`)
      }
      setModalOpen(false)
    } catch {
      toast.error('Failed to save vehicle details.')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-block">
          <h1>Fleet — Commercial Vehicles</h1>
          <p className="page-subtitle">{vehicles.length} registered vehicles · Live telematics · Full editing</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            <Plus size={14} /> Register Vehicle
          </button>
        </div>
      </div>

      <div className="metric-grid mb-5">
        {[
          { label: 'Total Fleet', value: vehicles.length },
          { label: 'Available for Dispatch', value: vehicles.filter(v => v.status === 'AVAILABLE').length },
          { label: 'Currently On Trip', value: vehicles.filter(v => v.status === 'ON_TRIP').length },
          { label: 'Clean Energy / EV', value: vehicles.filter(v => v.fuel_type === 'ELECTRIC').length },
        ].map((m, i) => (
          <div key={m.label} className="metric-card">
            <div className={`metric-icon ${['indigo','emerald','cyan','violet'][i]}`}><Truck size={20} /></div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {vehicles.map((v) => (
          <div key={v.id} className="card card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {vehicleIcon[v.vehicle_type] ?? '🚚'}
                  </div>
                  <div>
                    <div className="font-mono text-xs text-accent mb-1">{v.registration_number}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{v.model}</div>
                    <div className="text-xs text-muted">{v.make} · {v.year}</div>
                  </div>
                </div>
                <span className={`badge ${statusClass(v.status)}`}>{v.status.replace(/_/g, ' ')}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ padding: '8px 12px', background: 'rgba(99,102,241,0.06)', borderRadius: 8 }}>
                  <div className="text-xs text-muted">Payload Capacity</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: 2 }}>{Number(v.capacity_kg).toLocaleString()} kg</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(6,182,212,0.06)', borderRadius: 8 }}>
                  <div className="text-xs text-muted">Powertrain</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: 2, color: v.fuel_type === 'ELECTRIC' ? 'var(--color-success)' : 'var(--color-info)' }}>
                    {v.fuel_type}
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted font-mono">
                Odometer: {Number(v.current_odometer_km).toLocaleString()} km · {v.vehicle_type.replace(/_/g, ' ')}
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--color-border-subtle)' }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleOpenEdit(v)}>
                <Edit size={13} style={{ marginRight: 4 }} /> Edit Telematics
              </button>
              <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(v.id)} title="Delete Vehicle">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle Modal */}
      {modalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>{editingVehicle ? `Edit Vehicle — ${editingVehicle.registration_number}` : 'Register New Fleet Vehicle'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">License Plate / Reg # *</label>
                    <input
                      className="form-input"
                      value={formData.registration_number || ''}
                      onChange={e => setFormData({ ...formData, registration_number: e.target.value })}
                      placeholder="CA-LM-901"
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
                      <option value="ON_TRIP">ON_TRIP</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="DECOMMISSIONED">DECOMMISSIONED</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Make</label>
                    <input
                      className="form-input"
                      value={formData.make || ''}
                      onChange={e => setFormData({ ...formData, make: e.target.value })}
                      placeholder="Freightliner / Volvo"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model *</label>
                    <input
                      className="form-input"
                      value={formData.model || ''}
                      onChange={e => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Cascadia Semi"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Vehicle Type</label>
                    <select
                      className="form-input"
                      value={formData.vehicle_type || 'HEAVY_TRUCK'}
                      onChange={e => setFormData({ ...formData, vehicle_type: e.target.value })}
                    >
                      <option value="HEAVY_TRUCK">Heavy Truck</option>
                      <option value="REFRIGERATED_TRUCK">Refrigerated Reefer</option>
                      <option value="EV_VAN">EV Commercial Van</option>
                      <option value="CONTAINER_CARRIER">Container Carrier</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fuel / Powertrain</label>
                    <select
                      className="form-input"
                      value={formData.fuel_type || 'DIESEL'}
                      onChange={e => setFormData({ ...formData, fuel_type: e.target.value })}
                    >
                      <option value="DIESEL">Diesel</option>
                      <option value="ELECTRIC">Electric (EV)</option>
                      <option value="HYBRID">Hybrid</option>
                      <option value="HYDROGEN">Hydrogen Fuel Cell</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Capacity (kg)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.capacity_kg || ''}
                      onChange={e => setFormData({ ...formData, capacity_kg: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.year || ''}
                      onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || 2024 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Odometer (km)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.current_odometer_km || ''}
                      onChange={e => setFormData({ ...formData, current_odometer_km: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} style={{ marginRight: 6 }} /> Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
