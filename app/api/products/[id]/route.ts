import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const UpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  image_url: z.union([z.string().url(), z.literal(''), z.null()]).optional().transform(v => v === '' ? null : v),
  category: z.enum(['brut', 'rosé', 'blanc-de-blancs', 'millésime', 'prestige', 'autre']).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  label: z.string().max(100).optional().nullable(),
  assemblage: z.string().optional().nullable(),
  vins_reserve: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  accord_mets: z.string().optional().nullable(),
})

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as { role?: string }).role === 'admin'
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const validated = UpdateSchema.parse(body)

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(validated)
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabaseAdmin.from('products').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
