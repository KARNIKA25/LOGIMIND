// ── Auth ─────────────────────────────────────────────────────
export interface LoginCredentials { username: string; password: string }
export interface AuthTokens { access_token: string; token_type: string }
export interface User {
  id: number; email: string; username: string;
  role: UserRole; is_active: boolean; is_verified: boolean;
  profile?: UserProfile;
}
export interface UserProfile {
  first_name: string; last_name: string;
  phone?: string; country?: string; avatar_url?: string;
}
export type UserRole = 'admin' | 'manager' | 'warehouse_manager' | 'driver' | 'employee' | 'supplier'

// ── Warehouse ─────────────────────────────────────────────────
export interface Warehouse {
  id: number; warehouse_code: string; name: string;
  city: string; state?: string; country: string;
  latitude?: number; longitude?: number;
  total_capacity: number; current_utilization: number;
  status: string; contact_email?: string; contact_phone?: string;
  zones?: StorageZone[];
  created_at: string;
}
export interface StorageZone {
  id: number; zone_code: string; zone_name: string;
  zone_type: string; capacity: number; current_load: number;
  temperature_celsius?: number; humidity_percentage?: number;
}

// ── Product & Inventory ──────────────────────────────────────
export interface Product {
  id: number; product_code: string; name: string;
  category: string; brand?: string; sku: string;
  weight_kg?: number; unit_price: number; cost_price?: number;
  currency: string; requires_cold_chain: string;
}
export interface Inventory {
  id: number; warehouse_id: number; product_id: number;
  current_stock: number; reserved_stock: number;
  minimum_stock: number; maximum_stock: number; reorder_level: number;
  bin_location?: string; last_counted_at?: string;
  product?: Product; warehouse?: Warehouse;
}

// ── Supplier & PO ────────────────────────────────────────────
export interface Supplier {
  id: number; supplier_code: string; company_name: string;
  contact_person: string; email: string; phone?: string;
  city: string; country: string;
  rating?: number; reliability_score?: number;
  status: string;
}
export interface PurchaseOrder {
  id: number; po_number: string; supplier_id: number;
  warehouse_id: number; status: string; priority: string;
  total_amount: number; currency: string;
  expected_delivery_date?: string; created_at: string;
  supplier?: Supplier;
}

// ── Shipment ──────────────────────────────────────────────────
export interface Shipment {
  id: number; tracking_number: string;
  origin_warehouse_id?: number; destination_warehouse_id?: number;
  recipient_name: string; recipient_phone?: string;
  destination_address: string;
  destination_latitude?: number; destination_longitude?: number;
  cargo_description?: string;
  status: ShipmentStatus; priority: ShipmentPriority;
  total_weight_kg?: number; total_volume_cbm?: number;
  vehicle_id?: number; driver_id?: number;
  actual_dispatch_time?: string; estimated_delivery_time?: string;
  current_latitude?: number; current_longitude?: number;
  ai_risk_score?: number; ai_predicted_delay_mins?: number; ai_recommendation?: string;
  events?: ShipmentEvent[];
  created_at: string;
}
export type ShipmentStatus = 'CREATED' | 'CONFIRMED' | 'READY_FOR_DISPATCH' | 'DISPATCHED' | 'IN_TRANSIT' | 'AT_HUB' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED_DELIVERY' | 'RETURNED' | 'CANCELLED'
export type ShipmentPriority = 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'COLD_CHAIN' | 'HAZMAT'
export interface ShipmentEvent {
  id: number; shipment_id: number; status: string;
  location_name?: string; latitude?: number; longitude?: number;
  event_details?: string; timestamp: string;
}

// ── Vehicle & Driver ─────────────────────────────────────────
export interface Vehicle {
  id: number; registration_number: string; model: string; make: string;
  year?: number; vehicle_type: string; capacity_kg: number;
  fuel_type?: string; status: string;
  current_latitude?: number; current_longitude?: number;
  current_odometer_km?: number;
}
export interface Driver {
  id: number; user_id: number;
  driver_license_number: string; license_type?: string;
  years_of_experience?: number; assigned_vehicle_id?: number;
  status: string; safety_rating?: number;
  total_trips_completed?: number; total_km_driven?: number;
  current_latitude?: number; current_longitude?: number;
  user?: User;
}

// ── Analytics ─────────────────────────────────────────────────
export interface DashboardMetrics {
  shipments_active: number; shipments_delivered_today: number;
  warehouses_total: number; inventory_low_stock_alerts: number;
  fleet_vehicles_total: number; fleet_active_on_trip: number;
  delivery_on_time_rate_pct: number; revenue_this_month_usd: number;
  ai_predictions_made: number; carbon_offset_kg: number;
}
export interface ChartDataPoint { name: string; value: number; label?: string }

// ── AI ────────────────────────────────────────────────────────
export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  model?: string
  suggested_actions?: string[]
  intent_detected?: string
}
export interface AIResponse {
  response: string
  reply?: string
  tokens_used?: number
  model?: string
  confidence?: number
  intent_detected?: string
  suggested_actions?: string[]
  structured_data?: any
}
export interface DemandForecast {
  product_id: number; warehouse_id: number;
  forecast_days: number; predictions: ForecastPoint[];
  confidence_score?: number; trend?: string;
}
export interface ForecastPoint { date: string; predicted_demand: number; lower_bound?: number; upper_bound?: number }

// ── Pagination ────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[]; total: number; page: number; size: number; pages: number;
}
