'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

type AuthMode = 'sign-in' | 'sign-up'

type AuthFormProps = {
  mode: AuthMode
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  console.log(typeof password)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsPending(true)

    try {
      if (mode === 'sign-up') {
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
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: '/app',
          rememberMe: true,
        })

        if (result.error) {
          setError(result.error.message ?? 'Invalid email or password.')
          return
        }
      }

      router.push('/app')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='grid w-full max-w-sm gap-4'>
      {mode === 'sign-up' ? (
        <label className='grid gap-1.5'>
          <span className='text-sm font-medium text-slate-700'>Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder='Ada Lovelace'
            className={inputClassName}
          />
        </label>
      ) : null}

      <label className='grid gap-1.5'>
        <span className='text-sm font-medium text-slate-700'>Email</span>
        <input
          type='email'
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder='founder@company.com'
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
          placeholder='At least 8 characters'
          className={inputClassName}
        />
      </label>

      {error ? <p className='m-0 text-sm text-red-700'>{error}</p> : null}

      <button
        type='submit'
        disabled={isPending}
        className='inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-70'
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
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200'
