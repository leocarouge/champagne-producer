'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { ShoppingCart, Menu, X, LayoutDashboard } from 'lucide-react'
import { useCart } from '@/components/providers/CartProvider'
import { cn } from '@/lib/utils'
import { CartDrawer } from '@/components/shop/CartDrawer'
import { useSession } from 'next-auth/react'

const navLinks = [
  { href: '/boutique', label: 'Boutique' },
  { href: '/chambres', label: 'Logement' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const pathname = usePathname()
  const { bottleCount } = useCart()
  const { data: session } = useSession()
  const isAdmin = (session?.user as { role?: string })?.role === 'admin'

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isHomepage = pathname === '/'
  const transparent = isHomepage && !isScrolled

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          transparent
            ? 'bg-transparent text-white'
            : 'bg-white/95 backdrop-blur-md text-black shadow-sm border-b border-gold-100'
        )}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/cropped-cropped-logocarouge.png"
                alt="Champagne Carouge-Cireddu"
                width={40}
                height={40}
                className="object-contain"
              />
              <div>
                <span className={cn(
                  'font-serif text-lg font-bold tracking-widest uppercase transition-colors',
                  transparent ? 'text-white' : 'text-zinc-900'
                )}>
                  Carouge-Cireddu
                </span>
                <span
                  className={cn(
                    'block text-[9px] tracking-[0.3em] uppercase transition-colors',
                    transparent ? 'text-[#C9A84C]' : 'text-[#C9A84C]'
                  )}
                >
                  Champagne · Flavigny
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm tracking-widest uppercase font-medium transition-colors relative group',
                    transparent ? 'text-white/80 hover:text-white' : 'text-zinc-700 hover:text-black',
                    pathname.startsWith(link.href) && (transparent ? 'text-white' : 'text-black')
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      'absolute -bottom-1 left-0 w-0 h-px bg-[#C9A84C] transition-all group-hover:w-full',
                      pathname.startsWith(link.href) && 'w-full'
                    )}
                  />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    'hidden md:flex items-center gap-1.5 text-xs tracking-widest uppercase font-medium px-3 py-1.5 rounded-full border transition-colors',
                    transparent
                      ? 'border-white/30 text-white/80 hover:bg-white/10 hover:text-white'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-black'
                  )}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}

              <button
                onClick={() => setCartOpen(true)}
                className={cn(
                  'relative p-2 rounded-full transition-colors',
                  transparent ? 'hover:bg-white/10 text-white' : 'hover:bg-zinc-100 text-zinc-700'
                )}
                aria-label="Panier"
              >
                <ShoppingCart className="w-5 h-5" />
                {bottleCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#C9A84C] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {bottleCount > 9 ? '9+' : bottleCount}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={cn(
                  'md:hidden p-2 rounded-full transition-colors',
                  transparent ? 'hover:bg-white/10 text-white' : 'hover:bg-zinc-100 text-zinc-700'
                )}
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-zinc-100 shadow-lg">
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'text-sm tracking-widest uppercase font-medium text-zinc-700 hover:text-black py-2 border-b border-zinc-100',
                    pathname.startsWith(link.href) && 'text-[#C9A84C]'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm tracking-widest uppercase font-medium text-[#C9A84C] py-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Administration
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
