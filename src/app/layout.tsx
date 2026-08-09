import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/assets/css/globals.css'
import { siteConfig } from '@/lib/site'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  category: 'Developer Tools',
  keywords: [
    'engineering bottlenecks',
    'GitHub analytics',
    'pull request analytics',
    'CI pipeline monitoring',
    'software delivery metrics',
    'engineering productivity',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: {
    card: 'summary',
    title: siteConfig.title,
    description: siteConfig.description,
  },
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
