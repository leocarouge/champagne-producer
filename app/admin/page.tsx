import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { formatPrice, formatDateShort } from '@/lib/utils'
import { ShoppingBag, BedDouble, TrendingUp, Package, ArrowRight, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

async function getDashboardStats() {
  const [
    { count: orderCount },
    { count: bookingCount },
    { data: recentOrders },
    { data: recentBookings },
    { data: paidOrders },
    { data: upcomingBookings },
    { count: lowStockCount },
  ] = await Promise.all([
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).neq('status', 'cancelled'),
    supabaseAdmin.from('orders').select('*, order_items(product_name, quantity)').order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('bookings').select('*, rooms(name)').gte('check_in', new Date().toISOString().split('T')[0]).order('check_in').limit(5),
    supabaseAdmin.from('orders').select('total').eq('status', 'paid'),
    supabaseAdmin.from('bookings').select('total_price').gte('check_in', new Date().toISOString().split('T')[0]).neq('status', 'cancelled'),
    supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('active', true).lt('stock', 5),
  ])

  const shopRevenue = (paidOrders ?? []).reduce((s, o) => s + Number(o.total), 0)
  const bookingRevenue = (upcomingBookings ?? []).reduce((s, b) => s + Number(b.total_price), 0)

  return {
    orderCount: orderCount ?? 0,
    bookingCount: bookingCount ?? 0,
    shopRevenue,
    bookingRevenue,
    recentOrders: recentOrders ?? [],
    recentBookings: recentBookings ?? [],
    lowStockCount: lowStockCount ?? 0,
  }
}

const ORDER_STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'secondary' }> = {
  pending: { label: 'En attente', variant: 'warning' },
  paid: { label: 'Payé', variant: 'success' },
  processing: { label: 'En cours', variant: 'default' },
  shipped: { label: 'Expédié', variant: 'default' },
  delivered: { label: 'Livré', variant: 'success' },
  cancelled: { label: 'Annulé', variant: 'error' },
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  const stats = await getDashboardStats()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-zinc-900">Tableau de bord</h1>
          <p className="text-zinc-500 mt-1">Bonjour, {session?.user?.name ?? 'Administrateur'}</p>
        </div>
      </div>

      {/* Low stock alert */}
      {stats.lowStockCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{stats.lowStockCount} produit{stats.lowStockCount > 1 ? 's' : ''}</strong> avec un stock bas (&lt; 5 unités).{' '}
            <Link href="/admin/products" className="underline hover:no-underline">Gérer les stocks</Link>
          </p>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[
          { icon: ShoppingBag, label: 'Commandes', value: String(stats.orderCount), sub: formatPrice(stats.shopRevenue) + ' de CA', color: 'text-blue-500', bg: 'bg-blue-50' },
          { icon: BedDouble, label: 'Réservations', value: String(stats.bookingCount), sub: `${formatPrice(stats.bookingRevenue)} à venir`, color: 'text-purple-500', bg: 'bg-purple-50' },
          { icon: TrendingUp, label: 'CA boutique', value: formatPrice(stats.shopRevenue), sub: 'Commandes payées', color: 'text-green-500', bg: 'bg-green-50' },
          { icon: Package, label: 'Stock faible', value: String(stats.lowStockCount), sub: 'produits < 5 unités', color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-sm font-medium text-zinc-500">{label}</span>
            </div>
            <p className="font-serif text-2xl font-bold text-zinc-900">{value}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-zinc-50">
            <h2 className="font-serif text-lg font-semibold">Dernières commandes</h2>
            <Link href="/admin/orders" className="text-sm text-[#C9A84C] hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-50">
            {stats.recentOrders.length === 0 ? (
              <p className="p-5 text-sm text-zinc-400">Aucune commande</p>
            ) : (
              stats.recentOrders.map((order) => {
                const statusInfo = ORDER_STATUS_BADGE[order.status] ?? { label: order.status, variant: 'secondary' as const }
                return (
                  <Link key={order.id} href={`/admin/orders?id=${order.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{order.customer_name}</p>
                      <p className="text-xs text-zinc-400">{formatDateShort(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      <span className="text-sm font-semibold text-[#C9A84C]">{formatPrice(order.total)}</span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-zinc-50">
            <h2 className="font-serif text-lg font-semibold">Prochaines réservations</h2>
            <Link href="/admin/bookings" className="text-sm text-[#C9A84C] hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-50">
            {stats.recentBookings.length === 0 ? (
              <p className="p-5 text-sm text-zinc-400">Aucune réservation à venir</p>
            ) : (
              stats.recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{booking.guest_name}</p>
                    <p className="text-xs text-zinc-400">
                      {(booking.rooms as { name?: string } | null)?.name} · {formatDateShort(booking.check_in)} → {formatDateShort(booking.check_out)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#C9A84C]">{formatPrice(booking.total_price)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
