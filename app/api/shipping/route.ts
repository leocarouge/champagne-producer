import { NextRequest, NextResponse } from 'next/server'
import { calculateShipping, getShippingLabel } from '@/lib/shipping'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const count = parseInt(searchParams.get('count') ?? '0')

  if (isNaN(count) || count < 0) {
    return NextResponse.json({ error: 'Invalid bottle count' }, { status: 400 })
  }

  const cost = calculateShipping(count)
  const label = getShippingLabel(count)

  return NextResponse.json({ cost, label, bottleCount: count })
}
