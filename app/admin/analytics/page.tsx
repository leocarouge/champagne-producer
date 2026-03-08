'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingBag, BedDouble, Euro } from 'lucide-react'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { formatPrice, formatDate } from '@/lib/utils'
import type { AnalyticsData } from '@/types'

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => { setData(d.data); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return <p className="text-zinc-500">Impossible de charger les données.</p>

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Analytiques</h1>
        <p className="text-zinc-500 mt-1">Vue d&apos;ensemble des performances</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: ShoppingBag,
            label: 'CA Boutique',
            value: formatPrice(data.totalShopRevenue),
            sub: `${data.totalOrders} commandes payées`,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
          },
          {
            icon: BedDouble,
            label: 'CA Chambres',
            value: formatPrice(data.totalBookingRevenue),
            sub: `${data.totalBookings} réservations`,
            color: 'text-purple-500',
            bg: 'bg-purple-50',
          },
          {
            icon: Euro,
            label: 'CA Total',
            value: formatPrice(data.totalShopRevenue + data.totalBookingRevenue),
            sub: 'Boutique + Chambres',
            color: 'text-[#C9A84C]',
            bg: 'bg-amber-50',
          },
          {
            icon: TrendingUp,
            label: 'Panier moyen',
            value: data.totalOrders > 0
              ? formatPrice(data.totalShopRevenue / data.totalOrders)
              : '—',
            sub: 'Par commande',
            color: 'text-green-500',
            bg: 'bg-green-50',
          },
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
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

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-6 mb-6">
        <h2 className="font-serif text-lg font-semibold mb-5">Revenus mensuels — 12 derniers mois</h2>
        <RevenueChart data={data.monthlyRevenue} />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-50">
            <h2 className="font-serif text-lg font-semibold">Dernières commandes</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {data.recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-sm text-zinc-400 text-center">Aucune commande</p>
            ) : data.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{order.customer_name}</p>
                  <p className="text-xs text-zinc-400">{formatDate(order.created_at)}</p>
                </div>
                <span className="text-sm font-semibold text-[#C9A84C]">{formatPrice(order.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent bookings */}
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-50">
            <h2 className="font-serif text-lg font-semibold">Dernières réservations</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {data.recentBookings.length === 0 ? (
              <p className="px-5 py-8 text-sm text-zinc-400 text-center">Aucune réservation</p>
            ) : data.recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{booking.guest_name}</p>
                  <p className="text-xs text-zinc-400">
                    {(booking.room as unknown as { name?: string } | null)?.name} · {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[#C9A84C]">{formatPrice(booking.total_price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
