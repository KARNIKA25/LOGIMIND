import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, ShoppingCart, Check, X, Clock, Edit, Trash2, CheckCircle2 } from 'lucide-react'
import { purchaseOrderApi } from '../../services/api.service'
import { format } from 'date-fns'
import type { PurchaseOrder } from '../../types'
import toast from 'react-hot-toast'

const INITIAL_DEMO: PurchaseOrder[] = [
  { id: 1, po_number: 'PO-2026-001', supplier_id: 1, warehouse_id: 1, status: 'PENDING_APPROVAL', priority: 'HIGH', total_amount: 48999.50, currency: 'USD', expected_delivery_date: '2026-10-15', created_at: '2026-10-03T08:00:00Z' },
  { id: 2, po_number: 'PO-2026-002', supplier_id: 2, warehouse_id: 2, status: 'APPROVED', priority: 'NORMAL', total_amount: 22000.00, currency: 'USD', expected_delivery_date: '2026-10-20', created_at: '2026-10-02T10:00:00Z' },
  { id: 3, po_number: 'PO-2026-003', supplier_id: 3, warehouse_id: 3, status: 'IN_TRANSIT', priority: 'URGENT', total_amount: 67450.00, currency: 'USD', expected_delivery_date: '2026-10-10', created_at: '2026-09-28T12:00:00Z' },
  { id: 4, po_number: 'PO-2026-004', supplier_id: 4, warehouse_id: 4, status: 'DELIVERED', priority: 'NORMAL', total_amount: 14280.00, currency: 'USD', expected_delivery_date: '2026-10-01', created_at: '2026-09-20T09:00:00Z' },
]

function statusBadge(s: string) {
  const m: Record<string, string> = { PENDING_APPROVAL: 'badge-warning', APPROVED: 'badge-info', IN_TRANSIT: 'badge-accent', DELIVERED: 'badge-success', CANCELLED: 'badge-neutral', REJECTED: 'badge-danger' }
  return m[s] ?? 'badge-neutral'
}
function priorityBadge(p: string) {
  const m: Record<string, string> = { URGENT: 'badge-danger', HIGH: 'badge-warning', NORMAL: 'badge-neutral', LOW: 'badge-neutral' }
  return m[p] ?? 'badge-neutral'
}

export default function PurchaseOrdersPage() {
  const [localOrders, setLocalOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('lm_custom_pos')
    return saved ? JSON.parse(saved) : INITIAL_DEMO
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<PurchaseOrder>>({
    po_number: '',
    supplier_id: 1,
    warehouse_id: 1,
    status: 'PENDING_APPROVAL',
    priority: 'HIGH',
    total_amount: 25000,
    currency: 'USD',
    expected_delivery_date: '2026-10-25',
  })

  const { data } = useQuery({ queryKey: ['purchase-orders'], queryFn: () => purchaseOrderApi.list({ size: 50 }) })
  const orders: PurchaseOrder[] = data?.data?.items?.length ? data.data.items : localOrders
  const totalValue = orders.reduce((a, o) => a + (Number(o.total_amount) || 0), 0)

  function saveLocalOrders(updated: PurchaseOrder[]) {
    setLocalOrders(updated)
    localStorage.setItem('lm_custom_pos', JSON.stringify(updated))
  }

  function handleOpenCreate() {
    setFormData({
      po_number: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
      supplier_id: 1,
      warehouse_id: 1,
      status: 'PENDING_APPROVAL',
      priority: 'HIGH',
      total_amount: 32500,
      currency: 'USD',
      expected_delivery_date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    })
    setModalOpen(true)
  }

  function handleUpdateStatus(id: number, newStatus: string) {
    const updated = orders.map(o => o.id === id ? { ...o, status: newStatus as any } : o)
    saveLocalOrders(updated)
    toast.success(`Purchase order status updated to ${newStatus.replace(/_/g, ' ')}!`)
  }

  function handleDelete(id: number) {
    if (confirm('Are you sure you want to cancel and remove this purchase order?')) {
      const updated = orders.filter(o => o.id !== id)
      saveLocalOrders(updated)
      toast.success('Purchase order removed.')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const newPO: PurchaseOrder = {
      id: Date.now(),
      po_number: formData.po_number || `PO-${Date.now().toString().slice(-4)}`,
      supplier_id: Number(formData.supplier_id) || 1,
      warehouse_id: Number(formData.warehouse_id) || 1,
      status: formData.status || 'PENDING_APPROVAL',
      priority: formData.priority || 'HIGH',
      total_amount: Number(formData.total_amount) || 0,
      currency: 'USD',
      expected_delivery_date: formData.expected_delivery_date || '2026-10-30',
      created_at: new Date().toISOString(),
    }

    await purchaseOrderApi.create(newPO).catch(() => null)
    saveLocalOrders([newPO, ...orders])
    toast.success(`Purchase Order ${newPO.po_number} created successfully!`)
    setModalOpen(false)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-block">
          <h1>Purchase Orders & Procurement</h1>
          <p className="page-subtitle">{orders.length} orders · ${(totalValue / 1000).toFixed(1)}K total value · Full management</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            <Plus size={14} /> Create PO
          </button>
        </div>
      </div>

      <div className="metric-grid mb-5">
        {[
          { label: 'Pending Approval', value: orders.filter(o => o.status === 'PENDING_APPROVAL').length, cls: 'amber' },
          { label: 'In Transit', value: orders.filter(o => o.status === 'IN_TRANSIT').length, cls: 'cyan' },
          { label: 'Delivered / Stocked', value: orders.filter(o => o.status === 'DELIVERED').length, cls: 'emerald' },
          { label: 'Total PO Value', value: `$${(totalValue / 1000).toFixed(1)}K`, cls: 'indigo' },
        ].map((m) => (
          <div key={m.label} className="metric-card">
            <div className={`metric-icon ${m.cls}`}><ShoppingCart size={20} /></div>
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
                <th>PO Number</th>
                <th>Supplier Ref</th>
                <th>Target Facility</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Total Value</th>
                <th>Delivery Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><span className="font-mono text-accent" style={{ fontWeight: 700 }}>{o.po_number}</span></td>
                  <td className="font-mono text-sm">Supplier #{o.supplier_id}</td>
                  <td className="text-sm text-secondary">Warehouse #{o.warehouse_id}</td>
                  <td><span className={`badge ${statusBadge(o.status)}`}>{o.status.replace(/_/g, ' ')}</span></td>
                  <td><span className={`badge ${priorityBadge(o.priority)}`}>{o.priority}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--color-accent-1)' }}>${Number(o.total_amount).toLocaleString()}</td>
                  <td className="text-sm text-muted">{o.expected_delivery_date}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {o.status === 'PENDING_APPROVAL' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(o.id, 'APPROVED')} title="Approve Order">
                          <Check size={13} style={{ marginRight: 4 }} /> Approve
                        </button>
                      )}
                      {o.status === 'APPROVED' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateStatus(o.id, 'IN_TRANSIT')} title="Dispatch Shipment">
                          Dispatch
                        </button>
                      )}
                      {o.status === 'IN_TRANSIT' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateStatus(o.id, 'DELIVERED')} title="Confirm Delivery & Stock">
                          <CheckCircle2 size={13} style={{ marginRight: 4 }} /> Receive
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(o.id)} title="Delete PO">
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

      {/* Create PO Modal */}
      {modalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Create Purchase Order</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">PO Number</label>
                    <input
                      className="form-input"
                      value={formData.po_number || ''}
                      onChange={e => setFormData({ ...formData, po_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-input"
                      value={formData.priority || 'HIGH'}
                      onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                    >
                      <option value="URGENT">URGENT</option>
                      <option value="HIGH">HIGH</option>
                      <option value="NORMAL">NORMAL</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Target Warehouse</label>
                    <select
                      className="form-input"
                      value={formData.warehouse_id}
                      onChange={e => setFormData({ ...formData, warehouse_id: Number(e.target.value) })}
                    >
                      <option value={1}>Bay Area Central Hub (#1)</option>
                      <option value={2}>Pacific Coast Port Hub (#2)</option>
                      <option value={3}>Midwest Cold Chain (#3)</option>
                      <option value={4}>Eastern Gateway Megahub (#4)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supplier Partner</label>
                    <select
                      className="form-input"
                      value={formData.supplier_id}
                      onChange={e => setFormData({ ...formData, supplier_id: Number(e.target.value) })}
                    >
                      <option value={1}>Apex Precision Technologies (#1)</option>
                      <option value={2}>Nordic Thermal Components (#2)</option>
                      <option value={3}>Global TransLogistics Freight (#3)</option>
                      <option value={4}>Pacific Industrial Hardware (#4)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Total Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.total_amount || ''}
                      onChange={e => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expected Delivery Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.expected_delivery_date || ''}
                      onChange={e => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} style={{ marginRight: 6 }} /> Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
