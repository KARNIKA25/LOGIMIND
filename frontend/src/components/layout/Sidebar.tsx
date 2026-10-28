import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart,
  Truck, Users, Map, BarChart3, Brain, Settings,
  ChevronRight, PackageOpen, Box, UserCheck, Zap,
  LogOut
} from 'lucide-react'
import { useAuthStore } from '../../store'

const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard',       badge: null },
      { to: '/analytics',      icon: BarChart3,        label: 'Analytics',       badge: null },
      { to: '/ai-assistant',   icon: Brain,            label: 'AI Co-Pilot',     badge: 'AI' },
    ]
  },
  {
    label: 'Operations',
    items: [
      { to: '/shipments',      icon: Truck,       label: 'Shipments',        badge: null },
      { to: '/routes',         icon: Map,          label: 'Route Optimizer',  badge: null },
      { to: '/warehouses',     icon: Warehouse,    label: 'Warehouses',       badge: null },
      { to: '/inventory',      icon: Box,          label: 'Inventory',        badge: null },
    ]
  },
  {
    label: 'Catalog',
    items: [
      { to: '/products',       icon: Package,      label: 'Products',         badge: null },
      { to: '/suppliers',      icon: UserCheck,    label: 'Suppliers',        badge: null },
      { to: '/purchase-orders',icon: ShoppingCart, label: 'Purchase Orders',  badge: null },
    ]
  },
  {
    label: 'Fleet',
    items: [
      { to: '/fleet/vehicles', icon: Truck,        label: 'Vehicles',         badge: null },
      { to: '/fleet/drivers',  icon: Users,        label: 'Drivers',          badge: null },
    ]
  },
  {
    label: 'System',
    items: [
      { to: '/profile',        icon: Settings,     label: 'My Profile',       badge: null },
    ]
  },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const firstName = user?.profile?.first_name || user?.username || 'User'
  const lastName = user?.profile?.last_name || ''
  const initials = `${firstName[0] || 'L'}${lastName[0] || firstName[1] || 'M'}`.toUpperCase()

  const displayName = user?.profile?.first_name
    ? `${user.profile.first_name} ${user.profile.last_name || ''}`.trim()
    : user?.username || 'User'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <NavLink to="/dashboard" className="sidebar-logo">
        <div className="sidebar-logo-icon">L</div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-name">LOGIMIND</div>
          <div className="sidebar-logo-version">v2.0 Enterprise</div>
        </div>
      </NavLink>

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div className="sidebar-section" key={section.label}>
            <span className="sidebar-section-label">{section.label}</span>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <item.icon className="sidebar-link-icon" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="sidebar-badge">{item.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={() => navigate('/profile')}>
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div className="user-role">{user?.role?.replace('_', ' ') ?? ''}</div>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm w-full mt-auto"
          style={{ marginTop: '8px', color: 'var(--color-danger)' }}
          onClick={handleLogout}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
