import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Champagne Carouge-Cireddu <noreply@champagnecarougecireddu.fr>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'champagnecarougecireddu@gmail.com'

function formatEur(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function baseLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #f5f3ef; font-family: Georgia, serif; color: #1a1a1a; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }
    .header { background: #1a1a1a; padding: 28px 36px; }
    .header-brand { color: #fff; font-size: 18px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase; }
    .header-sub { color: #C9A84C; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; margin-top: 4px; }
    .gold-bar { height: 3px; background: #C9A84C; }
    .body { padding: 36px; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #C9A84C; margin-bottom: 8px; font-family: sans-serif; }
    h1 { font-size: 24px; margin: 0 0 16px; }
    p { font-size: 14px; line-height: 1.7; color: #444; margin: 0 0 16px; }
    .box { background: #faf8f4; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0ede6; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .row-label { color: #888; font-family: sans-serif; }
    .row-value { font-weight: bold; color: #1a1a1a; }
    .total { font-size: 16px; color: #C9A84C; }
    .btn { display: inline-block; background: #C9A84C; color: #fff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 13px; font-family: sans-serif; margin: 8px 0; }
    .footer { background: #f5f3ef; padding: 24px 36px; font-size: 11px; color: #aaa; font-family: sans-serif; line-height: 1.7; text-align: center; border-top: 1px solid #ece9e2; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-brand">Carouge-Cireddu</div>
      <div class="header-sub">Champagne · Flavigny · Marne</div>
    </div>
    <div class="gold-bar"></div>
    <div class="body">${content}</div>
    <div class="footer">
      Champagne Carouge-Cireddu · 6 Rue de l'Église, Flavigny 51190<br>
      06 77 95 90 62 · champagnecarougecireddu@gmail.com<br>
      <br>L'abus d'alcool est dangereux pour la santé. À consommer avec modération.
    </div>
  </div>
</body>
</html>`
}

// ─── Commande : confirmation client ───────────────────────────────────────────

interface OrderEmailParams {
  customerName: string
  customerEmail: string
  orderId: string
  items: { product_name: string; quantity: number; unit_price: number; total_price: number }[]
  subtotal: number
  shippingCost: number
  total: number
  shippingAddress?: Record<string, string>
  invoicePdfUrl?: string | null
}

export async function sendOrderConfirmationToClient(params: OrderEmailParams) {
  const { customerName, customerEmail, orderId, items, subtotal, shippingCost, total, shippingAddress, invoicePdfUrl } = params

  const itemsRows = items.map(i => `
    <div class="row">
      <span class="row-label">${i.product_name} × ${i.quantity}</span>
      <span class="row-value">${formatEur(i.total_price)}</span>
    </div>`).join('')

  const addrHtml = shippingAddress
    ? `${shippingAddress.line1 ?? ''}${shippingAddress.line2 ? ', ' + shippingAddress.line2 : ''}, ${shippingAddress.postal_code ?? ''} ${shippingAddress.city ?? ''}, ${shippingAddress.country ?? 'France'}`
    : ''

  const html = baseLayout(`
    <div class="label">Confirmation de commande</div>
    <h1>Merci ${customerName} !</h1>
    <p>Votre commande de champagne a bien été reçue et votre paiement confirmé. Nous préparons votre envoi avec soin.</p>

    <div class="box">
      <div class="row"><span class="row-label">Référence</span><span class="row-value">${orderId.slice(0, 8).toUpperCase()}</span></div>
      ${itemsRows}
      ${shippingCost > 0 ? `<div class="row"><span class="row-label">Livraison</span><span class="row-value">${formatEur(shippingCost)}</span></div>` : ''}
      <div class="row"><span class="row-label total">Total payé</span><span class="row-value total">${formatEur(total)}</span></div>
      ${addrHtml ? `<div class="row"><span class="row-label">Livraison à</span><span class="row-value" style="text-align:right;max-width:60%">${addrHtml}</span></div>` : ''}
    </div>

    ${invoicePdfUrl ? `<p><a class="btn" href="${invoicePdfUrl}">Télécharger ma facture PDF</a></p>` : ''}

    <p>Pour toute question, contactez-nous à <a href="mailto:champagnecarougecireddu@gmail.com">champagnecarougecireddu@gmail.com</a> ou au 06 77 95 90 62.</p>
    <p>À votre santé,<br><strong>Champagne Carouge-Cireddu</strong></p>
  `)

  return resend.emails.send({
    from: FROM,
    to: customerEmail,
    subject: `Votre commande Champagne Carouge-Cireddu — ${orderId.slice(0, 8).toUpperCase()}`,
    html,
  })
}

export async function sendOrderNotificationToAdmin(params: OrderEmailParams) {
  const { customerName, customerEmail, orderId, items, total } = params

  const itemsRows = items.map(i =>
    `<div class="row"><span class="row-label">${i.product_name} × ${i.quantity}</span><span class="row-value">${formatEur(i.total_price)}</span></div>`
  ).join('')

  const html = baseLayout(`
    <div class="label">Nouvelle commande</div>
    <h1>Commande reçue</h1>
    <div class="box">
      <div class="row"><span class="row-label">Client</span><span class="row-value">${customerName}</span></div>
      <div class="row"><span class="row-label">Email</span><span class="row-value">${customerEmail}</span></div>
      <div class="row"><span class="row-label">Référence</span><span class="row-value">${orderId.slice(0, 8).toUpperCase()}</span></div>
      ${itemsRows}
      <div class="row"><span class="row-label total">Total</span><span class="row-value total">${formatEur(total)}</span></div>
    </div>
    <p><a class="btn" href="${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/admin/orders">Voir dans l'admin</a></p>
  `)

  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Nouvelle commande — ${customerName} — ${formatEur(total)}`,
    html,
  })
}

// ─── Réservation : confirmation client ────────────────────────────────────────

interface BookingEmailParams {
  guestName: string
  guestEmail: string
  bookingId: string
  checkIn: string
  checkOut: string
  nights: number
  totalPrice: number
  notes?: string | null
}

export async function sendBookingConfirmationToClient(params: BookingEmailParams) {
  const { guestName, guestEmail, bookingId, checkIn, checkOut, nights, totalPrice, notes } = params

  const html = baseLayout(`
    <div class="label">Confirmation de réservation</div>
    <h1>Réservation confirmée !</h1>
    <p>Bonjour ${guestName},</p>
    <p>Votre réservation du logement Carouge-Cireddu à Flavigny est confirmée. Nous avons hâte de vous accueillir !</p>

    <div class="box">
      <div class="row"><span class="row-label">Référence</span><span class="row-value">${bookingId.slice(0, 8).toUpperCase()}</span></div>
      <div class="row"><span class="row-label">Logement</span><span class="row-value">Logement complet — Flavigny</span></div>
      <div class="row"><span class="row-label">Arrivée</span><span class="row-value">${formatDate(checkIn)}</span></div>
      <div class="row"><span class="row-label">Départ</span><span class="row-value">${formatDate(checkOut)}</span></div>
      <div class="row"><span class="row-label">Durée</span><span class="row-value">${nights} nuit${nights > 1 ? 's' : ''}</span></div>
      <div class="row"><span class="row-label total">Total</span><span class="row-value total">${formatEur(totalPrice)}</span></div>
      ${notes ? `<div class="row"><span class="row-label">Notes</span><span class="row-value">${notes}</span></div>` : ''}
    </div>

    <div class="box" style="background:#fff8ed;border:1px solid #f5e6c8">
      <p style="margin:0;font-size:13px"><strong>Informations pratiques</strong></p>
      <p style="margin:8px 0 0;font-size:13px">Check-in à partir de 15h00 · Check-out avant 11h00<br>
      Adresse : 6 Rue de l'Église, Flavigny, 51190<br>
      Contact : 06 77 95 90 62</p>
    </div>

    <p>Pour toute question, contactez-nous à <a href="mailto:champagnecarougecireddu@gmail.com">champagnecarougecireddu@gmail.com</a>.</p>
    <p>À très bientôt,<br><strong>Champagne Carouge-Cireddu</strong></p>
  `)

  return resend.emails.send({
    from: FROM,
    to: guestEmail,
    subject: `Réservation confirmée — ${formatDate(checkIn)} au ${formatDate(checkOut)}`,
    html,
  })
}

export async function sendBookingNotificationToAdmin(params: BookingEmailParams) {
  const { guestName, guestEmail, bookingId, checkIn, checkOut, nights, totalPrice, notes } = params

  const html = baseLayout(`
    <div class="label">Nouvelle réservation</div>
    <h1>Nouvelle réservation</h1>
    <div class="box">
      <div class="row"><span class="row-label">Client</span><span class="row-value">${guestName}</span></div>
      <div class="row"><span class="row-label">Email</span><span class="row-value">${guestEmail}</span></div>
      <div class="row"><span class="row-label">Référence</span><span class="row-value">${bookingId.slice(0, 8).toUpperCase()}</span></div>
      <div class="row"><span class="row-label">Arrivée</span><span class="row-value">${formatDate(checkIn)}</span></div>
      <div class="row"><span class="row-label">Départ</span><span class="row-value">${formatDate(checkOut)}</span></div>
      <div class="row"><span class="row-label">Nuits</span><span class="row-value">${nights}</span></div>
      <div class="row"><span class="row-label total">Total</span><span class="row-value total">${formatEur(totalPrice)}</span></div>
      ${notes ? `<div class="row"><span class="row-label">Notes</span><span class="row-value">${notes}</span></div>` : ''}
    </div>
    <p><a class="btn" href="${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/admin/bookings">Voir dans l'admin</a></p>
  `)

  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Nouvelle réservation — ${guestName} — ${formatDate(checkIn)}`,
    html,
  })
}
