import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ShipmentsPage from './pages/shipments/ShipmentsPage'
import ShipmentDetailPage from './pages/shipments/ShipmentDetailPage'
import WarehousesPage from './pages/warehouses/WarehousesPage'
import WarehouseDetailPage from './pages/warehouses/WarehouseDetailPage'
import ProductsPage from './pages/products/ProductsPage'
import InventoryPage from './pages/inventory/InventoryPage'
import SuppliersPage from './pages/suppliers/SuppliersPage'
import PurchaseOrdersPage from './pages/purchase-orders/PurchaseOrdersPage'
import VehiclesPage from './pages/fleet/VehiclesPage'
import DriversPage from './pages/fleet/DriversPage'
import RoutesPage from './pages/routes/RoutesPage'
import AnalyticsPage from './pages/analytics/AnalyticsPage'
import AIAssistantPage from './pages/ai/AIAssistantPage'
import ProfilePage from './pages/profile/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore()
  const valid = Boolean(token) || Boolean(localStorage.getItem('lm_token')) || isAuthenticated
  return valid ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore()
  const hasToken = Boolean(token) || Boolean(localStorage.getItem('lm_token'))
  const valid = isAuthenticated && hasToken
  return !valid ? <>{children}</> : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      {/* ── Public Auth Routes ── */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

      {/* ── Protected Routes (inside AppLayout) ── */}
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="shipments" element={<ShipmentsPage />} />
        <Route path="shipments/:id" element={<ShipmentDetailPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="warehouses/:id" element={<WarehouseDetailPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="fleet/vehicles" element={<VehiclesPage />} />
        <Route path="fleet/drivers" element={<DriversPage />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="ai-assistant" element={<AIAssistantPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
