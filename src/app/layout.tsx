import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/assets/css/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Identify Bottlenecks',
  description: 'Auth-first setup for the Identify Bottlenecks application',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className={inter.variable}>
      <body className='min-h-screen antialiased'>{children}</body>
    </html>
  )
}
