'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type JoinOrganizationCardProps = {
  inviteToken: string
  inviteEmail: string
  organizationName: string
  inviteRole: string
  isAuthenticated: boolean
  sessionEmail: string | null
  isExpired: boolean
}

export function JoinOrganizationCard({
  inviteToken,
  inviteEmail,
  organizationName,
  inviteRole,
  isAuthenticated,
  sessionEmail,
  isExpired,
}: JoinOrganizationCardProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleAcceptInvite() {
    setError(null)
    setMessage(null)
    setIsPending(true)

    try {
      const response = await fetch('/api/organizations/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: inviteToken }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error ?? 'Unable to accept invitation.')
        return
      }

      setMessage(`Joined ${data.organization.name}. Redirecting...`)
      router.push('/app')
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <main className='grid min-h-screen place-items-center px-6 py-12'>
      <section className='grid w-full max-w-md gap-4 rounded-lg border border-slate-200 bg-white p-8 shadow-sm'>
        <p className='m-0 text-sm font-semibold text-slate-600'>Bottlenecks</p>
        <h1 className='m-0 text-3xl font-semibold  text-slate-900'>
          Join {organizationName}
        </h1>
        <p className='m-0 text-base leading-7 text-slate-600'>
          This invitation is for <strong>{inviteEmail}</strong> as an{' '}
          <strong className='capitalize'>{inviteRole}</strong>.
        </p>

        {isExpired ? (
          <p className='m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
            This invitation has expired. Ask your admin to send a new one.
          </p>
        ) : null}

        {!isAuthenticated ? (
          <div className='grid gap-3'>
            <p className='m-0 text-sm text-slate-600'>
              Sign in or create an account with <strong>{inviteEmail}</strong>{' '}
              to accept this invitation.
            </p>
            <div className='grid gap-3 sm:grid-cols-2'>
              <Link
                href={`/sign-in?invite=${encodeURIComponent(inviteToken)}`}
                className='inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700'
              >
                Sign in
              </Link>
              <Link
                href={`/sign-up?invite=${encodeURIComponent(inviteToken)}`}
                className='inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50'
              >
                Create account
              </Link>
            </div>
          </div>
        ) : (
          <div className='grid gap-3'>
            <p className='m-0 text-sm text-slate-600'>
              {sessionEmail === inviteEmail
                ? 'You are signed in with the right email. Accept the invitation when you are ready.'
                : `You are signed in as ${sessionEmail}. Switch to ${inviteEmail} to accept this invitation.`}
            </p>
            <button
              type='button'
              onClick={handleAcceptInvite}
              disabled={isPending || isExpired || sessionEmail !== inviteEmail}
              className='inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isPending ? 'Joining...' : `Join ${organizationName}`}
            </button>
          </div>
        )}

        {message ? (
          <p className='m-0 text-sm text-emerald-700'>{message}</p>
        ) : null}
        {error ? <p className='m-0 text-sm text-red-700'>{error}</p> : null}
      </section>
    </main>
  )
}
