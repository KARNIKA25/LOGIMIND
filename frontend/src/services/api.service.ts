import api from '../lib/api'
import type { LoginCredentials, AuthTokens, User, DashboardMetrics, Shipment, Warehouse, Product, Inventory, Supplier, PurchaseOrder, Vehicle, Driver, AIMessage, AIResponse, DemandForecast, PaginatedResponse } from '../types'

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (creds: LoginCredentials) =>
    api.post<AuthTokens>('/auth/login', {
      username: creds.username,
      username_or_email: creds.username,
      password: creds.password,
    }),
  register: (data: {
    username: string; email: string; password: string;
    first_name?: string; last_name?: string; phone?: string; role?: string
  }) => api.post('/auth/register', data),
  me: () => api.get<User>('/auth/me'),
  refresh: (token: string) => api.post<AuthTokens>('/auth/refresh', { refresh_token: token }),

  // Email OTP
  sendEmailOtp: (email: string, purpose = 'EMAIL_VERIFY') =>
    api.post('/auth/send-email-otp', { email, purpose }),
  verifyEmailOtp: (email: string, otp_code: string, purpose = 'EMAIL_VERIFY') =>
    api.post('/auth/verify-email-otp', { email, otp_code, purpose }),

  // Phone OTP
  sendPhoneOtp: (phone: string, purpose = 'PHONE_VERIFY') =>
    api.post('/auth/send-phone-otp', { phone, purpose }),
  verifyPhoneOtp: (phone: string, otp_code: string, user_id: number) =>
    api.post('/auth/verify-phone-otp', { phone, otp_code, user_id }),

  // Password Reset
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (email: string, otp_code: string, new_password: string) =>
    api.post('/auth/reset-password', { email, otp_code, new_password }),

  // Google OAuth
  googleOAuth: (id_token: string) =>
    api.post<AuthTokens>('/auth/oauth/google', { id_token }),
}


// ── Analytics / Dashboard ─────────────────────────────────────
export const analyticsApi = {
  dashboard: () => api.get<DashboardMetrics>('/analytics/dashboard'),
  shipmentTrend: (days?: number) => api.get('/analytics/shipments/trend', { params: { days } }),
  inventoryHeatmap: () => api.get('/analytics/inventory/heatmap'),
  fleetUtilization: () => api.get('/analytics/fleet/utilization'),
  revenueTrend: (days?: number) => api.get('/analytics/revenue/trend', { params: { days } }),
  carbonReport: () => api.get('/analytics/carbon/report'),
}

// ── Warehouses ─────────────────────────────────────────────────
export const warehouseApi = {
  list: (params?: object) => api.get<PaginatedResponse<Warehouse>>('/warehouses', { params }),
  get: (id: number) => api.get<Warehouse>(`/warehouses/${id}`),
  create: (data: Partial<Warehouse>) => api.post<Warehouse>('/warehouses', data),
  update: (id: number, data: Partial<Warehouse>) => api.put<Warehouse>(`/warehouses/${id}`, data),
  delete: (id: number) => api.delete(`/warehouses/${id}`),
  utilization: (id: number) => api.get(`/warehouses/${id}/utilization`),
}

// ── Products ───────────────────────────────────────────────────
export const productApi = {
  list: (params?: object) => api.get<PaginatedResponse<Product>>('/products', { params }),
  get: (id: number) => api.get<Product>(`/products/${id}`),
  create: (data: Partial<Product>) => api.post<Product>('/products', data),
  update: (id: number, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  search: (q: string) => api.get<Product[]>('/products/search', { params: { q } }),
}

// ── Inventory ──────────────────────────────────────────────────
export const inventoryApi = {
  list: (params?: object) => api.get<PaginatedResponse<Inventory>>('/inventory', { params }),
  get: (id: number) => api.get<Inventory>(`/inventory/${id}`),
  update: (id: number, data: Partial<Inventory>) => api.put<Inventory>(`/inventory/${id}`, data),
  lowStock: () => api.get<Inventory[]>('/inventory/alerts/low-stock'),
  adjust: (id: number, qty: number, reason: string) => api.post(`/inventory/${id}/adjust`, { quantity_delta: qty, reason }),
  transfer: (from_id: number, to_id: number, product_id: number, qty: number) =>
    api.post('/inventory/transfer', { from_warehouse_id: from_id, to_warehouse_id: to_id, product_id, quantity: qty }),
}

// ── Suppliers ──────────────────────────────────────────────────
export const supplierApi = {
  list: (params?: object) => api.get<PaginatedResponse<Supplier>>('/suppliers', { params }),
  get: (id: number) => api.get<Supplier>(`/suppliers/${id}`),
  create: (data: Partial<Supplier>) => api.post<Supplier>('/suppliers', data),
  update: (id: number, data: Partial<Supplier>) => api.put<Supplier>(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
  performance: (id: number) => api.get(`/suppliers/${id}/performance`),
}

// ── Purchase Orders ────────────────────────────────────────────
export const purchaseOrderApi = {
  list: (params?: object) => api.get<PaginatedResponse<PurchaseOrder>>('/purchase-orders', { params }),
  get: (id: number) => api.get<PurchaseOrder>(`/purchase-orders/${id}`),
  create: (data: Partial<PurchaseOrder>) => api.post<PurchaseOrder>('/purchase-orders', data),
  update: (id: number, data: Partial<PurchaseOrder>) => api.put<PurchaseOrder>(`/purchase-orders/${id}`, data),
  delete: (id: number) => api.delete(`/purchase-orders/${id}`),
  approve: (id: number) => api.post(`/purchase-orders/${id}/approve`),
  cancel: (id: number) => api.post(`/purchase-orders/${id}/cancel`),
}

// ── Shipments ──────────────────────────────────────────────────
export const shipmentApi = {
  list: (params?: object) => api.get<PaginatedResponse<Shipment>>('/shipments', { params }),
  get: (id: number) => api.get<Shipment>(`/shipments/${id}`),
  track: (tracking: string) => api.get<Shipment>(`/shipments/track/${tracking}`),
  create: (data: Partial<Shipment>) => api.post<Shipment>('/shipments', data),
  update: (id: number, data: Partial<Shipment>) => api.put<Shipment>(`/shipments/${id}`, data),
  delete: (id: number) => api.delete(`/shipments/${id}`),
  updateStatus: (id: number, status: string, note?: string) =>
    api.patch(`/shipments/${id}/status`, { status, note }),
  events: (id: number) => api.get(`/shipments/${id}/events`),
  riskAnalysis: (id: number) => api.get(`/shipments/${id}/risk-analysis`),
}

// ── Vehicles ───────────────────────────────────────────────────
export const vehicleApi = {
  list: (params?: object) => api.get<PaginatedResponse<Vehicle>>('/vehicles', { params }),
  get: (id: number) => api.get<Vehicle>(`/vehicles/${id}`),
  create: (data: Partial<Vehicle>) => api.post<Vehicle>('/vehicles', data),
  update: (id: number, data: Partial<Vehicle>) => api.put<Vehicle>(`/vehicles/${id}`, data),
  delete: (id: number) => api.delete(`/vehicles/${id}`),
  maintenanceLogs: (id: number) => api.get(`/vehicles/${id}/maintenance`),
  telemetry: (id: number) => api.get(`/vehicles/${id}/telemetry`),
}

// ── Drivers ────────────────────────────────────────────────────
export const driverApi = {
  list: (params?: object) => api.get<PaginatedResponse<Driver>>('/drivers', { params }),
  get: (id: number) => api.get<Driver>(`/drivers/${id}`),
  create: (data: Partial<Driver>) => api.post<Driver>('/drivers', data),
  update: (id: number, data: Partial<Driver>) => api.put<Driver>(`/drivers/${id}`, data),
  delete: (id: number) => api.delete(`/drivers/${id}`),
  performance: (id: number) => api.get(`/drivers/${id}/performance`),
  incidents: (id: number) => api.get(`/drivers/${id}/incidents`),
}

// ── Location Services & Geocoding ──────────────────────────────
export const locationApi = {
  geocode: (query: string, limit = 6) =>
    api.get<Array<{
      name: string
      display_name: string
      latitude: number
      longitude: number
      category: string
    }>>('/locations/geocode', { params: { q: query, limit } }),
  nearby: (lat: number, lng: number, radius_km = 75, category?: string[]) =>
    api.get('/locations/nearby', { params: { lat, lng, radius_km, category } }),
}

// ── Route Optimization ─────────────────────────────────────────
export const routeApi = {
  optimize: (data: object) => api.post('/routes/optimize', data),
  weatherImpact: (data: object) => api.post('/routes/weather-impact', data),
  carbonEstimate: (data: object) => api.post('/routes/carbon-estimate', data),
}

// ── AI Engine ──────────────────────────────────────────────────
export const aiApi = {
  chat: (messages: AIMessage[], context?: object) => {
    const lastMsg = messages[messages.length - 1]
    const query = lastMsg?.content || ''
    return api.post<AIResponse>('/ai/chat', {
      query,
      messages,
      conversation_history: messages.slice(0, -1),
      context,
    })
  },
  forecast: (product_id: number, warehouse_id: number, days?: number) =>
    api.post<DemandForecast>('/ai/forecast', { product_id, warehouse_id, forecast_days: days ?? 30 }),
  delayRisk: (shipment_id: number) =>
    api.get(`/ai/shipments/${shipment_id}/delay-risk`),
  insights: () => api.get('/ai/insights'),
  routeRecommendation: (data: object) => api.post('/ai/route-recommendation', data),
}

// ── Notifications ──────────────────────────────────────────────
export const notificationApi = {
  list: (unread_only?: boolean) => api.get('/notifications', { params: { unread_only } }),
  markRead: (id: number) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
}

// ── Weather ────────────────────────────────────────────────────
export const weatherApi = {
  current: (lat: number, lng: number) => api.get('/weather/current', { params: { lat, lng } }),
  forecast: (lat: number, lng: number) => api.get('/weather/forecast', { params: { lat, lng } }),
  transitImpact: (origin_lat: number, origin_lng: number, dest_lat: number, dest_lng: number) =>
    api.post('/weather/transit-impact', { origin_lat, origin_lng, dest_lat, dest_lng }),
}
