'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

type SignedInAccountProps = {
  email: string
  inviteToken?: string | null
}

export function SignedInAccount({ email, inviteToken }: SignedInAccountProps) {
  const router = useRouter()
  const [isRefreshing, startTransition] = useTransition()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const destination = inviteToken
    ? `/join?invite=${encodeURIComponent(inviteToken)}`
    : '/app'

  async function switchAccount() {
    setIsSigningOut(true)
    setSignOutError(null)
    try {
      const result = await authClient.signOut()
      if (result.error) {
        setSignOutError('Unable to sign out. Please try again.')
        return
      }
      startTransition(() => router.refresh())
    } catch {
      setSignOutError('Unable to sign out. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className='grid gap-4'>
      <h1 className='m-0 text-3xl font-semibold text-slate-900'>
        You’re already signed in
      </h1>
      <p className='m-0 text-base leading-7 text-slate-600'>
        Continue as{' '}
        <span className='break-all font-medium text-slate-900'>{email}</span>
        {inviteToken
          ? ' to review your organization invitation.'
          : ' to your workspace.'}
      </p>
      {isSigningOut || isRefreshing ? (
        <p role='status' className='m-0 py-3 text-sm text-slate-600'>
          Signing out…
        </p>
      ) : (
        <Link href={destination} className={primaryActionClassName}>
          {inviteToken ? 'Continue to invitation' : 'Continue to workspace'}
        </Link>
      )}
      <button
        type='button'
        onClick={switchAccount}
        disabled={isSigningOut || isRefreshing}
        className='text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900 disabled:opacity-50'
      >
        Use a different account
      </button>
      {signOutError ? (
        <p role='alert' className='m-0 text-sm text-red-700'>
          {signOutError}
        </p>
      ) : null}
    </div>
  )
}

const primaryActionClassName =
  'inline-flex items-center justify-center rounded-xl bg-brand-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600'
