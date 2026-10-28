import { useQuery } from '@tanstack/react-query'
import {
  Truck, Warehouse, Package, AlertTriangle, TrendingUp,
  CheckCircle2, Zap, Leaf, Brain, ArrowUpRight, ArrowDownRight,
  Activity, Clock
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { analyticsApi, shipmentApi } from '../../services/api.service'
import { format } from 'date-fns'
import type { Shipment } from '../../types'

const SHIPMENT_COLORS = { IN_TRANSIT: '#10b981', DELIVERED: '#34d399', DISPATCHED: '#14b8a6', CREATED: '#f59e0b', FAILED_DELIVERY: '#ef4444' }

const MOCK_AREA_DATA = [
  { day: 'Mon', shipments: 28, delivered: 24, revenue: 48000 },
  { day: 'Tue', shipments: 35, delivered: 31, revenue: 62000 },
  { day: 'Wed', shipments: 42, delivered: 38, revenue: 74000 },
  { day: 'Thu', shipments: 31, delivered: 28, revenue: 55000 },
  { day: 'Fri', shipments: 50, delivered: 46, revenue: 89000 },
  { day: 'Sat', shipments: 22, delivered: 20, revenue: 38000 },
  { day: 'Sun', shipments: 18, delivered: 17, revenue: 31000 },
]

const MOCK_STATUS_PIE = [
  { name: 'In Transit', value: 18 },
  { name: 'Delivered', value: 52 },
  { name: 'Dispatched', value: 9 },
  { name: 'Pending', value: 5 },
]

const PIE_COLORS = ['#10b981', '#34d399', '#14b8a6', '#f59e0b']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'rgba(10,30,22,0.97)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--color-text-primary)' }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ fontSize: '0.8rem', color: p.color, marginBottom: 2 }}>
            {p.name}: <strong>{typeof p.value === 'number' && p.name.includes('revenue') ? `$${p.value.toLocaleString()}` : p.value}</strong>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: analyticsApi.dashboard,
    refetchInterval: 60000,
  })

  const { data: shipmentsData } = useQuery({
    queryKey: ['shipments-recent'],
    queryFn: () => shipmentApi.list({ page: 1, size: 5, sort: 'created_at:desc' }),
  })

  const metrics = metricsData?.data
  const recentShipments: Shipment[] = shipmentsData?.data?.items ?? []

  interface KpiItem {
    label: string
    value: string | number
    delta: string
    deltaType: 'positive' | 'negative' | 'neutral'
    icon: any
    iconClass: string
    accent: string
  }

  const kpis: KpiItem[] = [
    {
      label: 'Active Shipments',
      value: metrics?.shipments_active ?? 27,
      delta: '+3',
      deltaType: 'positive',
      icon: Truck,
      iconClass: 'indigo',
      accent: 'accent-indigo',
    },
    {
      label: 'Delivered Today',
      value: metrics?.shipments_delivered_today ?? 46,
      delta: '+12%',
      deltaType: 'positive',
      icon: CheckCircle2,
      iconClass: 'emerald',
      accent: 'accent-emerald',
    },
    {
      label: 'Warehouse Utilization',
      value: `${(metrics?.shipments_active ? 78 : 78)}%`,
      delta: '+2.4%',
      deltaType: 'neutral',
      icon: Warehouse,
      iconClass: 'violet',
      accent: 'accent-violet',
    },
    {
      label: 'Low Stock Alerts',
      value: metrics?.inventory_low_stock_alerts ?? 4,
      delta: '-2',
      deltaType: 'positive',
      icon: AlertTriangle,
      iconClass: 'amber',
      accent: 'accent-violet',
    },
    {
      label: 'On-Time Rate',
      value: `${metrics?.delivery_on_time_rate_pct ?? 96.4}%`,
      delta: '+0.8%',
      deltaType: 'positive',
      icon: Activity,
      iconClass: 'cyan',
      accent: 'accent-cyan',
    },
    {
      label: 'Fleet Active',
      value: `${metrics?.fleet_active_on_trip ?? 2} / ${metrics?.fleet_vehicles_total ?? 4}`,
      delta: 'LIVE',
      deltaType: 'neutral',
      icon: Zap,
      iconClass: 'emerald',
      accent: 'accent-emerald',
    },
    {
      label: 'Revenue MTD',
      value: `$${((metrics?.revenue_this_month_usd ?? 2840000) / 1000).toFixed(0)}K`,
      delta: '+18.2%',
      deltaType: 'positive',
      icon: TrendingUp,
      iconClass: 'indigo',
      accent: 'accent-indigo',
    },
    {
      label: 'Carbon Offset',
      value: `${metrics?.carbon_offset_kg ?? 1240} kg`,
      delta: 'CO₂',
      deltaType: 'positive',
      icon: Leaf,
      iconClass: 'emerald',
      accent: 'accent-emerald',
    },
  ]

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      IN_TRANSIT: 'badge-accent',
      DELIVERED: 'badge-success',
      DISPATCHED: 'badge-info',
      CREATED: 'badge-warning',
      CANCELLED: 'badge-neutral',
      FAILED_DELIVERY: 'badge-danger',
    }
    return map[status] ?? 'badge-neutral'
  }

  function getPriorityBadge(priority: string) {
    const map: Record<string, string> = {
      EXPRESS: 'badge-danger',
      OVERNIGHT: 'badge-danger',
      COLD_CHAIN: 'badge-info',
      HAZMAT: 'badge-warning',
      STANDARD: 'badge-neutral',
    }
    return map[priority] ?? 'badge-neutral'
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-block">
          <h1>Operations Dashboard</h1>
          <p className="page-subtitle">
            Live overview · Updated {format(new Date(), 'HH:mm')} · All systems operational
          </p>
        </div>
        <div className="page-actions">
          <span className="badge badge-success">
            <span className="badge-dot success animate-pulse" />
            LIVE
          </span>
          <button className="btn btn-secondary btn-sm">
            <Brain size={14} /> AI Insights
          </button>
          <button className="btn btn-primary btn-sm">
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="metric-grid">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`metric-card ${kpi.accent}`}>
            <div className={`metric-icon ${kpi.iconClass}`}>
              <kpi.icon size={20} />
            </div>
            <div className="metric-label">{kpi.label}</div>
            <div className="metric-value">{kpi.value}</div>
            <div className={`metric-delta ${kpi.deltaType}`}>
              {kpi.deltaType === 'positive' ? <ArrowUpRight size={12} /> : kpi.deltaType === 'negative' ? <ArrowDownRight size={12} /> : null}
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Shipment Trend */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3>Shipment & Revenue Trend</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {['7D', '30D', '90D'].map((t) => (
                  <button key={t} className={`btn btn-ghost btn-sm${t === '7D' ? ' btn-secondary' : ''}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>{t}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={MOCK_AREA_DATA} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="shipGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="delGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,179,168,0.08)" />
                <XAxis dataKey="day" tick={{ fill: '#567366', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#567366', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="shipments" name="Shipments" stroke="#10b981" strokeWidth={2.5} fill="url(#shipGrad)" dot={false} />
                <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#34d399" strokeWidth={2.5} fill="url(#delGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3>Shipment Status</h3>
          </div>
          <div className="card-body" style={{ paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={MOCK_STATUS_PIE} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {MOCK_STATUS_PIE.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(10,30,22,0.97)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: 'center', marginTop: 4 }}>
              {MOCK_STATUS_PIE.map((s, i) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i], display: 'inline-block' }} />
                  {s.name} ({s.value})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Bar Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><h3>Daily Revenue (USD)</h3></div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MOCK_AREA_DATA} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,179,168,0.08)" />
                <XAxis dataKey="day" tick={{ fill: '#567366', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#567366', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="revenue" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {MOCK_AREA_DATA.map((_, i) => (
                    <Cell key={i} fill={i === 4 ? '#34d399' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Summary */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={18} color="var(--color-accent-1)" />
              <h3>AI Intelligence Feed</h3>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '⚠️', color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: 'Shipment LM-20261003-SF001 has 12% delay risk due to I-80 weather advisory.' },
              { icon: '📦', color: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', text: 'RFID Tag SKU reorder recommended — stock at 72% of reorder level.' },
              { icon: '🗺️', color: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', text: 'Route SF → CHI via I-80 saves 14% fuel vs current highway selection.' },
              { icon: '📈', color: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)', text: 'LiDAR sensor demand forecast: +28% uplift next 30 days. Increase reorder.' },
            ].map((insight, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: insight.color, border: `1px solid ${insight.border}`, borderRadius: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{insight.icon}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Shipments Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3>Recent Shipments</h3>
            <a href="/shipments" className="btn btn-ghost btn-sm">View All →</a>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>Recipient</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Weight (kg)</th>
                <th>AI Risk</th>
                <th>Est. Delivery</th>
              </tr>
            </thead>
            <tbody>
              {recentShipments.length > 0 ? recentShipments.map((s) => (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/shipments/${s.id}`}>
                  <td className="font-mono text-accent" style={{ fontWeight: 600 }}>{s.tracking_number}</td>
                  <td>{s.recipient_name}</td>
                  <td><span className={`badge ${getStatusBadge(s.status)}`}><span className={`badge-dot ${s.status === 'IN_TRANSIT' ? 'accent' : s.status === 'DELIVERED' ? 'success' : 'info'}`} />{s.status.replace('_', ' ')}</span></td>
                  <td><span className={`badge ${getPriorityBadge(s.priority)}`}>{s.priority}</span></td>
                  <td className="font-mono">{s.total_weight_kg?.toFixed(1) ?? '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="progress-bar" style={{ width: 60 }}>
                        <div className={`progress-fill ${(s.ai_risk_score ?? 0) > 0.3 ? 'danger' : (s.ai_risk_score ?? 0) > 0.15 ? 'warning' : 'emerald'}`} style={{ width: `${(s.ai_risk_score ?? 0) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted">{((s.ai_risk_score ?? 0) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="text-sm text-secondary">
                    {s.estimated_delivery_time ? format(new Date(s.estimated_delivery_time), 'MMM dd, HH:mm') : '—'}
                  </td>
                </tr>
              )) : (
                // Fallback demo rows
                [
                  { tracking: 'LM-20261003-SF001', recipient: 'Manhattan Distribution Center', status: 'IN_TRANSIT', priority: 'EXPRESS', weight: 1850, risk: 0.06, delivery: 'Oct 06, 16:00' },
                  { tracking: 'LM-20261003-LA002', recipient: 'Chicago Tech Depot', status: 'DISPATCHED', priority: 'STANDARD', weight: 3200, risk: 0.04, delivery: 'Oct 07, 12:00' },
                  { tracking: 'LM-20261003-CHI003', recipient: 'Riverside Cold Storage Hub', status: 'CREATED', priority: 'COLD_CHAIN', weight: 720, risk: 0.03, delivery: 'Oct 08, 09:00' },
                ].map((s) => (
                  <tr key={s.tracking}>
                    <td className="font-mono text-accent" style={{ fontWeight: 600 }}>{s.tracking}</td>
                    <td>{s.recipient}</td>
                    <td><span className={`badge ${getStatusBadge(s.status)}`}><span className={`badge-dot ${s.status === 'IN_TRANSIT' ? 'accent' : s.status === 'DISPATCHED' ? 'info' : 'warning'}`} />{s.status.replace('_', ' ')}</span></td>
                    <td><span className={`badge ${getPriorityBadge(s.priority)}`}>{s.priority}</span></td>
                    <td className="font-mono">{s.weight.toFixed(1)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div className="progress-fill emerald" style={{ width: `${s.risk * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted">{(s.risk * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="text-sm text-secondary">{s.delivery}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
