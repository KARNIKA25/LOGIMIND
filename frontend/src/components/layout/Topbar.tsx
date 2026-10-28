import { useLocation } from 'react-router-dom'
import { Bell, Brain, Search, ChevronRight, Sun } from 'lucide-react'
import { useUIStore, useAuthStore } from '../../store'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '../../services/api.service'

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analytics': 'Analytics',
  '/ai-assistant': 'AI Co-Pilot',
  '/shipments': 'Shipments',
  '/routes': 'Route Optimizer',
  '/warehouses': 'Warehouses',
  '/inventory': 'Inventory',
  '/products': 'Products',
  '/suppliers': 'Suppliers',
  '/purchase-orders': 'Purchase Orders',
  '/fleet/vehicles': 'Vehicles',
  '/fleet/drivers': 'Drivers',
  '/profile': 'My Profile',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const { toggleAIPanel } = useUIStore()
  const { user } = useAuthStore()

  const currentLabel = ROUTE_LABELS[pathname] ?? 'LogiMind'
  const parentSection = pathname.startsWith('/fleet')
    ? 'Fleet Management'
    : pathname.startsWith('/analytics')
    ? 'Intelligence'
    : 'Platform'

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationApi.list(true),
    refetchInterval: 30000,
  })
  const unreadCount = Array.isArray(notifData?.data) ? notifData.data.length : 0

  return (
    <header className="topbar">
      <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
        <span>{parentSection}</span>
        <ChevronRight size={14} />
        <span className="current">{currentLabel}</span>
      </nav>

      <div className="topbar-actions">
        <button className="topbar-icon-btn" data-tooltip="Search" aria-label="Global search">
          <Search size={16} />
        </button>
        <button
          className="topbar-icon-btn"
          data-tooltip={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
          aria-label="Notifications"
        >
          <Bell size={16} />
          {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={toggleAIPanel}
          aria-label="Open AI Co-Pilot"
        >
          <Brain size={14} />
          AI Co-Pilot
        </button>
      </div>
    </header>
  )
}
