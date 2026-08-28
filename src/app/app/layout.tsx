import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/SignOutButton'
import { auth } from '@/lib/auth'

export default async function ProtectedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/sign-in')
  }

  return (
    <div className='min-h-screen page-background text-slate-900'>
      <div className='spectrum-edge border-b border-brand-200 bg-white/90 backdrop-blur'>
        <div className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6'>
          <div className='min-w-0'>
            <Link
              href='/app'
              className='flex items-center gap-2.5 text-lg font-semibold text-brand-800'
            >
              <span className='flex size-8 items-center justify-center rounded-lg bg-brand-700 text-xs font-bold text-white shadow-sm'>
                B
              </span>
              Bottlenecks
            </Link>
          </div>
          <div className='flex min-w-0 flex-wrap items-center justify-end gap-3'>
            <div className='min-w-0 text-left text-sm text-slate-600 sm:text-right'>
              <p className='m-0 truncate font-medium text-slate-900'>
                {session.user.name ?? session.user.email}
              </p>
              <p className='m-0 hidden break-all sm:block'>
                {session.user.email}
              </p>
            </div>
            <Link
              href='/app/organization'
              className='inline-flex items-center justify-center rounded-full border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:border-brand-300 hover:bg-brand-100'
            >
              Organization
            </Link>
            <Link
              href='/app/profile'
              className='inline-flex items-center justify-center rounded-full border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:border-brand-300 hover:bg-brand-50'
            >
              Profile
            </Link>
            <SignOutButton />
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
