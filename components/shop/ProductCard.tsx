'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/components/providers/CartProvider'
import { toast } from '@/components/ui/use-toast'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  'brut': 'Brut',
  'rosé': 'Rosé',
  'blanc-de-blancs': 'Blanc de Blancs',
  'millésime': 'Millésimé',
  'prestige': 'Prestige',
  'autre': 'Autre',
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

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (product.stock === 0) return
    addItem(product, 1)
    toast({
      title: 'Ajouté au panier',
      description: `${product.name} a été ajouté à votre panier.`,
      variant: 'success',
    })
  }

  return (
    <Link href={`/boutique/${product.slug}`} className="group block">
      <div className="bg-white border border-zinc-100 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-zinc-50">
          <Image
            src={getBottleImage(product)}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <Badge variant="default" className="text-[10px]">
              {CATEGORY_LABELS[product.category] ?? product.category}
            </Badge>
            {product.featured && (
              <Badge variant="outline" className="text-[10px] bg-white/90 border-[#C9A84C] text-[#C9A84C]">
                Coup de cœur
              </Badge>
            )}
          </div>

          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white/90 text-black text-xs font-semibold px-3 py-1.5 rounded tracking-widest uppercase">
                Épuisé
              </span>
            </div>
          )}

          {/* Quick add overlay */}
          {product.stock > 0 && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
              <Button
                size="sm"
                onClick={handleAddToCart}
                className="gap-2 shadow-lg"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Ajouter
              </Button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-serif text-base font-semibold text-zinc-900 group-hover:text-[#C9A84C] transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-zinc-500 text-xs mt-1 line-clamp-2 leading-relaxed">
            {product.description.substring(0, 80)}...
          </p>
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="font-serif text-lg font-semibold text-[#C9A84C]">
                {formatPrice(product.price)}
              </span>
              <span className="text-[10px] text-zinc-400 ml-1.5">
                {product.name.toLowerCase().includes('magnum') ? '1,5 L' : '75 cl'}
              </span>
            </div>
            {product.stock > 0 && product.stock <= 5 && (
              <span className="text-[10px] text-orange-500 font-medium">
                Plus que {product.stock}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
