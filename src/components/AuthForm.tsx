'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

type AuthMode = 'sign-in' | 'sign-up'

type AuthFormProps = {
  mode: AuthMode
  inviteToken?: string | null
}

export function AuthForm({ mode, inviteToken }: AuthFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const validationError = validateAuthForm({
      email,
      password,
      mode,
    })

    if (validationError) {
      setError(validationError)
      return
    }

    setIsPending(true)

    try {
      if (mode === 'sign-up') {
        const emailAvailabilityResult = await fetch(
          '/api/users/email-availability',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          }
        )
        const emailAvailability = await emailAvailabilityResult
          .json()
          .catch(() => null)

        if (!emailAvailabilityResult.ok) {
          setError(
            emailAvailability?.error ?? 'Unable to validate email address.'
          )
          return
        }

        if (!emailAvailability.available) {
          setError('An account already exists with this email address.')
          return
        }

        const intentResponse = await fetch('/api/sign-up-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            organizationName: inviteToken ? undefined : organizationName,
            inviteToken: inviteToken ?? undefined,
          }),
        })
        const intentData = await intentResponse.json().catch(() => null)

        if (!intentResponse.ok) {
          setError(intentData?.error ?? 'Unable to save sign-up details.')
          return
        }

        const result = await authClient.signUp.email({
          name,
          email,
          password,
          callbackURL: '/app',
        })

        if (result.error) {
          setError(result.error.message ?? 'Unable to create your account.')
          return
        }

        router.push(
          `/check-email?email=${encodeURIComponent(email)}${inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ''}`
        )
        router.refresh()
        return
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: '/app',
          rememberMe: true,
        })

        if (result.error) {
          if (isEmailNotVerifiedError(result.error)) {
            router.push(
              `/check-email?email=${encodeURIComponent(email)}${inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ''}`
            )
            router.refresh()
            return
          }

          setError(result.error.message ?? 'Invalid email or password.')
          return
        }
      }

      router.push(
        inviteToken ? `/join?invite=${encodeURIComponent(inviteToken)}` : '/app'
      )
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className='grid w-full max-w-sm gap-4'
    >
      {mode === 'sign-up' ? (
        <label className='grid gap-1.5'>
          <span className='text-sm font-medium text-slate-700'>Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className={inputClassName}
          />
        </label>
      ) : null}

      {mode === 'sign-up' ? (
        <label className='grid gap-1.5'>
          <span className='text-sm font-medium text-slate-700'>
            Organization
          </span>
          <input
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
            required={!inviteToken}
            disabled={Boolean(inviteToken)}
            className={inputClassName}
          />
          {inviteToken ? (
            <span className='text-xs leading-5 text-slate-500'>
              This account will join the organization from your invite instead
              of creating a new one.
            </span>
          ) : null}
        </label>
      ) : null}

      <label className='grid gap-1.5'>
        <span className='text-sm font-medium text-slate-700'>Email</span>
        <input
          type='email'
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className={inputClassName}
        />
      </label>

      <label className='grid gap-1.5'>
        <span className='text-sm font-medium text-slate-700'>Password</span>
        <input
          type='password'
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          className={inputClassName}
        />
        {mode === 'sign-up' ? (
          <span className='text-xs leading-5 text-slate-500'>
            Use at least 8 characters with one uppercase letter, one number, and
            one symbol.
          </span>
        ) : null}
      </label>

      {mode === 'sign-in' ? (
        <Link
          href='/forgot-password'
          className='w-fit text-sm font-medium text-slate-700 underline transition hover:text-slate-950'
        >
          Forgot password?
        </Link>
      ) : null}

      {error ? <p className='m-0 text-sm text-red-700'>{error}</p> : null}

      <button
        type='submit'
        disabled={isPending}
        className='inline-flex items-center justify-center rounded-xl bg-brand-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-wait disabled:opacity-70'
      >
        {isPending
          ? mode === 'sign-up'
            ? 'Creating account...'
            : 'Signing in...'
          : mode === 'sign-up'
            ? 'Create account'
            : 'Sign in'}
      </button>
    </form>
  )
}

const inputClassName =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

function validateAuthForm({
  email,
  password,
  mode,
}: {
  email: string
  password: string
  mode: AuthMode
}) {
  if (!isValidEmail(email)) {
    return 'Enter a valid email address.'
  }

  if (mode === 'sign-up') {
    const passwordErrors = getPasswordErrors(password)

    if (passwordErrors.length) {
      return `Password must include ${formatValidationList(passwordErrors)}.`
    }
  }

  return null
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function isEmailNotVerifiedError(error: { code?: string; message?: string }) {
  return (
    error.code === 'EMAIL_NOT_VERIFIED' ||
    error.message?.toLowerCase().includes('email not verified') === true
  )
}

function getPasswordErrors(value: string) {
  const errors: string[] = []

  if (value.length < 8) {
    errors.push('at least 8 characters')
  }

  if (!/[A-Z]/.test(value)) {
    errors.push('one uppercase letter')
  }

  if (!/\d/.test(value)) {
    errors.push('one number')
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    errors.push('one symbol')
  }

  return errors
}

function formatValidationList(values: string[]) {
  if (values.length === 1) {
    return values[0]
  }

  return `${values.slice(0, -1).join(', ')} and ${values[values.length - 1]}`
}
