'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { authClient } from '@/lib/auth-client'

type ResetPasswordFormProps = {
  token: string | null
  hasInvalidToken: boolean
}

export function ResetPasswordForm({
  token,
  hasInvalidToken,
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError('This password reset link is invalid or has expired.')
      return
    }

    const passwordError = getPasswordValidationError(password)

    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setIsPending(true)

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (result.error) {
        const invalidToken =
          result.error.code === 'INVALID_TOKEN' ||
          result.error.message?.toLowerCase().includes('invalid token') === true

        setError(
          invalidToken
            ? 'This password reset link is invalid or has expired.'
            : (result.error.message ?? 'Unable to reset your password.')
        )
        return
      }

      setIsComplete(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  const cannotReset = hasInvalidToken || !token

  return (
    <main className='grid min-h-screen place-items-center px-6 py-12'>
      <section className='grid w-full max-w-md gap-4 rounded-lg border border-slate-200 bg-white p-8 shadow-sm'>
        <p className='m-0 text-sm font-semibold text-slate-600'>Bottlenecks</p>
        <h1 className='m-0 text-3xl font-semibold text-slate-900'>
          {isComplete ? 'Password updated' : 'Choose a new password'}
        </h1>

        {isComplete ? (
          <>
            <p className='m-0 text-base leading-7 text-slate-600'>
              Your password has been changed and your previous sessions have
              been signed out.
            </p>
            <Link
              href='/sign-in'
              className='inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700'
            >
              Sign in with your new password
            </Link>
          </>
        ) : cannotReset ? (
          <>
            <p className='m-0 text-base leading-7 text-red-700'>
              This password reset link is invalid or has expired. Request a new
              link to continue.
            </p>
            <Link
              href='/forgot-password'
              className='inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700'
            >
              Request another link
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate className='grid gap-4'>
            <p className='m-0 text-sm leading-6 text-slate-600'>
              Use at least 8 characters with one uppercase letter, one number,
              and one symbol.
            </p>

            <label className='grid gap-1.5'>
              <span className='text-sm font-medium text-slate-700'>
                New password
              </span>
              <input
                type='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                autoComplete='new-password'
                className={inputClassName}
              />
            </label>

            <label className='grid gap-1.5'>
              <span className='text-sm font-medium text-slate-700'>
                Confirm new password
              </span>
              <input
                type='password'
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                autoComplete='new-password'
                className={inputClassName}
              />
            </label>

            {error ? <p className='m-0 text-sm text-red-700'>{error}</p> : null}

            <button
              type='submit'
              disabled={isPending}
              className='inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-70'
            >
              {isPending ? 'Updating password...' : 'Update password'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

const inputClassName =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200'

function getPasswordValidationError(value: string) {
  const errors: string[] = []

  if (value.length < 8) errors.push('at least 8 characters')
  if (!/[A-Z]/.test(value)) errors.push('one uppercase letter')
  if (!/\d/.test(value)) errors.push('one number')
  if (!/[^A-Za-z0-9]/.test(value)) errors.push('one symbol')

  if (!errors.length) return null
  if (errors.length === 1) return `Password must include ${errors[0]}.`

  return `Password must include ${errors.slice(0, -1).join(', ')} and ${errors[errors.length - 1]}.`
}
