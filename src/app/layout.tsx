import type { Metadata, Viewport } from 'next'
import { Fraunces, DM_Sans } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/ui/BottomNav'
import AuthProvider from '@/components/ui/AuthProvider'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500'],
})

export const metadata: Metadata = {
  title: 'Tunet · Gardshus',
  description: 'Driftsystem for Airbnb-gardshus',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tunet',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2D5A27',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body>
        <AuthProvider>
          <main className="main-content">{children}</main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  )
}
