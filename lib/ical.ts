import ical from 'ical-generator'
import nodeIcal from 'node-ical'
import { supabaseAdmin } from './supabase'
import type { Booking } from '@/types'

// ============================================================
// EXPORT — Generate iCal feed for a room
// ============================================================
export function generateICalFeed(bookings: Booking[], roomName: string): string {
  const cal = ical({
    name: `Maison Lambert — ${roomName}`,
    description: `Calendrier de disponibilité — ${roomName}`,
    prodId: { company: 'Maison Lambert', product: 'Chambres d\'hôtes' },
    timezone: 'Europe/Paris',
  })

  for (const booking of bookings) {
    if (booking.status === 'cancelled') continue

    cal.createEvent({
      uid: booking.external_uid ?? `maison-lambert-${booking.id}`,
      start: new Date(booking.check_in),
      end: new Date(booking.check_out),
      summary: booking.source === 'direct'
        ? `Réservation — ${booking.guest_name}`
        : 'Airbnb reservation',
      description: booking.notes ?? '',
      allDay: true,
    })
  }

  return cal.toString()
}

// ============================================================
// IMPORT — Sync Airbnb iCal feed into database
// ============================================================
export async function syncAirbnbCalendar(
  roomId: string,
  icalUrl: string
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const errors: string[] = []
  let created = 0
  let skipped = 0

  let events: Record<string, nodeIcal.CalendarComponent>
  try {
    events = await nodeIcal.async.fromURL(icalUrl)
  } catch {
    throw new Error(`Impossible de récupérer le calendrier Airbnb: ${icalUrl}`)
  }

  for (const key in events) {
    const event = events[key]
    if (event.type !== 'VEVENT') continue

    const uid = event.uid as string
    const checkIn = event.start as Date
    const checkOut = event.end as Date

    if (!checkIn || !checkOut) continue

    // Skip already-imported events
    const { data: existing } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('external_uid', uid)
      .single()

    if (existing) {
      skipped++
      continue
    }

    const nights = Math.round(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Fetch room price
    const { data: room } = await supabaseAdmin
      .from('rooms')
      .select('price_per_night')
      .eq('id', roomId)
      .single()

    if (!room) {
      errors.push(`Chambre introuvable: ${roomId}`)
      continue
    }

    const summary = (event.summary as string | undefined) ?? 'Airbnb'
    const guestName = summary.replace(/airbnb/i, '').trim() || 'Airbnb Guest'

    const { error } = await supabaseAdmin.from('bookings').insert({
      room_id: roomId,
      guest_name: guestName,
      guest_email: 'airbnb@sync.local',
      check_in: checkIn.toISOString().split('T')[0],
      check_out: checkOut.toISOString().split('T')[0],
      total_price: room.price_per_night * nights,
      status: 'confirmed',
      source: 'airbnb',
      external_uid: uid,
      notes: event.description as string | undefined,
    })

    if (error) {
      // Overlap conflict — skip gracefully
      if (error.code === '23505' || error.message?.includes('overlap')) {
        skipped++
      } else {
        errors.push(`Erreur pour ${uid}: ${error.message}`)
      }
    } else {
      created++
    }
  }

  return { created, skipped, errors }
}
