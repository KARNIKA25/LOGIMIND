import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'
import { TrendingUp, Package, Truck, DollarSign, Leaf, Clock } from 'lucide-react'

const SHIPMENT_VOLUME = [
  { month: 'May', volume: 820, revenue: 1240000, onTime: 95.2, carbon: 1820 },
  { month: 'Jun', volume: 940, revenue: 1420000, onTime: 94.8, carbon: 2080 },
  { month: 'Jul', volume: 880, revenue: 1320000, onTime: 96.1, carbon: 1950 },
  { month: 'Aug', volume: 1050, revenue: 1580000, onTime: 95.6, carbon: 2320 },
  { month: 'Sep', volume: 990, revenue: 1490000, onTime: 97.2, carbon: 2190 },
  { month: 'Oct', volume: 1120, revenue: 1680000, onTime: 96.4, carbon: 2480 },
]

const FLEET_PERFORMANCE = [
  { subject: 'Safety', score: 96 }, { subject: 'Fuel Eff.', score: 88 }, { subject: 'On-Time', score: 96 },
  { subject: 'Utilization', score: 72 }, { subject: 'Maintenance', score: 94 }, { subject: 'Customer Sat.', score: 91 },
]

const WAREHOUSE_UTIL = [
  { name: 'Bay Area SF', utilization: 82.4, capacity: 18000 },
  { name: 'LA Pacific', utilization: 74.6, capacity: 25000 },
  { name: 'Chicago MW', utilization: 69.2, capacity: 20000 },
  { name: 'NYC Eastern', utilization: 88.5, capacity: 30000 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(15,31,56,0.97)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '10px 14px' }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ fontSize: '0.8rem', color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-block">
          <h1>Analytics & Intelligence</h1>
          <p className="page-subtitle">Enterprise KPI dashboard · 6-month rolling window</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-sm">Export PDF</button>
          <button className="btn btn-primary btn-sm">Schedule Report</button>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="metric-grid mb-5">
        {[
          { label: 'Total Shipments (6M)', value: '5,800', delta: '+22%', type: 'positive', icon: Truck, cls: 'indigo' },
          { label: 'Revenue (6M)', value: '$8.73M', delta: '+18.2%', type: 'positive', icon: DollarSign, cls: 'emerald' },
          { label: 'Avg On-Time Rate', value: '95.9%', delta: '+1.4%', type: 'positive', icon: Clock, cls: 'cyan' },
          { label: 'Carbon Offset (6M)', value: '12.8T', delta: '↓ 8%', type: 'positive', icon: Leaf, cls: 'violet' },
        ].map((m) => (
          <div key={m.label} className="metric-card">
            <div className={`metric-icon ${m.cls}`}><m.icon size={20} /></div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-delta positive">{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><h3>Shipment Volume & Revenue Trend</h3></div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={SHIPMENT_VOLUME}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,179,168,0.08)" />
                <XAxis dataKey="month" tick={{ fill: '#567366', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="vol" tick={{ fill: '#567366', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="rev" orientation="right" tick={{ fill: '#567366', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#9cb3a8' }} />
                <Area yAxisId="vol" type="monotone" dataKey="volume" name="Shipments" stroke="#10b981" strokeWidth={2.5} fill="url(#volGrad)" dot={false} />
                <Line yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#34d399" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Fleet Performance Radar</h3></div>
          <div className="card-body" style={{ paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={FLEET_PERFORMANCE}>
                <PolarGrid stroke="rgba(16,185,129,0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9cb3a8', fontSize: 11 }} />
                <Radar name="Fleet" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header"><h3>Warehouse Utilization</h3></div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WAREHOUSE_UTIL} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="utilization" name="Utilization (%)" radius={[0, 6, 6, 0]}>
                  {WAREHOUSE_UTIL.map((w, i) => (
                    <rect key={i} fill={w.utilization >= 85 ? '#ef4444' : w.utilization >= 70 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>On-Time Delivery Rate (%)</h3></div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={SHIPMENT_VOLUME}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[93, 98]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="onTime" name="On-Time %" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
