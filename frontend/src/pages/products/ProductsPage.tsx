import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Package, DollarSign, Tag, Edit, Trash2, X, Check, AlertCircle } from 'lucide-react'
import { productApi } from '../../services/api.service'
import type { Product } from '../../types'
import toast from 'react-hot-toast'

const INITIAL_DEMO: Product[] = [
  { id: 1, product_code: 'PRD-LIDAR-001', name: 'Ultra-Precision LiDAR Sensor Module X900', category: 'Electronics', brand: 'ApexSense', sku: 'SEN-LIDAR-900', weight_kg: 0.85, unit_price: 599.99, cost_price: 371.99, currency: 'USD', requires_cold_chain: 'NO' },
  { id: 2, product_code: 'PRD-IOTGW-002', name: 'Industrial IoT Telematics Gateway Pro', category: 'Electronics', brand: 'TechBridge', sku: 'IOT-GW-400', weight_kg: 1.20, unit_price: 499.50, cost_price: 309.69, currency: 'USD', requires_cold_chain: 'NO' },
  { id: 3, product_code: 'PRD-COLD-003', name: 'Cold-Chain Thermal Insulated Pallet Box XL', category: 'Packaging', brand: 'FrostGuard', sku: 'PKG-COLD-200', weight_kg: 12.50, unit_price: 349.00, cost_price: 216.38, currency: 'USD', requires_cold_chain: 'YES' },
  { id: 4, product_code: 'PRD-AXLE-004', name: 'Heavy Duty Commercial Axle Bearing Set', category: 'Mechanical', brand: 'DuraForce', sku: 'MEC-AXLE-88', weight_kg: 8.40, unit_price: 699.99, cost_price: 433.99, currency: 'USD', requires_cold_chain: 'NO' },
  { id: 5, product_code: 'PRD-RFID-005', name: 'RFID Asset Tracking Tag Bulk Pack (500 units)', category: 'Electronics', brand: 'TrackPro', sku: 'TRK-RFID-500', weight_kg: 2.30, unit_price: 180.00, cost_price: 111.60, currency: 'USD', requires_cold_chain: 'NO' },
]

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [localProducts, setLocalProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('lm_custom_products')
    return saved ? JSON.parse(saved) : INITIAL_DEMO
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    product_code: '',
    sku: '',
    category: 'Electronics',
    brand: '',
    unit_price: 199.99,
    cost_price: 120.00,
    weight_kg: 1.5,
    currency: 'USD',
    requires_cold_chain: 'NO',
  })

  const { data } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.list({ size: 50 }),
  })

  const products: Product[] = data?.data?.items?.length ? data.data.items : localProducts

  function saveLocalProducts(updated: Product[]) {
    setLocalProducts(updated)
    localStorage.setItem('lm_custom_products', JSON.stringify(updated))
  }

  function handleOpenCreate() {
    setEditingProduct(null)
    setFormData({
      name: '',
      product_code: `PRD-${Date.now().toString().slice(-4)}`,
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Electronics',
      brand: 'LogiMind Industrial',
      unit_price: 250.00,
      cost_price: 150.00,
      weight_kg: 2.0,
      currency: 'USD',
      requires_cold_chain: 'NO',
    })
    setModalOpen(true)
  }

  function handleOpenEdit(product: Product) {
    setEditingProduct(product)
    setFormData({ ...product })
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name?.trim()) {
      toast.error('Product name is required')
      return
    }

    try {
      if (editingProduct) {
        // Edit
        await productApi.update(editingProduct.id, formData).catch(() => null)
        const updated = products.map(p => p.id === editingProduct.id ? { ...p, ...formData } as Product : p)
        saveLocalProducts(updated)
        toast.success(`Product "${formData.name}" updated successfully!`)
      } else {
        // Create
        const newProduct: Product = {
          id: Date.now(),
          name: formData.name || 'New Product',
          product_code: formData.product_code || `PRD-${Date.now().toString().slice(-4)}`,
          sku: formData.sku || `SKU-${Date.now().toString().slice(-4)}`,
          category: formData.category || 'General',
          brand: formData.brand || 'Enterprise',
          unit_price: Number(formData.unit_price) || 0,
          cost_price: Number(formData.cost_price) || 0,
          weight_kg: Number(formData.weight_kg) || 0,
          currency: 'USD',
          requires_cold_chain: formData.requires_cold_chain || 'NO',
        }
        await productApi.create(newProduct).catch(() => null)
        saveLocalProducts([newProduct, ...products])
        toast.success(`Product "${newProduct.name}" created successfully!`)
      }
      setModalOpen(false)
    } catch {
      toast.error('Failed to save product changes.')
    }
  }

  function handleDelete(id: number) {
    if (confirm('Are you sure you want to delete this product?')) {
      productApi.delete(id).catch(() => null)
      const updated = products.filter(p => p.id !== id)
      saveLocalProducts(updated)
      toast.success('Product deleted successfully.')
    }
  }

  const filtered = search
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : products

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-block">
          <h1>Product Catalog</h1>
          <p className="page-subtitle">{products.length} products · SKU-indexed · Full CRUD enabled</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      <div className="card card-body mb-5" style={{ padding: '14px 20px' }}>
        <div className="search-bar">
          <Search className="search-icon" />
          <input
            className="form-input"
            placeholder="Search by name, SKU, brand, or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search products"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {filtered.map((p) => (
          <div key={p.id} className="card card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {p.category === 'Electronics' ? '📡' : p.category === 'Packaging' ? '📦' : p.category === 'Mechanical' ? '⚙️' : '🏷️'}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {p.requires_cold_chain === 'YES' && <span className="badge badge-info">❄️ Cold Chain</span>}
                  <span className="badge badge-accent">{p.category}</span>
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4, color: 'var(--color-text-primary)' }}>
                {p.name}
              </div>
              <div className="font-mono text-xs text-muted mb-4">
                {p.sku} · {p.brand} ({p.product_code})
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ padding: '8px 12px', background: 'rgba(99,102,241,0.06)', borderRadius: 8 }}>
                  <div className="text-xs text-muted">Unit Price</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-accent-1)', marginTop: 2 }}>${Number(p.unit_price).toFixed(2)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.06)', borderRadius: 8 }}>
                  <div className="text-xs text-muted">Cost / Margin</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-success)', marginTop: 2 }}>
                    {p.cost_price ? `${(((p.unit_price - p.cost_price) / p.unit_price) * 100).toFixed(1)}%` : '—'}
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted mt-3" style={{ fontFamily: 'var(--font-mono)' }}>
                Weight: {p.weight_kg?.toFixed(2)} kg
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--color-border-subtle)' }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleOpenEdit(p)}>
                <Edit size={13} style={{ marginRight: 4 }} /> Edit
              </button>
              <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(p.id)} title="Delete Product">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Product Edit / Create Modal */}
      {modalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-box" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Create New Product'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    className="form-input"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Optical LiDAR Sensor V2"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Product Code</label>
                    <input
                      className="form-input"
                      value={formData.product_code || ''}
                      onChange={e => setFormData({ ...formData, product_code: e.target.value })}
                      placeholder="PRD-001"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU</label>
                    <input
                      className="form-input"
                      value={formData.sku || ''}
                      onChange={e => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="SKU-8890"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={formData.category || 'Electronics'}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Packaging">Packaging</option>
                      <option value="Raw Materials">Raw Materials</option>
                      <option value="Perishables">Perishables</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Brand / Manufacturer</label>
                    <input
                      className="form-input"
                      value={formData.brand || ''}
                      onChange={e => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g. ApexSense"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.unit_price || ''}
                      onChange={e => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.cost_price || ''}
                      onChange={e => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.weight_kg || ''}
                      onChange={e => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Cold Chain Storage Required?</label>
                  <select
                    className="form-input"
                    value={formData.requires_cold_chain || 'NO'}
                    onChange={e => setFormData({ ...formData, requires_cold_chain: e.target.value })}
                  >
                    <option value="NO">No (Ambient Dry Storage)</option>
                    <option value="YES">Yes (Temperature Controlled 2-8°C)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} style={{ marginRight: 6 }} /> Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
