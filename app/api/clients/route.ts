import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as { role?: string }).role === 'admin'
}

// PATCH /api/clients — met à jour toutes les infos d'un client (orders + bookings)
export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, name, phone, new_email, address } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email requis.' }, { status: 400 })

  const errors: string[] = []
  const targetEmail = (new_email && new_email !== email) ? new_email : email

  // Changement d'email : propager sur toutes les lignes
  if (new_email && new_email !== email) {
    const { error: oeErr } = await supabaseAdmin
      .from('orders').update({ customer_email: new_email }).eq('customer_email', email)
    if (oeErr) errors.push(oeErr.message)

    const { error: beErr } = await supabaseAdmin
      .from('bookings').update({ guest_email: new_email }).eq('guest_email', email)
    if (beErr) errors.push(beErr.message)
  }

  // Nom, téléphone, adresse sur les orders
  const orderPatch: Record<string, unknown> = {}
  if (name !== undefined) orderPatch.customer_name = name || null
  if (phone !== undefined) orderPatch.customer_phone = phone || null
  if (address !== undefined) orderPatch.shipping_address = address

  if (Object.keys(orderPatch).length) {
    const { error: oErr } = await supabaseAdmin
      .from('orders').update(orderPatch).eq('customer_email', targetEmail)
    if (oErr) errors.push(oErr.message)
  }

  // Nom + téléphone sur les bookings
  const bookingPatch: Record<string, string | null> = {}
  if (name !== undefined) bookingPatch.guest_name = name || null
  if (phone !== undefined) bookingPatch.guest_phone = phone || null

  if (Object.keys(bookingPatch).length) {
    const { error: bErr } = await supabaseAdmin
      .from('bookings').update(bookingPatch).eq('guest_email', targetEmail)
    if (bErr) errors.push(bErr.message)
  }

  if (errors.length) return NextResponse.json({ error: errors.join(', ') }, { status: 500 })
  return NextResponse.json({ success: true })
}
