import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/shop/ProductCard'
import type { ProductCategory } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Boutique',
  description: 'Découvrez et commandez nos champagnes d\'exception — Brut, Rosé, Blanc de Blancs, Millésimés et Cuvées Prestige.',
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'brut', label: 'Sélection' },
  { value: 'rosé', label: 'Rosé' },
  { value: 'blanc-de-blancs', label: 'Blanc de Blancs' },
  { value: 'prestige', label: 'Prestige' },
  { value: 'magnum', label: 'Magnums' },
]

const CATEGORY_ORDER: Record<string, number> = {
  'brut': 1,
  'rosé': 2,
  'blanc-de-blancs': 3,
  'millésime': 4,
  'prestige': 5,
}

interface Props {
  searchParams: { category?: string }
}

async function getProducts(category?: string) {
  let query = supabase.from('products').select('*').eq('active', true)

  if (category === 'magnum') {
    query = (query as any).ilike('name', '%magnum%')
  } else if (category && category !== 'all') {
    query = query.eq('category', category as ProductCategory)
    query = (query as any).not('name', 'ilike', '%magnum%')
  } else {
    // Vue par défaut : exclure les magnums
    query = (query as any).not('name', 'ilike', '%magnum%')
  }

  const { data } = await query.order('price', { ascending: true })
  const sorted = (data ?? []).sort((a: { category: string; price: number }, b: { category: string; price: number }) => {
    const aOrd = CATEGORY_ORDER[a.category] ?? 99
    const bOrd = CATEGORY_ORDER[b.category] ?? 99
    if (aOrd !== bOrd) return aOrd - bOrd
    return a.price - b.price
  })
  return sorted
}

export default async function BoutiquePage({ searchParams }: Props) {
  const category = searchParams.category ?? 'all'
  const products = await getProducts(category)

  return (
    <div className="pt-20">
      {/* Hero Banner */}
      <div className="bg-zinc-950 text-white py-16 text-center">
        <p className="text-[#C9A84C] text-xs tracking-[0.4em] uppercase mb-3">Carouge-Cireddu · Flavigny</p>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">Notre Boutique</h1>
        <p className="text-zinc-400 max-w-lg mx-auto text-sm">
          De la vigne à la table, chaque cuvée exprime l&apos;âme d&apos;un terroir d&apos;exception.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-12">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.value}
              href={`/boutique${cat.value !== 'all' ? `?category=${cat.value}` : ''}`}
              aria-current={category === cat.value ? 'page' : undefined}
              className={`px-5 py-2 text-sm rounded-full border transition-colors ${
                category === cat.value
                  ? 'bg-[#C9A84C] text-white border-[#C9A84C]'
                  : 'border-zinc-200 text-zinc-600 hover:border-[#C9A84C] hover:text-[#C9A84C]'
              }`}
            >
              {cat.label}
            </a>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-zinc-400 text-center mb-8">
          {products.length} cuvée{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
        </p>

        {/* Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-zinc-400 font-serif text-xl">Aucune cuvée disponible dans cette catégorie.</p>
          </div>
        )}

        {/* Shipping info */}
        <div className="mt-16 bg-zinc-50 rounded-xl p-8">
          <h2 className="font-serif text-xl font-semibold text-center mb-6 text-zinc-900">
            Frais de livraison
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { label: '1 à 3 bouteilles', price: '12 €' },
              { label: '4 à 6 bouteilles', price: '18 €' },
              { label: '7 à 12 bouteilles', price: '25 €' },
            ].map((tier) => (
              <div key={tier.label} className="text-center p-4 bg-white rounded-lg border border-zinc-100">
                <p className="text-[#C9A84C] font-serif text-2xl font-bold">{tier.price}</p>
                <p className="text-zinc-500 text-sm mt-1">{tier.label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-zinc-400 text-xs mt-4">
            Livraison en France métropolitaine. Expédition soignée en carton renforcé.
          </p>
        </div>
      </div>
    </div>
  )
}
