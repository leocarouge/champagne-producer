import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as { role?: string }).role === 'admin'
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*), invoices(*)')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowedFields = ['status', 'billing_status', 'notes']
  const update: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) update[field] = body[field]
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
