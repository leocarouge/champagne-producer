import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as { role?: string }).role === 'admin'
}

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `CC-${year}-`

  const { data } = await supabaseAdmin
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)

  const lastNum = data && data.length > 0
    ? parseInt(data[0].invoice_number.split('-')[2] ?? '0', 10)
    : 0

  return `${prefix}${String(lastNum + 1).padStart(4, '0')}`
}

// POST /api/invoices — crée une facture pour une commande
export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { order_id } = await req.json()
  if (!order_id) return NextResponse.json({ error: 'order_id requis.' }, { status: 400 })

  // Vérifier si une facture existe déjà
  const { data: existing } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('order_id', order_id)
    .single()

  if (existing) return NextResponse.json({ data: existing })

  const invoice_number = await generateInvoiceNumber()

  const { data: invoice, error } = await supabaseAdmin
    .from('invoices')
    .insert({ order_id, invoice_number })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mettre à jour le billing_status de la commande
  await supabaseAdmin
    .from('orders')
    .update({ billing_status: 'invoiced' })
    .eq('id', order_id)

  return NextResponse.json({ data: invoice }, { status: 201 })
}

// GET /api/invoices — liste toutes les factures
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*, order:orders(customer_name, customer_email, total, billing_status)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
