export interface ShippingRate {
  cost: number
  label: string
  minBottles: number
  maxBottles: number
}

const SHIPPING_RATES: ShippingRate[] = [
  { minBottles: 1, maxBottles: 3,  cost: 12, label: '1–3 bouteilles' },
  { minBottles: 4, maxBottles: 6,  cost: 18, label: '4–6 bouteilles' },
  { minBottles: 7, maxBottles: 12, cost: 25, label: '7–12 bouteilles' },
]

export function calculateShipping(bottleCount: number): number {
  if (bottleCount <= 0) return 0

  for (const rate of SHIPPING_RATES) {
    if (bottleCount >= rate.minBottles && bottleCount <= rate.maxBottles) {
      return rate.cost
    }
  }

  // More than 12 bottles: apply last rate + increment per extra 12
  const extraBatches = Math.ceil((bottleCount - 12) / 12)
  return 25 + extraBatches * 25
}

export function getShippingLabel(bottleCount: number): string {
  for (const rate of SHIPPING_RATES) {
    if (bottleCount >= rate.minBottles && bottleCount <= rate.maxBottles) {
      return rate.label
    }
  }
  return `${bottleCount} bouteilles`
}

export { SHIPPING_RATES }
