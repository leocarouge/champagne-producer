import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  image_url: z.string().url().optional().nullable(),
  category: z.enum(['brut', 'rosé', 'blanc-de-blancs', 'millésime', 'prestige', 'autre']),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  label: z.string().max(100).optional().nullable(),
  assemblage: z.string().optional().nullable(),
  vins_reserve: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  accord_mets: z.string().optional().nullable(),
})

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const category = searchParams.get('category')
  const featured = searchParams.get('featured')
  const admin = searchParams.get('admin')

  // Mode admin : retourne tous les produits (actifs + inactifs), auth requise
  if (admin === 'true') {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('active', { ascending: false })
      .order('price')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (slug) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json({ data })
  }

  let query = supabase.from('products').select('*').eq('active', true)

  if (category) query = query.eq('category', category)
  if (featured === 'true') query = query.eq('featured', true)

  const { data, error } = await query.order('featured', { ascending: false }).order('price')

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
    const validated = ProductSchema.parse(body)

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(validated)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
