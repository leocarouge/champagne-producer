import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Leaf, Clock, Users, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/shop/ProductCard'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getFeaturedProducts() {
  const { data } = await (supabase as any)
    .from('products')
    .select('*')
    .eq('featured', true)
    .eq('active', true)
    .not('name', 'ilike', '%magnum%')
    .order('price', { ascending: true })
    .limit(4)
  return data ?? []
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts()

  return (
    <>
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image
          src="/images/accueil/photoaccueil.jpg"
          alt="Champagne Carouge-Cireddu — Flavigny"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
          <p className="text-[#C9A84C] text-xs tracking-[0.5em] uppercase mb-6 font-medium">
            Flavigny · Marne
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6">
            Champagne<br />
            <span className="text-[#C9A84C]">Carouge-Cireddu</span>
          </h1>
          <p className="text-white/80 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Champagnes artisanaux élaborés à Flavigny, dans la Marne.
            Découvrez notre Sélection et notre Rosé — de la vigne à la bouteille, un savoir-faire familial authentique.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="xl" className="gap-2">
              <Link href="/boutique">
                Découvrir notre boutique
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
              <Link href="/chambres">Nos chambres</Link>
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60">
          <span className="text-[10px] tracking-[0.3em] uppercase">Découvrir</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/60 to-transparent animate-pulse" />
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-zinc-950 text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Clock, label: 'Flavigny, Marne', desc: 'Au cœur du vignoble champenois' },
              { icon: Leaf, label: 'Vignoble familial', desc: 'Vignes cultivées avec soin' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-5 h-5 text-[#C9A84C]" />
                </div>
                <h3 className="font-serif text-base font-semibold mb-1">{label}</h3>
                <p className="text-zinc-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-[#C9A84C] text-xs tracking-[0.4em] uppercase mb-3">Nos cuvées</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-zinc-900">
              Champagnes d&apos;exception
            </h2>
            <div className="w-16 h-px bg-[#C9A84C] mx-auto mt-5" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" variant="outline">
              <Link href="/boutique" className="gap-2">
                Toute la boutique
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Logement */}
      <section className="py-20 bg-zinc-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-[#C9A84C] text-xs tracking-[0.4em] uppercase mb-3">Séjour</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-zinc-900">Logement entier</h2>
            <p className="text-zinc-500 mt-4 max-w-xl mx-auto">
              Séjournez dans notre logement au cœur du vignoble. 2 nuits minimum — idéal pour un week-end au champagne.
            </p>
            <div className="w-16 h-px bg-[#C9A84C] mx-auto mt-5" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
            {/* Photos grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                '/images/logement/hote_salon.jpg',
                '/images/logement/hote_cuisine.jpg',
                '/images/logement/hote_chambre1.jpg',
                '/images/logement/hote_samanger.jpg',
              ].map((src, i) => (
                <div key={src} className="relative aspect-square rounded-xl overflow-hidden">
                  <Image src={src} alt={`Logement photo ${i + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-500" sizes="25vw" />
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="bg-white rounded-2xl p-8 border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#C9A84C]" />
                <span className="text-sm text-zinc-500">Jusqu&apos;à 8 personnes</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-zinc-900 mb-3">Logement complet à Flavigny</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-5">
                Cuisine équipée, salon, chambres, jardin — tout le confort d&apos;une maison de charme au cœur du vignoble champenois.
              </p>
              <div className="grid grid-cols-2 gap-1.5 mb-6">
                {['Cuisine équipée', 'Wi-Fi inclus', 'Parking gratuit', 'Jardin privatif'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-zinc-600">
                    <Check className="w-3.5 h-3.5 text-[#C9A84C] shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                <div>
                  <span className="font-serif text-3xl font-bold text-[#C9A84C]">200 €</span>
                  <span className="text-zinc-400 text-sm"> / nuit · 2 nuits min.</span>
                </div>
                <Button asChild className="gap-2">
                  <Link href="/chambres">
                    Réserver <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
