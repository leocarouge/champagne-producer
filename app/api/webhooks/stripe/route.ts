import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { generateInvoicePDF, generateInvoiceNumber } from '@/lib/invoice'
import { sendOrderConfirmationToClient, sendOrderNotificationToAdmin } from '@/lib/emails'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    await handleCheckoutCompleted(session)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const metadata = session.metadata ?? {}
    const items: { productId: string; quantity: number }[] = JSON.parse(metadata.items ?? '[]')
    const shippingAddress = JSON.parse(metadata.shipping_address ?? '{}')
    const shippingCost = parseFloat(metadata.shipping_cost ?? '0')

    // Fetch product details
    const productIds = items.map((i) => i.productId)
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('*')
      .in('id', productIds)

    if (!products) return

    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!
      return {
        product_id: item.productId,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: product.price * item.quantity,
      }
    })

    const subtotal = orderItems.reduce((sum, i) => sum + i.total_price, 0)

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        customer_email: session.customer_email ?? session.customer_details?.email ?? '',
        customer_name: metadata.customer_name,
        customer_phone: metadata.customer_phone || null,
        shipping_address: shippingAddress,
        subtotal,
        shipping_cost: shippingCost,
        total: subtotal + shippingCost,
        status: 'paid',
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Failed to create order:', orderError)
      return
    }

    // Create order items
    await supabaseAdmin.from('order_items').insert(
      orderItems.map((i) => ({ ...i, order_id: order.id }))
    )

    // Decrement stock
    for (const item of items) {
      await supabaseAdmin.rpc('decrement_stock', {
        p_product_id: item.productId,
        p_quantity: item.quantity,
      }).maybeSingle()
    }

    // Generate invoice
    const invoiceNumber = generateInvoiceNumber(order.id)
    const fullOrder = { ...order, order_items: orderItems.map((i, idx) => ({ ...i, id: String(idx), order_id: order.id, created_at: new Date().toISOString() })) }

    let pdfUrl: string | null = null
    try {
      const pdfBuffer = await generateInvoicePDF(fullOrder, invoiceNumber)

      const { data: uploadData } = await supabaseAdmin.storage
        .from('invoices')
        .upload(`${order.id}.pdf`, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        })

      if (uploadData) {
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('invoices')
          .getPublicUrl(`${order.id}.pdf`)
        pdfUrl = publicUrl
      }
    } catch (pdfErr) {
      console.error('PDF generation failed:', pdfErr)
    }

    await supabaseAdmin.from('invoices').insert({
      order_id: order.id,
      invoice_number: invoiceNumber,
      pdf_url: pdfUrl,
    })

    // Send emails
    const emailParams = {
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      orderId: order.id,
      items: orderItems,
      subtotal,
      shippingCost,
      total: subtotal + shippingCost,
      shippingAddress: shippingAddress ?? undefined,
      invoicePdfUrl: pdfUrl,
    }
    await Promise.allSettled([
      sendOrderConfirmationToClient(emailParams),
      sendOrderNotificationToAdmin(emailParams),
    ])

    console.log(`Order ${order.id} processed. Invoice: ${invoiceNumber}`)
  } catch (err) {
    console.error('Error handling checkout.session.completed:', err)
  }
}
