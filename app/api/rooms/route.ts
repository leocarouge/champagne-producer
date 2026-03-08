import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const RoomSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  price_per_night: z.number().positive(),
  capacity: z.number().int().positive(),
  photos: z.array(z.string().url()),
  amenities: z.array(z.string()),
  active: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  if (slug) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    return NextResponse.json({ data })
  }

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('active', true)
    .order('price_per_night')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validated = RoomSchema.parse(body)

    const { data, error } = await supabaseAdmin.from('rooms').insert(validated).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
