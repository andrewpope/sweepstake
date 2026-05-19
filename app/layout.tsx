import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Suspense } from 'react'
import Header, { HeaderShell } from '@/components/header'
import Footer from '@/components/footer'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'World Cup Sweepstake',
  description: 'Friendly office sweepstake for the 2026 World Cup.',
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="font-sans antialiased text-foreground bg-background min-h-dvh flex flex-col">
        <Suspense fallback={<HeaderShell />}>
          <Header />
        </Suspense>
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  )
}
