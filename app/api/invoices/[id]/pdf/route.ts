import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function formatEur(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return new NextResponse('Non autorisé', { status: 401 })
  }

  const { data: invoice, error } = await supabaseAdmin
    .from('invoices')
    .select('*, order:orders(*, order_items(*))')
    .eq('id', params.id)
    .single()

  if (error || !invoice) return new NextResponse('Facture introuvable', { status: 404 })

  const order = invoice.order as any
  const items: any[] = order.order_items ?? []
  const addr = order.shipping_address ?? {}
  const isPaid = order.billing_status === 'paid'

  const itemsRows = items.map((item: any) => `
    <tr>
      <td>${item.product_name}</td>
      <td class="center">${item.quantity}</td>
      <td class="right">${formatEur(item.unit_price)}</td>
      <td class="right bold">${formatEur(item.total_price)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${invoice.invoice_number}</title>
  <style>
    @page { margin: 2cm; size: A4; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, 'Times New Roman', serif; font-size: 13px; color: #1a1a1a; background: #fff; padding: 48px; max-width: 820px; margin: auto; }
    .print-btn { position: fixed; top: 20px; right: 20px; background: #C9A84C; color: #fff; border: none; padding: 10px 22px; cursor: pointer; font-size: 14px; border-radius: 4px; font-family: sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 2px solid #C9A84C; }
    .brand { font-size: 18px; font-weight: bold; letter-spacing: 0.12em; text-transform: uppercase; }
    .brand-sub { font-size: 11px; color: #888; margin-top: 6px; line-height: 1.6; font-style: italic; }
    .inv-meta { text-align: right; }
    .inv-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #aaa; }
    .inv-number { font-size: 22px; font-weight: bold; color: #C9A84C; margin-top: 4px; }
    .inv-date { font-size: 11px; color: #666; margin-top: 6px; }
    .status { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; margin-top: 8px; font-family: sans-serif; background: ${isPaid ? '#d1fae5' : '#dbeafe'}; color: ${isPaid ? '#065f46' : '#1e40af'}; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
    .party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #aaa; margin-bottom: 8px; font-family: sans-serif; }
    .party-name { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
    .party-info { font-size: 12px; color: #555; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    thead th { background: #1a1a1a; color: #fff; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-family: sans-serif; font-weight: 600; }
    thead th.center { text-align: center; }
    thead th.right { text-align: right; }
    tbody tr:nth-child(even) { background: #faf8f4; }
    tbody td { padding: 10px 14px; font-size: 12px; border-bottom: 1px solid #f0ede6; }
    tbody td.center { text-align: center; }
    tbody td.right { text-align: right; }
    tbody td.bold { font-weight: bold; }
    .totals { margin-left: auto; width: 300px; border-top: 1px solid #e5e0d8; padding-top: 12px; }
    .total-line { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; }
    .total-line.muted { color: #777; }
    .total-line.final { font-size: 16px; font-weight: bold; color: #C9A84C; border-top: 2px solid #C9A84C; padding-top: 10px; margin-top: 6px; }
    .note { margin-top: 40px; background: #faf8f4; border-left: 3px solid #C9A84C; padding: 12px 16px; font-size: 11px; color: #666; line-height: 1.6; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; font-size: 10px; color: #aaa; text-align: center; line-height: 1.7; font-family: sans-serif; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Imprimer / Sauvegarder en PDF</button>

  <div class="header">
    <div>
      <div class="brand">Champagne Carouge-Cireddu</div>
      <div class="brand-sub">
        Flavigny · Marne · France<br>
        Récoltant-Manipulant
      </div>
    </div>
    <div class="inv-meta">
      <div class="inv-label">Facture</div>
      <div class="inv-number">${invoice.invoice_number}</div>
      <div class="inv-date">Émise le ${formatDate(invoice.issued_at)}</div>
      <div class="status">${isPaid ? 'Payée' : 'Émise'}</div>
    </div>
  </div>

  <div class="parties">
    <div>
      <div class="party-label">Émetteur</div>
      <div class="party-name">Champagne Carouge-Cireddu</div>
      <div class="party-info">
        Flavigny, Marne<br>
        France
      </div>
    </div>
    <div>
      <div class="party-label">Facturé à</div>
      <div class="party-name">${order.customer_name}</div>
      <div class="party-info">
        ${order.customer_email}<br>
        ${order.customer_phone ? order.customer_phone + '<br>' : ''}
        ${addr.line1 ? addr.line1 + '<br>' : ''}
        ${addr.line2 ? addr.line2 + '<br>' : ''}
        ${addr.postal_code ? addr.postal_code + ' ' : ''}${addr.city ?? ''}<br>
        ${addr.country ?? 'France'}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Désignation</th>
        <th class="center">Qté</th>
        <th class="right">Prix unit. HT</th>
        <th class="right">Total HT</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows || '<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px">Aucun article</td></tr>'}
      ${order.shipping_cost > 0 ? `
      <tr>
        <td>Frais de livraison</td>
        <td class="center">1</td>
        <td class="right">${formatEur(order.shipping_cost)}</td>
        <td class="right bold">${formatEur(order.shipping_cost)}</td>
      </tr>` : ''}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-line muted">
      <span>Sous-total</span>
      <span>${formatEur(order.subtotal)}</span>
    </div>
    ${order.shipping_cost > 0 ? `
    <div class="total-line muted">
      <span>Livraison</span>
      <span>${formatEur(order.shipping_cost)}</span>
    </div>` : ''}
    <div class="total-line muted">
      <span>TVA (exonérée — franchise en base)</span>
      <span>0,00 €</span>
    </div>
    <div class="total-line final">
      <span>Total TTC</span>
      <span>${formatEur(order.total)}</span>
    </div>
  </div>

  ${order.notes ? `<div class="note"><strong>Notes :</strong> ${order.notes}</div>` : ''}

  <div class="footer">
    Champagne Carouge-Cireddu · Flavigny · Marne · France<br>
    TVA non applicable — article 293 B du CGI<br>
    Commande n° ${order.id.slice(0, 8).toUpperCase()} · ${formatDate(order.created_at)}
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
