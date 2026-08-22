'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { authClient } from '@/lib/auth-client'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }

    setIsPending(true)

    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: '/reset-password',
      })

      if (result.error) {
        setError(
          result.error.message ?? 'Unable to send a password reset email.'
        )
        return
      }

      setMessage(
        'If an account exists for that address, we sent it a password reset link.'
      )
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <main className='grid min-h-screen place-items-center px-6 py-12'>
      <section className='grid w-full max-w-md gap-4 rounded-lg border border-slate-200 bg-white p-8 shadow-sm'>
        <p className='m-0 text-sm font-semibold text-slate-600'>Bottlenecks</p>
        <h1 className='m-0 text-3xl font-semibold text-slate-900'>
          Reset your password
        </h1>
        <p className='m-0 text-base leading-7 text-slate-600'>
          Enter your account email and we’ll send you a secure reset link. The
          link expires after one hour.
        </p>

        <form onSubmit={handleSubmit} noValidate className='grid gap-4'>
          <label className='grid gap-1.5'>
            <span className='text-sm font-medium text-slate-700'>Email</span>
            <input
              type='email'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete='email'
              className={inputClassName}
            />
          </label>

          {message ? (
            <p className='m-0 text-sm leading-6 text-emerald-700'>{message}</p>
          ) : null}
          {error ? <p className='m-0 text-sm text-red-700'>{error}</p> : null}

          <button
            type='submit'
            disabled={isPending}
            className='inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-70'
          >
            {isPending ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <Link
          href='/sign-in'
          className='w-fit text-sm font-medium text-slate-700 underline transition hover:text-slate-950'
        >
          Back to sign in
        </Link>
      </section>
    </main>
  )
}

const inputClassName =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200'
