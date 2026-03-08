import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('orders')
    .select('*, order_items(*), invoices(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  const email = searchParams.get('email')
  if (email) query = (query as any).eq('customer_email', email)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { customer_name, customer_email, customer_phone, shipping_address, items, shipping_cost, notes, status } = body

  if (!customer_name || !customer_email) {
    return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })
  }

  const itemsList = items ?? []
  const subtotal = itemsList.reduce((s: number, i: { unit_price: number; quantity: number }) => s + i.unit_price * i.quantity, 0)
  const total = subtotal + (Number(shipping_cost) || 0)

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_name,
      customer_email,
      customer_phone: customer_phone || null,
      shipping_address: shipping_address ?? { line1: '', city: '', postal_code: '', country: 'FR' },
      subtotal,
      shipping_cost: Number(shipping_cost) || 0,
      total,
      status: status ?? 'paid',
      notes: notes || null,
      stripe_session_id: null,
      stripe_payment_intent: null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (itemsList.length > 0) {
    const orderItems = itemsList.map((i: { product_name: string; product_id?: string; quantity: number; unit_price: number }) => ({
      order_id: order.id,
      product_name: i.product_name,
      product_id: i.product_id || null,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total_price: i.unit_price * i.quantity,
    }))
    await supabaseAdmin.from('order_items').insert(orderItems)
  }
  return NextResponse.json({ data: order }, { status: 201 })
}
