import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/assets/css/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Identify Bottlenecks',
  description:
    'Identify engineering slowdowns across pull request review, pipeline health, and repository activity.',
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
    <html lang='en' suppressHydrationWarning className={inter.variable}>
      <body className='min-h-screen antialiased'>{children}</body>
    </html>
  )
}
