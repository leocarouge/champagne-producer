import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Users, Wifi, UtensilsCrossed, Car, Check } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Logement entier — Séjour à Flavigny',
  description: 'Séjournez dans notre logement entier au cœur du vignoble champenois à Flavigny, Marne. 2 nuits minimum.',
}

const PHOTOS = [
  '/images/logement/hote_salon.jpg',
  '/images/logement/hote_salon2.jpg',
  '/images/logement/hote_cuisine.jpg',
  '/images/logement/hote_chambre1.jpg',
  '/images/logement/hote_samanger.jpg',
  '/images/logement/hote_samanger2.jpg',
  '/images/logement/hote_samanger3.jpg',
  '/images/logement/img_2563.jpg',
  '/images/logement/img_2567.jpg',
  '/images/logement/img_2573.jpg',
  '/images/logement/img_2575.jpg',
  '/images/logement/img_2577.jpg',
]

export default function ChambresPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <div className="relative h-[60vh] min-h-[450px] overflow-hidden">
        <Image
          src="/images/logement/hote_salon.jpg"
          alt="Logement Carouge-Cireddu à Flavigny"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-6">
          <p className="text-[#C9A84C] text-xs tracking-[0.4em] uppercase mb-4">Flavigny · Marne · 51190</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">Logement entier</h1>
          <p className="text-white/80 max-w-xl text-lg">
            Un logement complet au cœur du vignoble champenois. 2 nuits minimum — idéal pour un week-end en famille ou entre amis.
          </p>
          <Button asChild size="lg" className="mt-8 gap-2">
            <Link href="/chambres/logement-complet">
              Réserver <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Description + infos */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-[#C9A84C] text-xs tracking-[0.4em] uppercase mb-3">Le logement</p>
              <h2 className="font-serif text-3xl font-bold text-zinc-900 mb-6">Un havre de paix champenois</h2>
              <p className="text-zinc-600 leading-relaxed mb-4">
                Situé à Flavigny, au cœur du vignoble, notre logement entier vous offre un cadre authentique et chaleureux pour un séjour inoubliable. Cuisine équipée, salon, chambres — tout le confort d'une maison, avec le champagne à portée de main.
              </p>
              <p className="text-zinc-600 leading-relaxed mb-6">
                Profitez d'une dégustation de nos cuvées sur place et découvrez les secrets de l'élaboration du champagne lors d'une visite de notre cave.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {['Cuisine équipée', 'Salon & salle à manger', 'Wi-Fi inclus', 'Parking gratuit', 'Dégustation sur place', 'Linge de maison fourni', 'Jardin privatif', 'Barbecue'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-zinc-600">
                    <Check className="w-3.5 h-3.5 text-[#C9A84C] shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <Users className="w-5 h-5 text-[#C9A84C] shrink-0" />
                <div>
                  <p className="font-semibold text-zinc-900 text-sm">Capacité</p>
                  <p className="text-zinc-500 text-sm">Jusqu'à 8 personnes</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <Wifi className="w-5 h-5 text-[#C9A84C] shrink-0" />
                <div>
                  <p className="font-semibold text-zinc-900 text-sm">Wi-Fi haut débit</p>
                  <p className="text-zinc-500 text-sm">Inclus sans supplément</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <UtensilsCrossed className="w-5 h-5 text-[#C9A84C] shrink-0" />
                <div>
                  <p className="font-semibold text-zinc-900 text-sm">Cuisine équipée</p>
                  <p className="text-zinc-500 text-sm">Réfrigérateur, plaques, four...</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <Car className="w-5 h-5 text-[#C9A84C] shrink-0" />
                <div>
                  <p className="font-semibold text-zinc-900 text-sm">Parking</p>
                  <p className="text-zinc-500 text-sm">Gratuit sur place</p>
                </div>
              </div>
              <div className="p-5 bg-zinc-950 text-white rounded-xl text-center">
                <p className="text-[#C9A84C] text-xs tracking-widest uppercase mb-1">À partir de</p>
                <p className="font-serif text-4xl font-bold">300 €<span className="text-lg font-normal text-zinc-400"> / nuit</span></p>
                <p className="text-zinc-400 text-xs mt-1">2 nuits minimum</p>
                <Button asChild className="w-full mt-4 gap-2">
                  <Link href="/chambres/logement-complet">
                    Voir les disponibilités <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo gallery */}
      <section className="pb-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <p className="text-[#C9A84C] text-xs tracking-[0.4em] uppercase mb-3">Galerie</p>
          <h2 className="font-serif text-3xl font-bold text-zinc-900 mb-8">Le logement en images</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PHOTOS.map((src, i) => (
              <div key={src} className={`relative overflow-hidden rounded-xl ${i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'}`}>
                <Image
                  src={src}
                  alt={`Logement Carouge-Cireddu photo ${i + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="py-12 bg-zinc-50 border-t border-zinc-100">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { label: 'Check-in', value: 'à partir de 15h00' },
              { label: 'Check-out', value: "jusqu'à 11h00" },
              { label: 'Séjour minimum', value: '2 nuits' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl p-6 border border-zinc-100">
                <p className="text-[#C9A84C] text-xs tracking-widest uppercase font-semibold mb-1">{label}</p>
                <p className="font-serif text-lg font-medium text-zinc-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
