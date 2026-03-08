import type { Metadata } from 'next'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez Champagne Carouge-Cireddu pour toute question, réservation de visite ou commande personnalisée.',
}

export default function ContactPage() {
  return (
    <div className="pt-20">
      {/* Header */}
      <div className="bg-zinc-950 text-white py-16 text-center">
        <p className="text-[#C9A84C] text-xs tracking-[0.4em] uppercase mb-3">Carouge-Cireddu · Flavigny</p>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">Contact</h1>
        <p className="text-zinc-400 max-w-lg mx-auto text-sm">
          Nous sommes à votre disposition pour toute demande — visite, commande, ou simplement pour partager votre amour du champagne.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-16 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div>
            <h2 className="font-serif text-2xl font-bold text-zinc-900 mb-8">Nous trouver</h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#C9A84C]" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">Adresse</p>
                  <p className="text-zinc-500 text-sm mt-0.5">6 Rue de l&apos;Église<br />Flavigny, 51190, France</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#C9A84C]" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">Téléphone</p>
                  <a href="tel:+33677959062" className="text-zinc-500 text-sm mt-0.5 hover:text-[#C9A84C] transition-colors">
                    06 77 95 90 62
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#C9A84C]" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">Email</p>
                  <a href="mailto:champagnecarougecireddu@gmail.com" className="text-zinc-500 text-sm mt-0.5 hover:text-[#C9A84C] transition-colors">
                    champagnecarougecireddu@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#C9A84C]" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">Horaires d&apos;ouverture</p>
                  <div className="text-zinc-500 text-sm mt-0.5 space-y-0.5">
                    <p>Lundi – Vendredi : 9h00 – 18h00</p>
                    <p>Samedi : 10h00 – 17h00</p>
                    <p>Dimanche : sur rendez-vous</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="mt-8 rounded-xl overflow-hidden border border-zinc-100 h-52 bg-zinc-100 flex items-center justify-center">
              <div className="text-center text-zinc-400">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Flavigny, 51190, Marne</p>
                <a
                  href="https://maps.google.com/?q=6+Rue+de+l'Église+Flavigny+51190+France"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C9A84C] text-xs hover:underline mt-1 block"
                >
                  Ouvrir dans Google Maps
                </a>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white border border-zinc-100 rounded-xl shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-zinc-900 mb-6">Envoyer un message</h2>

            <form className="space-y-5" action="#" method="POST">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" name="firstName" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" name="lastName" required className="mt-1" />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required className="mt-1" />
              </div>

              <div>
                <Label htmlFor="subject">Sujet</Label>
                <select
                  id="subject"
                  name="subject"
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option>Commande de champagne</option>
                  <option>Réservation de chambre</option>
                  <option>Visite de cave</option>
                  <option>Demande professionnelle</option>
                  <option>Autre</option>
                </select>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="Votre message..."
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                Envoyer le message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
