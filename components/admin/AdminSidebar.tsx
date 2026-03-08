'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Wine,
  ShoppingBag,
  BedDouble,
  BarChart3,
  Users,
  LogOut,
  ChevronRight,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Produits', icon: Wine },
  { href: '/admin/orders', label: 'Commandes', icon: ShoppingBag },
  { href: '/admin/bookings', label: 'Réservations', icon: BedDouble },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/analytics', label: 'Analytiques', icon: BarChart3 },
  { href: '/admin/settings', label: 'Paramètres', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-zinc-950 text-white flex flex-col shrink-0">
      {/* Brand */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Wine className="w-5 h-5 text-[#C9A84C]" />
          <div>
            <p className="font-serif font-bold tracking-widest text-sm uppercase">Carouge-Cireddu</p>
            <p className="text-[10px] text-zinc-500 tracking-widest uppercase">Administration</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                active
                  ? 'bg-[#C9A84C] text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              )}
            >
              <Icon className={cn('w-4 h-4', active ? 'text-white' : 'text-zinc-500 group-hover:text-white')} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800"
        >
          Voir le site
          <ChevronRight className="w-3 h-3" />
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
