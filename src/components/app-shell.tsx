'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { SignOutButton } from '@/components/sign-out-button'

export function AppShell() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && !session?.session) {
      router.replace('/sign-in')
    }
  }, [isPending, router, session])

  if (isPending) {
    return (
      <main className='grid min-h-screen place-items-center px-6 py-12 text-slate-600'>
        Checking session...
      </main>
    )
  }

  if (!session?.session || !session.user) {
    return null
  }

  return (
    <main className='grid min-h-screen gap-6 px-6 py-8'>
      <section className='flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:flex-row sm:items-start'>
        <div>
          <p className='mb-2 text-sm font-semibold text-slate-600'>
            Authenticated
          </p>
          <h1 className='m-0 text-3xl font-semibold tracking-tight text-slate-900'>
            You are signed in.
          </h1>
          <p className='mt-3 max-w-2xl text-base leading-7 text-slate-600'>
            Next step: connect auth users to company onboarding and organization
            membership.
          </p>
        </div>
        <SignOutButton />
      </section>

      <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h2 className='mb-4 text-xl font-semibold text-slate-900'>
          Current session
        </h2>
        <dl className='grid gap-4'>
          <div>
            <dt className='text-sm text-slate-500'>User ID</dt>
            <dd className='mt-1 font-mono text-sm text-slate-900'>
              {session.user.id}
            </dd>
          </div>
          <div>
            <dt className='text-sm text-slate-500'>Name</dt>
            <dd className='mt-1 font-mono text-sm text-slate-900'>
              {session.user.name}
            </dd>
          </div>
          <div>
            <dt className='text-sm text-slate-500'>Email</dt>
            <dd className='mt-1 font-mono text-sm text-slate-900'>
              {session.user.email}
            </dd>
          </div>
          <div>
            <dt className='text-sm text-slate-500'>Email verified</dt>
            <dd className='mt-1 font-mono text-sm text-slate-900'>
              {session.user.emailVerified ? 'Yes' : 'No'}
            </dd>
          </div>
        </dl>
      </section>

      <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h2 className='mb-4 text-xl font-semibold text-slate-900'>
          What to build next
        </h2>
        <ul className='mb-4 ml-5 grid gap-2 text-slate-700'>
          <li>Create an onboarding flow after first sign up.</li>
          <li>Create an organization and make the current user the owner.</li>
          <li>Replace the test bootstrap route with real user-driven actions.</li>
        </ul>
        <p className='m-0 text-slate-700'>
          You can still visit{' '}
          <Link
            href='/api/organizations'
            className='font-medium text-slate-900 underline'
          >
            /api/organizations
          </Link>{' '}
          once organization creation is wired to real users.
        </p>
      </section>
    </main>
  )
}
