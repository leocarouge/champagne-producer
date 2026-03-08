import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')

  // Table absente (pas encore créée) : renvoyer objet vide sans erreur
  if (error) return NextResponse.json({ data: {} })

  const settings: Record<string, string> = {}
  for (const row of data ?? []) {
    settings[row.key] = row.value
  }
  return NextResponse.json({ data: settings })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const updates: Record<string, string> = await req.json()

  const rows = Object.entries(updates).map(([key, value]) => ({ key, value }))
  if (!rows.length) return NextResponse.json({ success: true })

  const { error } = await supabaseAdmin
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
