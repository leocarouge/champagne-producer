import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendBookingConfirmationToClient, sendBookingNotificationToAdmin } from '@/lib/emails'

const BookingSchema = z.object({
  room_id: z.string().uuid(),
  guest_name: z.string().min(1).max(200),
  guest_email: z.string().email(),
  guest_phone: z.string().optional().nullable(),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_price: z.number().positive(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  source: z.enum(['direct', 'airbnb', 'booking', 'other']).optional(),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  const status = searchParams.get('status')
  const isAdmin = (await getServerSession(authOptions))?.user &&
    ((await getServerSession(authOptions))?.user as { role?: string }).role === 'admin'

  let query = supabaseAdmin
    .from('bookings')
    .select(isAdmin ? '*, rooms(name, slug)' : 'id, room_id, check_in, check_out, status')
    .order('check_in', { ascending: true })

  if (roomId) query = query.eq('room_id', roomId)
  if (status) query = query.eq('status', status)
  if (!isAdmin) query = query.neq('status', 'cancelled')

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = BookingSchema.parse(body)

    if (validated.check_out <= validated.check_in) {
      return NextResponse.json({ error: 'La date de départ doit être après la date d\'arrivée' }, { status: 400 })
    }

    // Check for overlapping bookings
    const { data: overlap } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('room_id', validated.room_id)
      .neq('status', 'cancelled')
      .lt('check_in', validated.check_out)
      .gt('check_out', validated.check_in)
      .limit(1)

    if (overlap && overlap.length > 0) {
      return NextResponse.json(
        { error: 'Cette chambre est déjà réservée pour ces dates. Veuillez choisir d\'autres dates.' },
        { status: 409 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert({ ...validated, status: validated.status ?? 'confirmed', source: validated.source ?? 'direct' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Send emails (non-blocking)
    const nights = Math.round(
      (new Date(validated.check_out).getTime() - new Date(validated.check_in).getTime()) / 86400000
    )
    const emailParams = {
      guestName: validated.guest_name,
      guestEmail: validated.guest_email,
      bookingId: data.id,
      checkIn: validated.check_in,
      checkOut: validated.check_out,
      nights,
      totalPrice: validated.total_price,
      notes: validated.notes,
    }
    Promise.allSettled([
      sendBookingConfirmationToClient(emailParams),
      sendBookingNotificationToAdmin(emailParams),
    ]).catch(console.error)

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
