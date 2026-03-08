import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-zinc-800">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/cropped-cropped-logocarouge.png"
                alt="Champagne Carouge-Cireddu"
                width={44}
                height={44}
                className="object-contain"
              />
              <div>
                <span className="font-serif text-lg font-bold tracking-widest uppercase">Carouge-Cireddu</span>
                <span className="block text-[9px] tracking-[0.3em] uppercase text-[#C9A84C]">Champagne · Flavigny</span>
              </div>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Récoltant-manipulant à Flavigny (Marne), nous élaborons nos champagnes avec passion. De la vigne à la bouteille, un savoir-faire familial authentique.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" aria-label="Instagram" className="w-9 h-9 border border-zinc-700 rounded-full flex items-center justify-center hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Facebook" className="w-9 h-9 border border-zinc-700 rounded-full flex items-center justify-center hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Boutique */}
          <div>
            <h3 className="text-xs tracking-[0.3em] uppercase text-[#C9A84C] font-semibold mb-5">Boutique</h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              {[
                { href: '/boutique', label: 'Tous nos champagnes' },
                { href: '/boutique?category=brut', label: 'Brut' },
                { href: '/boutique?category=rosé', label: 'Rosé' },
                { href: '/boutique?category=blanc-de-blancs', label: 'Blanc de Blancs' },
                { href: '/boutique?category=millésime', label: 'Millésimés' },
                { href: '/boutique?category=prestige', label: 'Cuvées Prestige' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Séjour */}
          <div>
            <h3 className="text-xs tracking-[0.3em] uppercase text-[#C9A84C] font-semibold mb-5">Séjour</h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              {[
                { href: '/chambres', label: 'Logement complet' },
                { href: '/contact', label: 'Nous contacter' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs tracking-[0.3em] uppercase text-[#C9A84C] font-semibold mb-5">Contact</h3>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li className="flex gap-3">
                <MapPin className="w-4 h-4 text-[#C9A84C] shrink-0 mt-0.5" />
                <span>6 Rue de l&apos;Église<br />Flavigny, 51190, France</span>
              </li>
              <li className="flex gap-3 items-center">
                <Phone className="w-4 h-4 text-[#C9A84C] shrink-0" />
                <a href="tel:+33677959062" className="hover:text-white transition-colors">06 77 95 90 62</a>
              </li>
              <li className="flex gap-3 items-center">
                <Mail className="w-4 h-4 text-[#C9A84C] shrink-0" />
                <a href="mailto:champagnecarougecireddu@gmail.com" className="hover:text-white transition-colors">champagnecarougecireddu@gmail.com</a>
              </li>
            </ul>
            <div className="mt-5 text-xs text-zinc-500">
              <p>Lun–Sam : 9h–18h</p>
              <p>Dim : sur rendez-vous</p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-600">
          <p>© {new Date().getFullYear()} Champagne Carouge-Cireddu. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link href="/mentions-legales" className="hover:text-zinc-400 transition-colors">Mentions légales</Link>
            <Link href="/confidentialite" className="hover:text-zinc-400 transition-colors">Confidentialité</Link>
            <Link href="/cgv" className="hover:text-zinc-400 transition-colors">CGV</Link>
          </div>
          <p className="text-zinc-700 text-[10px]">L'abus d'alcool est dangereux pour la santé.</p>
        </div>
      </div>
    </footer>
  )
}
