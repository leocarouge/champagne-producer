import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [
    { data: orders },
    { data: bookings },
    { data: recentOrders },
    { data: recentBookings },
  ] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('total, status, created_at')
      .eq('status', 'paid'),
    supabaseAdmin
      .from('bookings')
      .select('total_price, status, check_in, created_at')
      .neq('status', 'cancelled'),
    supabaseAdmin
      .from('orders')
      .select('*, order_items(*), invoices(*)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('bookings')
      .select('*, rooms(name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalShopRevenue = (orders ?? []).reduce((s, o) => s + Number(o.total), 0)
  const totalBookingRevenue = (bookings ?? []).reduce((s, b) => s + Number(b.total_price), 0)
  const totalOrders = orders?.length ?? 0
  const totalBookings = bookings?.length ?? 0

  // Build monthly revenue for last 12 months
  const monthlyMap: Record<string, { shop: number; booking: number }> = {}
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap[key] = { shop: 0, booking: 0 }
  }

  for (const o of orders ?? []) {
    const key = o.created_at.substring(0, 7)
    if (monthlyMap[key]) monthlyMap[key].shop += Number(o.total)
  }
  for (const b of bookings ?? []) {
    const key = b.check_in.substring(0, 7)
    if (monthlyMap[key]) monthlyMap[key].booking += Number(b.total_price)
  }

  const monthlyRevenue = Object.entries(monthlyMap).map(([month, v]) => ({
    month,
    shop_revenue: v.shop,
    booking_revenue: v.booking,
    total: v.shop + v.booking,
  }))

  return NextResponse.json({
    data: {
      totalShopRevenue,
      totalBookingRevenue,
      totalOrders,
      totalBookings,
      monthlyRevenue,
      recentOrders: recentOrders ?? [],
      recentBookings: recentBookings ?? [],
    },
  })
}
