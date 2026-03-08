import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const TVA_RATE = 0.2

function formatEur(amount: number) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + '€'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

  // Calcul HT / TVA / TTC
  const totalTTC = order.total ?? 0
  const totalHT = totalTTC / (1 + TVA_RATE)
  const totalTVA = totalTTC - totalHT

  const itemsRows = items.map((item: any) => {
    const priceTTC = item.unit_price ?? 0
    return `
    <tr>
      <td class="center">0,75</td>
      <td class="center">Bouteille ${item.product_name}</td>
      <td class="center">${item.quantity}</td>
      <td class="center">${priceTTC.toFixed(0)}</td>
      <td class="center">${(priceTTC * item.quantity).toFixed(0)}</td>
    </tr>`
  }).join('')

  const addrLine = [addr.line1, addr.line2, addr.postal_code && addr.city ? `${addr.postal_code} ${addr.city}` : '', addr.country].filter(Boolean).join(', ')

  const logoUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/cropped-cropped-logocarouge.png`

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture ${invoice.invoice_number}</title>
  <style>
    @page { margin: 2cm; size: A4; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; background: #fff; padding: 40px; max-width: 800px; margin: auto; }
    .print-btn { position: fixed; top: 16px; right: 16px; background: #8B1A1A; color: #fff; border: none; padding: 10px 22px; cursor: pointer; font-size: 13px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }

    /* Logo + titre */
    .top { text-align: center; margin-bottom: 24px; }
    .top img { height: 80px; margin-bottom: 12px; }
    .top h1 { font-size: 16px; font-weight: bold; letter-spacing: 0.05em; }

    /* Client */
    .client-block { margin-bottom: 20px; }
    .client-row { margin-bottom: 4px; }
    .client-row strong { font-weight: bold; }

    /* Références */
    .ref-table { border-collapse: collapse; margin-bottom: 24px; }
    .ref-table td { border: 1px solid #000; padding: 5px 12px; font-size: 12px; }
    .ref-table td:first-child { font-weight: bold; }

    /* Tableau articles */
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th { border: 1px solid #000; padding: 6px 8px; text-align: center; font-weight: bold; background: #fff; font-size: 12px; }
    .items-table td { border: 1px solid #000; padding: 6px 8px; font-size: 12px; }
    .items-table td.center { text-align: center; }
    .items-table .body-rows td { height: 24px; }

    /* Totaux */
    .totals { text-align: right; margin-bottom: 24px; }
    .totals table { display: inline-table; border-collapse: collapse; }
    .totals td { padding: 3px 12px; font-size: 12px; text-align: right; }
    .totals .label { font-weight: bold; }
    .totals .final td { font-weight: bold; font-size: 14px; }

    /* Mentions légales */
    .legal { font-size: 10px; color: #333; margin-bottom: 16px; line-height: 1.5; font-style: italic; }
    .bank { font-size: 11px; margin-bottom: 24px; line-height: 1.7; font-style: italic; }

    /* Pied de page */
    .footer { border-top: 1px solid #000; padding-top: 10px; text-align: center; font-size: 10px; line-height: 1.7; font-style: italic; color: #333; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Imprimer / PDF</button>

  <div class="top">
    <img src="${logoUrl}" alt="Champagne Carouge Cireddu" onerror="this.style.display='none'" />
    <h1>CHAMPAGNE CAROUGE CIREDDU</h1>
  </div>

  <div class="client-block">
    <div class="client-row"><strong>Nom</strong> ${order.customer_name}</div>
    <div class="client-row"><strong>Adresse</strong> ${addrLine || ''}</div>
    <div class="client-row"><strong>Adresse e-mail</strong> ${order.customer_email}</div>
    ${order.customer_phone ? `<div class="client-row"><strong>Téléphone</strong> ${order.customer_phone}</div>` : ''}
  </div>

  <table class="ref-table">
    <tr>
      <td>numéro de facturation</td>
      <td>${invoice.invoice_number}</td>
    </tr>
    <tr>
      <td>Date de facturation</td>
      <td>${formatDate(invoice.issued_at ?? order.created_at)}</td>
    </tr>
  </table>

  <table class="items-table">
    <thead>
      <tr>
        <th>Contenance</th>
        <th>Designation</th>
        <th>Qté</th>
        <th>Prix unitaire TTC</th>
        <th>Montant TTC</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows || '<tr><td colspan="5" style="text-align:center;padding:16px;color:#888">Aucun article</td></tr>'}
      ${order.shipping_cost > 0 ? `
      <tr class="body-rows">
        <td class="center">—</td>
        <td class="center">Frais de livraison</td>
        <td class="center">1</td>
        <td class="center">${order.shipping_cost.toFixed(0)}</td>
        <td class="center">${order.shipping_cost.toFixed(0)}</td>
      </tr>` : ''}
      <!-- Lignes vides pour remplir le tableau comme le modèle -->
      ${Array(Math.max(0, 8 - items.length)).fill('<tr class="body-rows"><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>').join('')}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td class="label">Total HT</td>
        <td>${formatEur(totalHT)}</td>
      </tr>
      <tr>
        <td class="label">TVA (20%)</td>
        <td>${formatEur(totalTVA)}</td>
      </tr>
      <tr class="final">
        <td class="label">Total TTC</td>
        <td>${formatEur(totalTTC)}</td>
      </tr>
    </table>
  </div>

  <div class="legal">
    Toute somme impayée à son échéance produira, de plein droit et sans mise en demeure, un intérêt égal à 1,5 fois le taux d'intérêt légal par mois de retard.<br>
    Nos conditions de vente ne prévoient pas d'escompte pour paiement anticipé.
  </div>

  <div class="bank">
    Coordonnées bancaires<br>
    Titulaire du compte : JAMES CAROUGE<br>
    IBAN FR76 1020 6000 4848 3510 3712 067<br>
    BIC AGRIFRPP802
  </div>

  <div class="footer">
    CHAMPAGNE CAROUGE CIREDDU<br>
    6 rue de l'eglise 51190 FLAVIGNY<br>
    Tel : 06 77 95 90 62<br>
    SIRET 843 516 642 00017<br>
    N° TVA intracommunautaire FR67 843 516 642
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
