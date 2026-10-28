import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Brain, Truck, Clock, AlertTriangle, CheckCircle2, Package, User, RefreshCw, Edit3, Plus, X, Save } from 'lucide-react'
import { shipmentApi } from '../../services/api.service'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import LeafletMap, { MapMarkerItem } from '../../components/common/LeafletMap'

interface ShipmentEvent {
  id: number
  shipment_id: number
  status: string
  location_name: string
  event_details: string
  timestamp: string
  latitude?: number
  longitude?: number
}

interface ShipmentData {
  id: number
  tracking_number: string
  recipient_name: string
  recipient_phone?: string
  destination_address: string
  status: 'PENDING' | 'CREATED' | 'DISPATCHED' | 'IN_TRANSIT' | 'AT_HUB' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED_DELIVERY' | 'CANCELLED' | string
  priority: 'STANDARD' | 'EXPRESS' | 'URGENT' | string
  total_weight_kg: number
  total_volume_cbm: number
  ai_risk_score?: number
  ai_predicted_delay_mins?: number
  ai_recommendation?: string
  current_latitude?: number
  current_longitude?: number
  destination_latitude?: number
  destination_longitude?: number
  estimated_delivery_time?: string
  actual_dispatch_time?: string
  created_at?: string
  cargo_description?: string
  events: ShipmentEvent[]
}

const DEMO_SHIPMENT: ShipmentData = {
  id: 1,
  tracking_number: 'LM-20261003-SF001',
  recipient_name: 'Manhattan Distribution Center',
  recipient_phone: '+1-212-555-9001',
  destination_address: '245 West 34th Street, New York, NY 10001',
  status: 'IN_TRANSIT',
  priority: 'EXPRESS',
  total_weight_kg: 1850,
  total_volume_cbm: 2.98,
  ai_risk_score: 0.06,
  ai_predicted_delay_mins: 0,
  ai_recommendation: 'Route corridor verified — I-80 East clear. Proceed at standard speed.',
  current_latitude: 40.2,
  current_longitude: -76.8,
  destination_latitude: 40.7484,
  destination_longitude: -73.9967,
  estimated_delivery_time: '2026-10-06T16:00:00Z',
  actual_dispatch_time: '2026-10-03T09:30:00Z',
  created_at: '2026-10-03T08:00:00Z',
  cargo_description: 'Mixed Industrial & Electronics Freight — LIDAR Sensors + IoT Gateways',
  events: [
    { id: 1, shipment_id: 1, status: 'CREATED', location_name: 'Bay Area Central Logistics Hub — SF', event_details: 'Cargo manifested and consignment initiated.', timestamp: '2026-10-03T08:00:00Z' },
    { id: 2, shipment_id: 1, status: 'DISPATCHED', location_name: 'Origin Dispatch Bay — Gate Exit', event_details: 'Vehicle loaded and dispatched through security gate.', timestamp: '2026-10-03T09:30:00Z' },
    { id: 3, shipment_id: 1, status: 'IN_TRANSIT', location_name: 'I-80 East — Pennsylvania Corridor', event_details: 'IoT telematics ping — en route, no exceptions.', timestamp: '2026-10-03T14:15:00Z', latitude: 40.4406, longitude: -79.9959 },
  ],
}

export default function ShipmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const storageKey = `lm_shipment_override_${id}`
  const savedData = (() => {
    try {
      const item = localStorage.getItem(storageKey)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  })()

  const [localShipment, setLocalShipment] = useState<ShipmentData>(savedData || DEMO_SHIPMENT)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState<Partial<ShipmentData>>(localShipment)

  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusForm, setStatusForm] = useState({
    status: localShipment.status,
    location_name: '',
    event_details: '',
  })

  const [showEventModal, setShowEventModal] = useState(false)
  const [eventForm, setEventForm] = useState({
    status: 'IN_TRANSIT',
    location_name: '',
    event_details: '',
  })

  const { data } = useQuery({
    queryKey: ['shipment', id],
    queryFn: async () => {
      try {
        const res = await shipmentApi.get(Number(id))
        return res.data
      } catch {
        return localShipment
      }
    },
    enabled: !!id && id !== 'new',
  })

  const shipment = localShipment
  const events = shipment.events ?? []

  function handleSaveShipment() {
    const updated: ShipmentData = {
      ...shipment,
      ...editForm,
      total_weight_kg: Number(editForm.total_weight_kg ?? shipment.total_weight_kg),
      total_volume_cbm: Number(editForm.total_volume_cbm ?? shipment.total_volume_cbm),
    }
    setLocalShipment(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    setShowEditModal(false)
    toast.success('Shipment details updated successfully')
  }

  function handleApplyStatus(newStatus: string, location = 'Operations Checkpoint', details = 'Status updated by operator') {
    const newEvent: ShipmentEvent = {
      id: (shipment.events?.length || 0) + 1,
      shipment_id: shipment.id,
      status: newStatus,
      location_name: location,
      event_details: details,
      timestamp: new Date().toISOString(),
      latitude: shipment.current_latitude,
      longitude: shipment.current_longitude,
    }

    const updated: ShipmentData = {
      ...shipment,
      status: newStatus,
      events: [...(shipment.events || []), newEvent],
    }

    setLocalShipment(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    setShowStatusModal(false)
    toast.success(`Shipment marked as ${newStatus.replace(/_/g, ' ')}`)
  }

  function handleAddManualEvent() {
    if (!eventForm.location_name.trim()) {
      toast.error('Location is required')
      return
    }

    const newEvent: ShipmentEvent = {
      id: (shipment.events?.length || 0) + 1,
      shipment_id: shipment.id,
      status: eventForm.status,
      location_name: eventForm.location_name,
      event_details: eventForm.event_details || 'Manual telematics event logged',
      timestamp: new Date().toISOString(),
    }

    const updated: ShipmentData = {
      ...shipment,
      events: [...(shipment.events || []), newEvent],
    }

    setLocalShipment(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    setShowEventModal(false)
    toast.success('Timeline event logged successfully')
  }

  const riskScore = shipment.ai_risk_score ?? 0
  const riskLabel = riskScore > 0.3 ? 'HIGH RISK' : riskScore > 0.15 ? 'MEDIUM RISK' : 'LOW RISK'
  const riskColor = riskScore > 0.3 ? 'var(--color-danger)' : riskScore > 0.15 ? 'var(--color-warning)' : 'var(--color-success)'

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/shipments')} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem' }}>{shipment.tracking_number}</h1>
            <p className="page-subtitle">{shipment.cargo_description}</p>
          </div>
        </div>
        <div className="page-actions">
          <span className={`badge ${riskScore > 0.3 ? 'badge-danger' : riskScore > 0.15 ? 'badge-warning' : 'badge-success'}`}>
            <Brain size={12} /> {riskLabel}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setEditForm(shipment)
              setShowEditModal(true)
            }}
          >
            <Edit3 size={14} style={{ marginRight: 4 }} /> Edit Shipment
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setStatusForm({
                status: shipment.status,
                location_name: 'Current Transit Checkpoint',
                event_details: 'Status progression recorded in logistics log.',
              })
              setShowStatusModal(true)
            }}
          >
            Update Status
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Status & Key Info */}
          <div className="card card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {[
                { label: 'Status', value: <span className={`badge badge-accent`}><span className="badge-dot accent" />{shipment.status.replace(/_/g, ' ')}</span> },
                { label: 'Priority', value: <span className="badge badge-danger">{shipment.priority}</span> },
                { label: 'Weight', value: `${shipment.total_weight_kg?.toFixed(1)} kg` },
                { label: 'Volume', value: `${shipment.total_volume_cbm?.toFixed(2)} m³` },
                { label: 'Dispatched', value: shipment.actual_dispatch_time ? format(new Date(shipment.actual_dispatch_time), 'MMM dd, HH:mm') : '—' },
                { label: 'Est. Delivery', value: shipment.estimated_delivery_time ? format(new Date(shipment.estimated_delivery_time), 'MMM dd, HH:mm') : '—' },
                { label: 'AI Risk Score', value: <span style={{ color: riskColor, fontWeight: 700 }}>{(riskScore * 100).toFixed(1)}%</span> },
                { label: 'Est. Delay', value: shipment.ai_predicted_delay_mins ? `${shipment.ai_predicted_delay_mins} min` : 'On Time' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="metric-label">{item.label}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: 4, color: 'var(--color-text-primary)' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Map */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header"><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={16} color="var(--color-accent-1)" /><h3>Live Tracking Map</h3></div></div>
            <div style={{ height: 380, position: 'relative' }}>
              <LeafletMap
                markers={[
                  ...(shipment.current_latitude && shipment.current_longitude ? [{
                    position: [shipment.current_latitude, shipment.current_longitude] as [number, number],
                    isOrigin: true,
                    title: 'Current Position',
                    popup: `📍 Current Location — ${format(new Date(), 'HH:mm')}`,
                  }] : []),
                  ...(shipment.destination_latitude && shipment.destination_longitude ? [{
                    position: [shipment.destination_latitude, shipment.destination_longitude] as [number, number],
                    isDestination: true,
                    title: 'Destination',
                    popup: `🏁 Destination: ${shipment.destination_address}`,
                  }] : []),
                ]}
                polyline={
                  shipment.current_latitude && shipment.destination_latitude && shipment.current_longitude && shipment.destination_longitude
                    ? [[shipment.current_latitude, shipment.current_longitude], [shipment.destination_latitude, shipment.destination_longitude]]
                    : undefined
                }
                height={380}
                fitBounds={true}
              />
            </div>
          </div>

          {/* AI Recommendation */}
          {shipment.ai_recommendation && (
            <div className="card card-body" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, background: 'var(--color-gradient-primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🧠</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-accent-1)', marginBottom: 4 }}>AI Co-Pilot Recommendation</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{shipment.ai_recommendation}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Recipient */}
          <div className="card card-body">
            <h4 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={16} color="var(--color-accent-1)" /> Recipient</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div className="text-xs text-muted mb-1">NAME</div>
                <div style={{ fontWeight: 600 }}>{shipment.recipient_name}</div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">PHONE</div>
                <div>{shipment.recipient_phone ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">ADDRESS</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{shipment.destination_address}</div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}><Clock size={16} color="var(--color-accent-1)" /> Event Timeline</h4>
              <button
                className="btn btn-ghost btn-xs text-accent"
                onClick={() => {
                  setEventForm({ status: shipment.status, location_name: '', event_details: '' })
                  setShowEventModal(true)
                }}
              >
                <Plus size={12} style={{ marginRight: 2 }} /> Add Event
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              {events.map((event, i) => (
                <div key={event.id} style={{ display: 'flex', gap: 12, paddingBottom: i < events.length - 1 ? 20 : 0, position: 'relative' }}>
                  {/* Connector */}
                  {i < events.length - 1 && (
                    <div style={{ position: 'absolute', left: 11, top: 24, bottom: 0, width: 2, background: 'rgba(99,102,241,0.2)' }} />
                  )}
                  {/* Dot */}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                    background: i === events.length - 1 ? 'var(--color-gradient-primary)' : 'rgba(99,102,241,0.15)',
                    border: '2px solid rgba(99,102,241,0.4)',
                    boxShadow: i === events.length - 1 ? 'var(--shadow-glow)' : 'none',
                  }}>
                    {i === events.length - 1 ? '●' : '○'}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text-primary)', marginBottom: 2 }}>{event.status.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{event.location_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>{event.event_details}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{format(new Date(event.timestamp), 'MMM dd, HH:mm:ss')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card card-body">
            <h4 className="mb-4">Quick Status Updates</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Mark as At Hub', status: 'AT_HUB', cls: 'btn-secondary' },
                { label: 'Mark Out for Delivery', status: 'OUT_FOR_DELIVERY', cls: 'btn-secondary' },
                { label: 'Mark Delivered', status: 'DELIVERED', cls: 'btn-success' },
                { label: 'Report Failed Delivery', status: 'FAILED_DELIVERY', cls: 'btn-danger' },
              ].map((action) => (
                <button
                  key={action.status}
                  className={`btn ${action.cls} btn-sm w-full`}
                  onClick={() => handleApplyStatus(action.status, 'Automated Hub Scan', `Shipment transitioned to ${action.status}`)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Shipment Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Shipment Consignment</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowEditModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Tracking Number</label>
                  <input
                    className="form-input"
                    value={editForm.tracking_number || ''}
                    onChange={e => setEditForm(p => ({ ...p, tracking_number: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={editForm.priority || 'STANDARD'}
                    onChange={e => setEditForm(p => ({ ...p, priority: e.target.value }))}
                  >
                    <option value="STANDARD">STANDARD</option>
                    <option value="EXPRESS">EXPRESS</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cargo Description</label>
                <input
                  className="form-input"
                  value={editForm.cargo_description || ''}
                  onChange={e => setEditForm(p => ({ ...p, cargo_description: e.target.value }))}
                />
              </div>

              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Recipient Name</label>
                  <input
                    className="form-input"
                    value={editForm.recipient_name || ''}
                    onChange={e => setEditForm(p => ({ ...p, recipient_name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Recipient Phone</label>
                  <input
                    className="form-input"
                    value={editForm.recipient_phone || ''}
                    onChange={e => setEditForm(p => ({ ...p, recipient_phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Destination Address</label>
                <input
                  className="form-input"
                  value={editForm.destination_address || ''}
                  onChange={e => setEditForm(p => ({ ...p, destination_address: e.target.value }))}
                />
              </div>

              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.total_weight_kg || 0}
                    onChange={e => setEditForm(p => ({ ...p, total_weight_kg: Number(e.target.value) }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Volume (m³)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={editForm.total_volume_cbm || 0}
                    onChange={e => setEditForm(p => ({ ...p, total_volume_cbm: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveShipment}>
                <Save size={14} style={{ marginRight: 6 }} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Shipment Status</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowStatusModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Target Status</label>
                <select
                  className="form-select"
                  value={statusForm.status}
                  onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))}
                >
                  <option value="CREATED">CREATED</option>
                  <option value="DISPATCHED">DISPATCHED</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="AT_HUB">AT_HUB</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="FAILED_DELIVERY">FAILED_DELIVERY</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Location / Hub Name</label>
                <input
                  className="form-input"
                  value={statusForm.location_name}
                  onChange={e => setStatusForm(p => ({ ...p, location_name: e.target.value }))}
                  placeholder="e.g., Regional Sorting Facility Gate 4"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Operator Note / Remarks</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={statusForm.event_details}
                  onChange={e => setStatusForm(p => ({ ...p, event_details: e.target.value }))}
                  placeholder="Details regarding this status transition..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleApplyStatus(statusForm.status, statusForm.location_name || 'Checkpoint', statusForm.event_details || 'Status updated')}
              >
                <Save size={14} style={{ marginRight: 6 }} /> Apply Status Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Timeline Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Milestone Event</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowEventModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Event Status Tag</label>
                <select
                  className="form-select"
                  value={eventForm.status}
                  onChange={e => setEventForm(p => ({ ...p, status: e.target.value }))}
                >
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="AT_HUB">AT_HUB</option>
                  <option value="SECURITY_CHECK">SECURITY_CHECK</option>
                  <option value="CUSTOMS_CLEARED">CUSTOMS_CLEARED</option>
                  <option value="WEATHER_HOLD">WEATHER_HOLD</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  className="form-input"
                  value={eventForm.location_name}
                  onChange={e => setEventForm(p => ({ ...p, location_name: e.target.value }))}
                  placeholder="e.g. Weigh Station #4, Nevada Highway 80"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Event Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={eventForm.event_details}
                  onChange={e => setEventForm(p => ({ ...p, event_details: e.target.value }))}
                  placeholder="Log details, inspection sign-off, or telematics ping..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEventModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleAddManualEvent}>
                <Save size={14} style={{ marginRight: 6 }} /> Append Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
