'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import type { CartItem, Product } from '@/types'
import { calculateShipping } from '@/lib/shipping'

interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; quantity: number }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE'; items: CartItem[] }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.product.id === action.product.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === action.product.id
              ? { ...i, quantity: i.quantity + action.quantity }
              : i
          ),
        }
      }
      return { items: [...state.items, { product: action.product, quantity: action.quantity }] }
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter((i) => i.product.id !== action.productId) }
    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => i.product.id !== action.productId) }
      }
      return {
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      }
    case 'CLEAR_CART':
      return { items: [] }
    case 'HYDRATE':
      return { items: action.items }
    default:
      return state
  }
}

interface CartContextValue {
  items: CartItem[]
  subtotal: number
  shippingCost: number
  total: number
  itemCount: number
  bottleCount: number
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const CART_STORAGE_KEY = 'maison-lambert-cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        dispatch({ type: 'HYDRATE', items: JSON.parse(stored) })
      }
    } catch {
      // ignore
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      // ignore
    }
  }, [state.items])

  const bottleCount = state.items.reduce((acc, i) => acc + i.quantity, 0)
  const subtotal = state.items.reduce((acc, i) => acc + i.product.price * i.quantity, 0)
  const shippingCost = bottleCount > 0 ? calculateShipping(bottleCount) : 0
  const total = subtotal + shippingCost
  const itemCount = state.items.length

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        subtotal,
        shippingCost,
        total,
        itemCount,
        bottleCount,
        addItem: (product, quantity = 1) => dispatch({ type: 'ADD_ITEM', product, quantity }),
        removeItem: (productId) => dispatch({ type: 'REMOVE_ITEM', productId }),
        updateQuantity: (productId, quantity) =>
          dispatch({ type: 'UPDATE_QUANTITY', productId, quantity }),
        clearCart: () => dispatch({ type: 'CLEAR_CART' }),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
