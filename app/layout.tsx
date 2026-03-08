import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/providers/CartProvider'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Champagne Carouge-Cireddu — Flavigny',
    template: '%s | Champagne Carouge-Cireddu',
  },
  description:
    'Champagne Carouge-Cireddu, récoltant-manipulant à Flavigny (Marne, 51190). Boutique en ligne, chambres d\'hôtes et dégustation au cœur du vignoble champenois.',
  keywords: ['champagne', 'champagne Flavigny', 'Carouge-Cireddu', 'récoltant manipulant', 'boutique champagne', 'chambres hôtes champagne', 'champagne Marne'],
  authors: [{ name: 'Champagne Carouge-Cireddu' }],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: '/',
    siteName: 'Champagne Carouge-Cireddu',
    title: 'Champagne Carouge-Cireddu — Flavigny',
    description: 'Récoltant-manipulant à Flavigny. Champagnes Sélection et Rosé, chambres d\'hôtes.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Champagne Carouge-Cireddu' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Champagne Carouge-Cireddu — Flavigny',
    description: 'Récoltant-manipulant à Flavigny, Marne.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <SessionProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
