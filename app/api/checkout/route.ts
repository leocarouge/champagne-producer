import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe, formatAmountForStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateShipping } from '@/lib/shipping'

const CheckoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  shippingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    postal_code: z.string().min(1),
    country: z.string().min(1),
  }),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, customer, shippingAddress } = CheckoutSchema.parse(body)

    // Fetch products from DB
    const productIds = items.map((i) => i.productId)
    const { data: products, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('active', true)

    if (productError || !products) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 400 })
    }

    // Validate stock & build line items
    const lineItems: { price_data: { currency: string; product_data: { name: string; images?: string[]; description?: string }; unit_amount: number }; quantity: number }[] = []
    let totalBottles = 0

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Stock insuffisant pour ${product.name}` }, { status: 400 })
      }
      totalBottles += item.quantity
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: product.name,
            images: product.image_url ? [product.image_url] : [],
            description: product.description.substring(0, 500),
          },
          unit_amount: formatAmountForStripe(product.price),
        },
        quantity: item.quantity,
      })
    }

    const shippingCost = calculateShipping(totalBottles)

    // Add shipping as a line item if > 0
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: `Livraison (${totalBottles} bouteille${totalBottles > 1 ? 's' : ''})` },
          unit_amount: formatAmountForStripe(shippingCost),
        },
        quantity: 1,
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: customer.email,
      metadata: {
        customer_name: customer.name,
        customer_phone: customer.phone ?? '',
        shipping_address: JSON.stringify(shippingAddress),
        items: JSON.stringify(items),
        shipping_cost: String(shippingCost),
      },
      billing_address_collection: 'required',
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 })
    }
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
