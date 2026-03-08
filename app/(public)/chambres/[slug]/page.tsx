'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Users, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice } from '@/lib/utils'
import type { Room } from '@/types'
import { addDays, differenceInDays, format, isAfter, isBefore, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function RoomDetailPage() {
  const { slug } = useParams() as { slug: string }
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [bookedDates, setBookedDates] = useState<string[]>([])

  // Booking form
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [booking, setBooking] = useState<{ submitting: boolean; success: boolean; error: string }>({
    submitting: false, success: false, error: '',
  })

  useEffect(() => {
    fetch(`/api/rooms?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => { setRoom(d.data); setLoading(false) })
  }, [slug])

  useEffect(() => {
    if (!room) return
    fetch(`/api/bookings?roomId=${room.id}&status=confirmed`)
      .then((r) => r.json())
      .then((d) => {
        const dates: string[] = []
        for (const b of d.data ?? []) {
          let cur = parseISO(b.check_in)
          const end = parseISO(b.check_out)
          while (isBefore(cur, end)) {
            dates.push(format(cur, 'yyyy-MM-dd'))
            cur = addDays(cur, 1)
          }
        }
        setBookedDates(dates)
      })
  }, [room])

  const MIN_NIGHTS = 2

  const nights = checkIn && checkOut
    ? Math.max(0, differenceInDays(parseISO(checkOut), parseISO(checkIn)))
    : 0

  const isDateBooked = (date: string) => bookedDates.includes(date)

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!room || nights < MIN_NIGHTS) return
    setBooking({ submitting: true, success: false, error: '' })

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: room.id,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        check_in: checkIn,
        check_out: checkOut,
        notes,
        total_price: room.price_per_night * nights,
        status: 'confirmed',
        source: 'direct',
      }),
    })

    const data = await res.json()
    if (res.ok) {
      setBooking({ submitting: false, success: true, error: '' })
    } else {
      setBooking({ submitting: false, success: false, error: data.error ?? 'Erreur lors de la réservation' })
    }
  }

  if (loading) {
    return <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
    </div>
  }

  if (!room) {
    return <div className="pt-20 min-h-screen flex items-center justify-center">
      <p className="text-zinc-500">Chambre introuvable.</p>
    </div>
  }

  return (
    <div className="pt-20">
      <div className="container mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <Link href="/chambres" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-[#C9A84C] mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Toutes les chambres
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Photos */}
          <div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
              {room.photos[currentPhoto] ? (
                <Image
                  src={room.photos[currentPhoto]}
                  alt={`${room.name} - Photo ${currentPhoto + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-zinc-100" />
              )}
              {room.photos.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPhoto((p) => (p - 1 + room.photos.length) % room.photos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPhoto((p) => (p + 1) % room.photos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {room.photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPhoto(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentPhoto ? 'bg-white' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {room.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {room.photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhoto(i)}
                    className={`relative w-20 h-14 rounded overflow-hidden shrink-0 border-2 transition-colors ${i === currentPhoto ? 'border-[#C9A84C]' : 'border-transparent'}`}
                  >
                    <Image src={photo} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}

            {/* Room info */}
            <div className="mt-6">
              <h1 className="font-serif text-3xl font-bold text-zinc-900 mb-3">{room.name}</h1>
              <div className="flex items-center gap-2 text-zinc-500 mb-4">
                <Users className="w-4 h-4" />
                <span className="text-sm">Jusqu&apos;à {room.capacity} personne{room.capacity > 1 ? 's' : ''}</span>
              </div>
              <p className="text-zinc-600 leading-relaxed mb-6">{room.description}</p>

              {/* Amenities */}
              <div className="grid grid-cols-2 gap-2">
                {room.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-sm text-zinc-600">
                    <Check className="w-3.5 h-3.5 text-[#C9A84C] shrink-0" />
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking form */}
          <div>
            <div className="bg-white border border-zinc-100 rounded-xl shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="font-serif text-3xl font-bold text-[#C9A84C]">
                    {formatPrice(room.price_per_night)}
                  </span>
                  <span className="text-zinc-400 text-sm"> / nuit</span>
                </div>
                {nights > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-zinc-500">{nights} nuit{nights > 1 ? 's' : ''}</p>
                    <p className="font-serif font-bold text-lg text-zinc-900">
                      {formatPrice(room.price_per_night * nights)}
                    </p>
                  </div>
                )}
              </div>

              {booking.success ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-green-500" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-2">Réservation confirmée !</h3>
                  <p className="text-zinc-500 text-sm">
                    Vous recevrez une confirmation par email. Au plaisir de vous accueillir chez Champagne Carouge-Cireddu à Flavigny.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBooking} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="checkIn">Arrivée</Label>
                      <Input
                        id="checkIn"
                        type="date"
                        value={checkIn}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        onChange={(e) => setCheckIn(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkOut">Départ</Label>
                      <Input
                        id="checkOut"
                        type="date"
                        value={checkOut}
                        min={checkIn ? format(addDays(parseISO(checkIn), MIN_NIGHTS), 'yyyy-MM-dd') : format(addDays(new Date(), MIN_NIGHTS), 'yyyy-MM-dd')}
                        onChange={(e) => setCheckOut(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="guestName">Nom complet</Label>
                    <Input id="guestName" value={guestName} onChange={(e) => setGuestName(e.target.value)} required className="mt-1" />
                  </div>

                  <div>
                    <Label htmlFor="guestEmail">Email</Label>
                    <Input id="guestEmail" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required className="mt-1" />
                  </div>

                  <div>
                    <Label htmlFor="guestPhone">Téléphone</Label>
                    <Input id="guestPhone" type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="mt-1" />
                  </div>

                  <div>
                    <Label htmlFor="notes">Message (optionnel)</Label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="mt-1 w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      placeholder="Heure d'arrivée prévue, demandes spéciales..."
                    />
                  </div>

                  {booking.error && (
                    <p className="text-sm text-red-500 bg-red-50 rounded p-3">{booking.error}</p>
                  )}

                  {nights > 0 && nights < MIN_NIGHTS && (
                    <p className="text-sm text-amber-600 bg-amber-50 rounded p-3">
                      Séjour minimum : {MIN_NIGHTS} nuits.
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={booking.submitting || nights < MIN_NIGHTS}
                  >
                    {booking.submitting ? 'Réservation en cours...' : `Réserver ${nights >= MIN_NIGHTS ? `— ${formatPrice(room.price_per_night * nights)}` : ''}`}
                  </Button>

                  <p className="text-xs text-zinc-400 text-center">
                    2 nuits minimum · Annulation gratuite jusqu&apos;à 48h avant l&apos;arrivée.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
