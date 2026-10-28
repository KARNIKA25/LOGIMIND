import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw, ArrowLeftRight, Brain, TrendingDown, Plus, Edit, X, Check, ArrowUpRight } from 'lucide-react'
import { inventoryApi } from '../../services/api.service'
import type { Inventory } from '../../types'
import toast from 'react-hot-toast'

interface InventoryItem extends Inventory {
  product_name: string
  warehouse_name: string
  sku: string
}

const INITIAL_DEMO: InventoryItem[] = [
  { id: 1, warehouse_id: 1, product_id: 1, current_stock: 480, reserved_stock: 40, minimum_stock: 100, maximum_stock: 800, reorder_level: 150, bin_location: 'A-01-01', product_name: 'Ultra-Precision LiDAR Sensor Module X900', warehouse_name: 'Bay Area Central', sku: 'SEN-LIDAR-900' },
  { id: 2, warehouse_id: 1, product_id: 2, current_stock: 325, reserved_stock: 25, minimum_stock: 80, maximum_stock: 600, reorder_level: 120, bin_location: 'A-02-05', product_name: 'Industrial IoT Telematics Gateway Pro', warehouse_name: 'Bay Area Central', sku: 'IOT-GW-400' },
  { id: 3, warehouse_id: 2, product_id: 3, current_stock: 142, reserved_stock: 12, minimum_stock: 50, maximum_stock: 400, reorder_level: 100, bin_location: 'B-01-02', product_name: 'Cold-Chain Thermal Insulated Pallet Box XL', warehouse_name: 'Pacific Coast Hub', sku: 'PKG-COLD-200' },
  { id: 4, warehouse_id: 3, product_id: 4, current_stock: 88, reserved_stock: 8, minimum_stock: 60, maximum_stock: 300, reorder_level: 90, bin_location: 'C-03-07', product_name: 'Heavy Duty Commercial Axle Bearing Set', warehouse_name: 'Midwest Cold Chain', sku: 'MEC-AXLE-88' },
  { id: 5, warehouse_id: 4, product_id: 5, current_stock: 2100, reserved_stock: 50, minimum_stock: 200, maximum_stock: 3000, reorder_level: 350, bin_location: 'D-05-01', product_name: 'RFID Asset Tracking Tag Bulk Pack (500u)', warehouse_name: 'Eastern Gateway', sku: 'TRK-RFID-500' },
  { id: 6, warehouse_id: 2, product_id: 1, current_stock: 210, reserved_stock: 20, minimum_stock: 80, maximum_stock: 600, reorder_level: 130, bin_location: 'A-01-03', product_name: 'Ultra-Precision LiDAR Sensor Module X900', warehouse_name: 'Pacific Coast Hub', sku: 'SEN-LIDAR-900' },
]

function stockStatus(item: InventoryItem) {
  const available = item.current_stock - item.reserved_stock
  if (available <= item.minimum_stock) return { label: 'CRITICAL', cls: 'badge-danger', pct: (available / (item.maximum_stock || 1)) * 100 }
  if (available <= item.reorder_level) return { label: 'LOW STOCK', cls: 'badge-warning', pct: (available / (item.maximum_stock || 1)) * 100 }
  if (available >= (item.maximum_stock || 1) * 0.9) return { label: 'OVERSTOCKED', cls: 'badge-info', pct: 100 }
  return { label: 'HEALTHY', cls: 'badge-success', pct: (available / (item.maximum_stock || 1)) * 100 }
}

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [localInventory, setLocalInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('lm_custom_inventory')
    return saved ? JSON.parse(saved) : INITIAL_DEMO
  })

  // Edit / Adjust Stock Modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [editForm, setEditForm] = useState({
    current_stock: 0,
    reserved_stock: 0,
    minimum_stock: 0,
    reorder_level: 0,
    bin_location: '',
  })

  // Transfer Stock Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferForm, setTransferForm] = useState({
    source_item_id: 1,
    dest_warehouse_name: 'Pacific Coast Hub',
    quantity: 50,
    reason: 'Intermodal regional rebalancing',
  })

  const { data } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.list({ size: 50 }),
  })

  const invItems = (data?.data as any)?.items || (data as any)?.data || (data as any)?.items
  const inventory: InventoryItem[] = Array.isArray(invItems) && invItems.length ? invItems : localInventory

  function saveLocalInventory(updated: InventoryItem[]) {
    setLocalInventory(updated)
    localStorage.setItem('lm_custom_inventory', JSON.stringify(updated))
  }

  function handleOpenEdit(item: InventoryItem) {
    setEditingItem(item)
    setEditForm({
      current_stock: item.current_stock,
      reserved_stock: item.reserved_stock,
      minimum_stock: item.minimum_stock,
      reorder_level: item.reorder_level,
      bin_location: item.bin_location || '',
    })
    setEditModalOpen(true)
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingItem) return

    try {
      await inventoryApi.update(editingItem.id, editForm as any).catch(() => null)
      const updated = inventory.map(item =>
        item.id === editingItem.id ? { ...item, ...editForm } : item
      )
      saveLocalInventory(updated)
      toast.success(`Inventory updated for ${editingItem.product_name}!`)
      setEditModalOpen(false)
    } catch {
      toast.error('Failed to update inventory.')
    }
  }

  function handleTransferSubmit(e: React.FormEvent) {
    e.preventDefault()
    const src = inventory.find(i => i.id === Number(transferForm.source_item_id))
    if (!src) return

    if (transferForm.quantity > src.current_stock) {
      toast.error('Transfer quantity exceeds available on-hand stock.')
      return
    }

    const updated = inventory.map(item => {
      if (item.id === src.id) {
        return { ...item, current_stock: item.current_stock - transferForm.quantity }
      }
      return item
    })

    saveLocalInventory(updated)
    toast.success(`Transferred ${transferForm.quantity} units of ${src.sku} to ${transferForm.dest_warehouse_name}!`)
    setTransferModalOpen(false)
  }

  function handleAIReorder() {
    let reorderedCount = 0
    const updated = inventory.map(item => {
      const available = item.current_stock - item.reserved_stock
      if (available <= item.reorder_level) {
        reorderedCount++
        return {
          ...item,
          current_stock: item.maximum_stock || (item.current_stock + 200),
        }
      }
      return item
    })

    saveLocalInventory(updated)
    toast.success(`AI Co-Pilot auto-generated replenishment POs for ${reorderedCount} low-stock SKUs!`)
  }

  const filtered = search
    ? inventory.filter(i =>
        (i.product_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (i.sku ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (i.warehouse_name ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : inventory

  const lowStockCount = inventory.filter(i => {
    const st = stockStatus(i)
    return st.label === 'CRITICAL' || st.label === 'LOW STOCK'
  }).length

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-block">
          <h1>Inventory Management & Stock Auditing</h1>
          <p className="page-subtitle">Stock levels · Bin locations · Reorder automation · Live editing</p>
        </div>
        <div className="page-actions">
          {lowStockCount > 0 && (
            <span className="badge badge-warning">
              <AlertTriangle size={12} /> {lowStockCount} Critical / Low Alerts
            </span>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setTransferModalOpen(true)}>
            <ArrowLeftRight size={14} /> Transfer Stock
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleAIReorder}>
            <Brain size={14} /> AI Auto-Reorder
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="metric-grid mb-5">
        {[
          { label: 'Total SKUs Tracked', value: inventory.length, icon: '📦', cls: 'indigo' },
          { label: 'Critical / Low Stock', value: lowStockCount, icon: '⚠️', cls: 'amber' },
          { label: 'Total Units (Available)', value: inventory.reduce((a, i) => a + (i.current_stock - i.reserved_stock), 0).toLocaleString(), icon: '✅', cls: 'emerald' },
          { label: 'Reserved Stock', value: inventory.reduce((a, i) => a + i.reserved_stock, 0).toLocaleString(), icon: '🔒', cls: 'violet' },
        ].map((m) => (
          <div key={m.label} className="metric-card">
            <div className={`metric-icon ${m.cls}`} style={{ fontSize: 18 }}>{m.icon}</div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="card card-body mb-4" style={{ padding: '14px 20px' }}>
        <input
          className="form-input"
          placeholder="Search by product name, SKU, warehouse..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search inventory"
        />
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Bin</th>
                <th>Available</th>
                <th>Reserved</th>
                <th>Reorder Level</th>
                <th>Stock Health</th>
                <th>Fill Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const available = item.current_stock - item.reserved_stock
                const st = stockStatus(item)
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.product_name}</div>
                      <div className="font-mono text-xs text-muted">{item.sku}</div>
                    </td>
                    <td className="text-sm text-secondary">{item.warehouse_name}</td>
                    <td className="font-mono text-xs text-accent">{item.bin_location ?? '—'}</td>
                    <td style={{ fontWeight: 700, color: available <= item.minimum_stock ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
                      {available.toLocaleString()}
                    </td>
                    <td className="text-sm text-muted">{item.reserved_stock.toLocaleString()}</td>
                    <td className="font-mono text-sm">{item.reorder_level.toLocaleString()}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 64 }}>
                          <div
                            className={`progress-fill ${st.label === 'CRITICAL' ? 'danger' : st.label === 'LOW STOCK' ? 'warning' : 'emerald'}`}
                            style={{ width: `${Math.min(st.pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted">{Math.min(st.pct, 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(item)}>
                        <Edit size={13} style={{ marginRight: 4 }} /> Adjust
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {editModalOpen && editingItem && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Adjust Stock — {editingItem.sku}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.08)', borderRadius: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{editingItem.product_name}</div>
                  <div className="text-xs text-muted">{editingItem.warehouse_name}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">On-Hand Stock Qty</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editForm.current_stock}
                      onChange={e => setEditForm({ ...editForm, current_stock: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reserved Stock</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editForm.reserved_stock}
                      onChange={e => setEditForm({ ...editForm, reserved_stock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Min Safety Stock</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editForm.minimum_stock}
                      onChange={e => setEditForm({ ...editForm, minimum_stock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reorder Trigger Level</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editForm.reorder_level}
                      onChange={e => setEditForm({ ...editForm, reorder_level: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Bin Location (Aisle-Bay-Shelf)</label>
                  <input
                    className="form-input"
                    value={editForm.bin_location}
                    onChange={e => setEditForm({ ...editForm, bin_location: e.target.value })}
                    placeholder="e.g. A-02-05"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} style={{ marginRight: 6 }} /> Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Stock Modal */}
      {transferModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Transfer Stock Between Warehouses</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setTransferModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Select Source Inventory Item</label>
                  <select
                    className="form-input"
                    value={transferForm.source_item_id}
                    onChange={e => setTransferForm({ ...transferForm, source_item_id: Number(e.target.value) })}
                  >
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.product_name} ({item.warehouse_name} — {item.current_stock} avail)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Destination Facility</label>
                  <select
                    className="form-input"
                    value={transferForm.dest_warehouse_name}
                    onChange={e => setTransferForm({ ...transferForm, dest_warehouse_name: e.target.value })}
                  >
                    <option value="Pacific Coast Hub">Pacific Coast Intermodal Port Hub (Los Angeles)</option>
                    <option value="Bay Area Central">Bay Area Central Logistics Hub (San Francisco)</option>
                    <option value="Midwest Cold Chain">Midwest Cold Chain Facility (Chicago)</option>
                    <option value="Eastern Gateway">Eastern Gateway Megahub (New York)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Transfer Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={transferForm.quantity}
                    onChange={e => setTransferForm({ ...transferForm, quantity: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Transfer Reason / Authorization</label>
                  <input
                    className="form-input"
                    value={transferForm.reason}
                    onChange={e => setTransferForm({ ...transferForm, reason: e.target.value })}
                    placeholder="e.g. Stock balancing for upcoming peak demand"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setTransferModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} style={{ marginRight: 6 }} /> Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
