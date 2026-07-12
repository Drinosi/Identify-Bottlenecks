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
    <div className='min-h-screen bg-slate-50 text-slate-900'>
      <div className='border-b border-slate-200 bg-white/90 backdrop-blur'>
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6'>
          <div className='min-w-0'>
            <Link href='/app' className='text-lg font-semibold tracking-tight'>
              Identify Bottlenecks
            </Link>
          </div>
          <div className='flex min-w-0 items-center gap-3'>
            <div className='min-w-0 text-left text-sm text-slate-600 sm:text-right'>
              <p className='m-0 truncate font-medium text-slate-900'>
                {session.user.name ?? session.user.email}
              </p>
              <p className='m-0 hidden break-all sm:block'>
                {session.user.email}
              </p>
            </div>
            <Link
              href='/app/profile'
              className='inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50'
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
