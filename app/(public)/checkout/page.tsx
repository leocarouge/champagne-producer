'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCart } from '@/components/providers/CartProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice } from '@/lib/utils'
import { Truck, Lock } from 'lucide-react'

interface CheckoutForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, shippingCost, total, bottleCount } = useCart()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CheckoutForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
  })

  if (items.length === 0) {
    router.replace('/boutique')
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          customer: {
            name: `${form.firstName} ${form.lastName}`,
            email: form.email,
            phone: form.phone,
          },
          shippingAddress: {
            line1: form.address,
            city: form.city,
            postal_code: form.postalCode,
            country: form.country,
          },
        }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error ?? 'Une erreur est survenue')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du paiement')
      setLoading(false)
    }
  }

  return (
    <div className="pt-20 min-h-screen bg-zinc-50">
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-serif text-3xl font-bold text-zinc-900 mb-10 text-center">Commande</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          {/* Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6 sm:p-8 space-y-6">
              <h2 className="font-serif text-xl font-semibold">Informations personnelles</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} required className="mt-1" />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required className="mt-1" />
              </div>

              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} className="mt-1" />
              </div>

              <div className="border-t pt-6">
                <h2 className="font-serif text-xl font-semibold mb-4">Adresse de livraison</h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Adresse *</Label>
                    <Input id="address" name="address" value={form.address} onChange={handleChange} required className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">Code postal *</Label>
                      <Input id="postalCode" name="postalCode" value={form.postalCode} onChange={handleChange} required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="city">Ville *</Label>
                      <Input id="city" name="city" value={form.city} onChange={handleChange} required className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="country">Pays *</Label>
                    <Input id="country" name="country" value={form.country} onChange={handleChange} required className="mt-1" />
                  </div>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Redirection vers le paiement...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Payer {formatPrice(total)}
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3" />
                Paiement sécurisé par Stripe
              </p>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6 sticky top-24">
              <h2 className="font-serif text-xl font-semibold mb-5">Votre commande</h2>

              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="relative w-12 h-16 rounded overflow-hidden bg-zinc-50 shrink-0">
                      {item.product.image_url && (
                        <Image src={item.product.image_url} alt={item.product.name} fill className="object-cover" sizes="48px" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 truncate">{item.product.name}</p>
                      <p className="text-xs text-zinc-400">× {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#C9A84C] shrink-0">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <span>Sous-total ({bottleCount} bouteille{bottleCount > 1 ? 's' : ''})</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    Livraison
                  </span>
                  <span>{formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                  <span className="font-serif">Total</span>
                  <span className="text-[#C9A84C]">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
