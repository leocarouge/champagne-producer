import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { syncAirbnbCalendar } from '@/lib/ical'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ImportSchema = z.object({
  roomId: z.string().uuid(),
  icalUrl: z.string().url(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { roomId, icalUrl } = ImportSchema.parse(body)

    const result = await syncAirbnbCalendar(roomId, icalUrl)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 })
    const message = err instanceof Error ? err.message : 'Import failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
