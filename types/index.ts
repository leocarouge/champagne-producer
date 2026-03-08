// ============================================================
// Shared TypeScript types — Maison Lambert
// ============================================================

export type ProductCategory = 'brut' | 'rosé' | 'blanc-de-blancs' | 'millésime' | 'prestige' | 'autre'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  stock: number
  image_url: string | null
  category: ProductCategory
  featured: boolean
  active: boolean
  label: string | null
  assemblage: string | null
  vins_reserve: string | null
  region: string | null
  accord_mets: string | null
  created_at: string
  updated_at: string
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type BillingStatus = 'to_invoice' | 'invoiced' | 'paid'

export interface ShippingAddress {
  line1: string
  line2?: string
  city: string
  postal_code: string
  country: string
}

export interface Order {
  id: string
  stripe_session_id: string | null
  stripe_payment_intent: string | null
  customer_email: string
  customer_name: string
  customer_phone: string | null
  shipping_address: ShippingAddress
  subtotal: number
  shipping_cost: number
  total: number
  status: OrderStatus
  billing_status: BillingStatus
  notes: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
  invoices?: Invoice[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface Invoice {
  id: string
  order_id: string
  invoice_number: string
  pdf_url: string | null
  issued_at: string
  created_at: string
}

export interface Room {
  id: string
  name: string
  slug: string
  description: string
  price_per_night: number
  capacity: number
  photos: string[]
  amenities: string[]
  active: boolean
  created_at: string
  updated_at: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type BookingSource = 'direct' | 'airbnb' | 'booking' | 'other'

export interface Booking {
  id: string
  room_id: string
  guest_name: string
  guest_email: string
  guest_phone: string | null
  check_in: string
  check_out: string
  nights: number
  total_price: number
  status: BookingStatus
  source: BookingSource
  external_uid: string | null
  notes: string | null
  created_at: string
  updated_at: string
  room?: Room
}

// Cart
export interface CartItem {
  product: Product
  quantity: number
}

export interface Cart {
  items: CartItem[]
  total: number
  subtotal: number
  shippingCost: number
  itemCount: number
}

// API responses
export interface ApiResponse<T> {
  data?: T
  error?: string
}

// Analytics
export interface MonthlyRevenue {
  month: string
  shop_revenue: number
  booking_revenue: number
  total: number
}

export interface AnalyticsData {
  totalShopRevenue: number
  totalBookingRevenue: number
  totalOrders: number
  totalBookings: number
  monthlyRevenue: MonthlyRevenue[]
  recentOrders: Order[]
  recentBookings: Booking[]
}
