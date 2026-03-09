'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, ShoppingCart, ArrowLeft, Truck, Shield, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/components/providers/CartProvider'
import { toast } from '@/components/ui/use-toast'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  'brut': 'Brut', 'rosé': 'Rosé', 'blanc-de-blancs': 'Blanc de Blancs',
  'millésime': 'Millésimé', 'prestige': 'Prestige', 'autre': 'Autre',
}

function getBottleImage(product: { image_url?: string | null; slug: string; category: string }): string {
  if (product.image_url) return product.image_url
  const slug = product.slug.toLowerCase()
  const cat = product.category.toLowerCase()
  if (slug.includes('rose') || slug.includes('rosé') || cat.includes('rosé')) return '/images/bouteilles/bouteille-rose.png'
  if (slug.includes('prestige') || cat === 'prestige') return '/images/bouteilles/bouteille-prestige.png'
  if (slug.includes('blanc') || cat === 'blanc-de-blancs') return '/images/bouteilles/bouteille-bdb.png'
  return '/images/bouteilles/bouteille-selection.png'
}

export default function ProductPage() {
  const params = useParams()
  const slug = params.slug as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  useEffect(() => {
    fetch(`/api/products?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data.data ?? null)
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) notFound()

  const handleAddToCart = () => {
    addItem(product, quantity)
    toast({
      title: 'Ajouté au panier',
      description: `${quantity}× ${product.name} ajouté au panier.`,
      variant: 'success',
    })
  }

  return (
    <div className="pt-20">
      <div className="container mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-8">
          <Link href="/boutique" className="hover:text-[#C9A84C] flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Boutique
          </Link>
          <span>/</span>
          <span className="text-zinc-700">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image */}
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-50 max-w-md mx-auto lg:mx-0 w-full">
            <Image
              src={getBottleImage(product)}
              alt={product.name}
              fill
              className="object-contain p-6"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {false && (
              <div className="w-full h-full flex items-center justify-center text-zinc-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.75} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15m-15.6 0v4.5m15.6-4.5v4.5" />
                </svg>
              </div>
            )}
            {product.featured && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-[#C9A84C] text-white">Coup de cœur</Badge>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">
                {CATEGORY_LABELS[product.category] ?? product.category}
              </Badge>
              {product.label && (
                <Badge className="bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30 border">
                  {product.label}
                </Badge>
              )}
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-zinc-900 mb-4">
              {product.name}
            </h1>

            <div className="text-3xl font-serif font-semibold text-[#C9A84C] mb-6">
              {formatPrice(product.price)}
            </div>

            <p className="text-zinc-600 leading-relaxed mb-6 text-base">
              {product.description}
            </p>

            {/* Fiche technique */}
            {(() => {
              const isMagnum = product.name.toLowerCase().includes('magnum')
              const volume = isMagnum ? '1,5 L — Magnum' : '75 cl'
              return (
                <div className="bg-zinc-50 rounded-xl p-5 mb-6 border border-zinc-100">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C] mb-3">Fiche technique</p>
                  <div className="grid grid-cols-1 gap-2.5 text-sm">
                    <div className="flex gap-3">
                      <span className="text-zinc-400 font-medium w-28 shrink-0">Contenant</span>
                      <span className="text-zinc-700">{volume}</span>
                    </div>
                    {product.assemblage && (
                      <div className="flex gap-3">
                        <span className="text-zinc-400 font-medium w-28 shrink-0">Assemblage</span>
                        <span className="text-zinc-700">{product.assemblage}</span>
                      </div>
                    )}
                    {product.vins_reserve && (
                      <div className="flex gap-3">
                        <span className="text-zinc-400 font-medium w-28 shrink-0">Vins de réserve</span>
                        <span className="text-zinc-700">{product.vins_reserve}</span>
                      </div>
                    )}
                    {product.region && (
                      <div className="flex gap-3">
                        <span className="text-zinc-400 font-medium w-28 shrink-0">Région</span>
                        <span className="text-zinc-700">{product.region}</span>
                      </div>
                    )}
                    {product.accord_mets && (
                      <div className="flex gap-3">
                        <span className="text-zinc-400 font-medium w-28 shrink-0">Accords mets</span>
                        <span className="text-zinc-700">{product.accord_mets}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Stock indicator */}
            {product.stock > 0 ? (
              <p className="text-sm text-green-600 font-medium mb-6">
                En stock ({product.stock} disponible{product.stock > 1 ? 's' : ''})
              </p>
            ) : (
              <p className="text-sm text-red-500 font-medium mb-6">Épuisé</p>
            )}

            {/* Quantity + Add to cart */}
            {product.stock > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex items-center border border-zinc-200 rounded-md overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 hover:bg-zinc-50 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-6 py-3 font-semibold min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-3 hover:bg-zinc-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart}>
                  <ShoppingCart className="w-5 h-5" />
                  Ajouter au panier
                </Button>
              </div>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 border-t border-zinc-100 pt-6">
              {[
                { icon: Truck, label: 'Livraison soignée', sub: 'Carton renforcé' },
                { icon: Shield, label: 'Paiement sécurisé', sub: 'Stripe SSL' },
                { icon: Award, label: 'Qualité garantie', sub: 'Champagne de vigneron' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="text-center">
                  <Icon className="w-5 h-5 text-[#C9A84C] mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-zinc-700">{label}</p>
                  <p className="text-[10px] text-zinc-400">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
