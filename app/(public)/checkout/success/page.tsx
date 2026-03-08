'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, Download, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/providers/CartProvider'

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className="pt-20 min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-zinc-100 p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="font-serif text-3xl font-bold text-zinc-900 mb-3">
          Commande confirmée !
        </h1>
        <p className="text-zinc-500 leading-relaxed mb-6">
          Merci pour votre commande. Vous recevrez une confirmation par email avec votre facture.
          Nous préparerons vos champagnes avec le plus grand soin.
        </p>

        <div className="bg-amber-50 rounded-lg p-4 mb-8 text-sm text-amber-800">
          <p className="font-medium mb-1">Votre facture a été générée</p>
          <p>Un email de confirmation avec votre facture PDF a été envoyé à votre adresse.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/boutique" className="gap-2">
              Continuer mes achats
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild>
            <Link href="/" className="gap-2">
              Retour à l&apos;accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
