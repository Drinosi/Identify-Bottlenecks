'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthForm } from '@/components/AuthForm'
import { authClient } from '@/lib/auth-client'

type AuthPageProps = {
  mode: 'sign-in' | 'sign-up'
  inviteToken?: string | null
}

export function AuthPage({ mode, inviteToken }: AuthPageProps) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (session?.session) {
      router.replace(
        inviteToken ? `/join?invite=${encodeURIComponent(inviteToken)}` : '/app'
      )
    }
  }, [inviteToken, router, session])

  return (
    <main className='grid min-h-screen place-items-center px-6 py-12'>
      <section className='grid w-full max-w-md gap-4 rounded-lg border border-slate-200 bg-white p-8 shadow-sm'>
        <p className='m-0 text-sm font-semibold text-slate-600'>Bottlenecks</p>
        <h1 className='m-0 text-3xl font-semibold  text-slate-900'>
          {mode === 'sign-in' ? 'Sign in' : 'Create your account'}
        </h1>
        <p className='m-0 text-base leading-7 text-slate-600'>
          {mode === 'sign-in'
            ? 'Access your workspace to review team bottlenecks, repositories, and delivery signals.'
            : 'Create your workspace to start tracking engineering bottlenecks across your team.'}
        </p>
        {isPending ? (
          <p className='m-0 text-sm text-slate-500'>Checking session...</p>
        ) : null}
        <AuthForm mode={mode} inviteToken={inviteToken} />
        <p className='m-0 text-sm text-slate-600'>
          {mode === 'sign-in'
            ? 'Need an account? '
            : 'Already have an account? '}
          <Link
            href={mode === 'sign-in' ? '/sign-up' : '/sign-in'}
            className='font-medium text-slate-900 underline'
          >
            {mode === 'sign-in' ? 'Create one' : 'Sign in'}
          </Link>
        </p>
      </section>
    </main>
  )
}
