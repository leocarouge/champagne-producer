'use client'

import Image from 'next/image'
import Link from 'next/link'
import { X, Minus, Plus, ShoppingBag, Truck } from 'lucide-react'
import { useCart } from '@/components/providers/CartProvider'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { SHIPPING_RATES } from '@/lib/shipping'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, subtotal, shippingCost, total, bottleCount, updateQuantity, removeItem } = useCart()

  const nextTierThreshold = () => {
    for (const rate of SHIPPING_RATES) {
      if (bottleCount < rate.minBottles) return rate.minBottles
    }
    return null
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#C9A84C]" />
            <h2 className="font-serif text-lg font-semibold">Mon Panier</h2>
            {bottleCount > 0 && (
              <span className="text-xs bg-[#C9A84C] text-white rounded-full px-2 py-0.5 font-medium">
                {bottleCount}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
              <ShoppingBag className="w-12 h-12 text-zinc-200" />
              <div>
                <p className="font-serif text-lg text-zinc-600">Votre panier est vide</p>
                <p className="text-sm text-zinc-400 mt-1">Découvrez nos champagnes d&apos;exception</p>
              </div>
              <Button asChild onClick={onClose}>
                <Link href="/boutique">Voir la boutique</Link>
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3 p-3 bg-zinc-50 rounded-lg">
                  <div className="relative w-16 h-20 rounded overflow-hidden bg-white shrink-0">
                    {item.product.image_url ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-100" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-sm font-medium text-zinc-900 truncate">{item.product.name}</h4>
                    <p className="text-[#C9A84C] font-semibold text-sm mt-0.5">
                      {formatPrice(item.product.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded border border-zinc-200 flex items-center justify-center hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors text-zinc-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-6 h-6 rounded border border-zinc-200 flex items-center justify-center hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="ml-auto text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary & Checkout */}
        {items.length > 0 && (
          <div className="border-t p-5 space-y-4">
            {/* Shipping info */}
            <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-3 text-xs text-amber-800">
              <Truck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Livraison : <strong>{formatPrice(shippingCost)}</strong> pour {bottleCount} bouteille{bottleCount > 1 ? 's' : ''}
              </span>
            </div>

            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Sous-total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Livraison</span>
                <span>{formatPrice(shippingCost)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t pt-2 mt-2">
                <span className="font-serif">Total</span>
                <span className="text-[#C9A84C]">{formatPrice(total)}</span>
              </div>
            </div>

            <Button asChild size="lg" className="w-full" onClick={onClose}>
              <Link href="/checkout">Commander</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
