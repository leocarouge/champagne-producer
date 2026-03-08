import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateICalFeed } from '@/lib/ical'
import type { Booking, Room } from '@/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')

  if (!roomId) {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 })
  }

  const { data: room } = await supabaseAdmin
    .from('rooms')
    .select('name')
    .eq('id', roomId)
    .single()

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('room_id', roomId)
    .neq('status', 'cancelled')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const icalContent = generateICalFeed((bookings as Booking[]) ?? [], (room as Room).name ?? roomId)

  return new NextResponse(icalContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="maison-lambert-${roomId}.ics"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
