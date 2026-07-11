'use client'

import { useState } from 'react'

type EmailVerificationPageProps = {
  email: string | null
  callbackURL: string
}

export function EmailVerificationPage({
  email,
  callbackURL,
}: EmailVerificationPageProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleResend() {
    if (!email) {
      setError('Missing email address for verification.')
      return
    }

    setError(null)
    setMessage(null)
    setIsPending(true)

    try {
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          callbackURL,
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.message ?? data?.error ?? 'Unable to resend email.')
        return
      }

      setMessage('Verification email sent. Check your inbox.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <main className='grid min-h-screen place-items-center px-6 py-12'>
      <section className='grid w-full max-w-md gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm'>
        <p className='m-0 text-sm font-semibold text-slate-600'>
          Identify Bottlenecks
        </p>
        <h1 className='m-0 text-3xl font-semibold tracking-tight text-slate-900'>
          Verify your email
        </h1>
        <p className='m-0 text-base leading-7 text-slate-600'>
          {email
            ? `We sent a verification link to ${email}. Open that email to finish setting up your account.`
            : 'We sent you a verification link. Open that email to finish setting up your account.'}
        </p>
        <p className='m-0 text-sm text-slate-500'>
          You will not be able to sign in until your email address is verified.
        </p>
        <button
          type='button'
          onClick={handleResend}
          disabled={isPending || !email}
          className='inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-70'
        >
          {isPending ? 'Sending...' : 'Resend verification email'}
        </button>
        {message ? (
          <p className='m-0 text-sm text-emerald-700'>{message}</p>
        ) : null}
        {error ? <p className='m-0 text-sm text-red-700'>{error}</p> : null}
      </section>
    </main>
  )
}
