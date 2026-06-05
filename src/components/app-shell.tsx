'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { SignOutButton } from '@/components/sign-out-button'

type Organization = {
  id: string
  name: string
  slug: string
  created_at: string
  role: string
}

export function AppShell() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isOrganizationPending, setIsOrganizationPending] = useState(false)
  const [githubError, setGithubError] = useState<string | null>(null)
  const [isGithubPending, setIsGithubPending] = useState(false)

  useEffect(() => {
    if (!isPending && !session?.session) {
      router.replace('/sign-in')
    }
  }, [isPending, router, session])

  useEffect(() => {
    if (!session?.session) {
      return
    }

    let isMounted = true

    async function loadOrganization() {
      setIsOrganizationPending(true)

      try {
        const response = await fetch('/api/me/organization')

        if (!response.ok) {
          return
        }

        const data = (await response.json()) as Organization

        if (isMounted) {
          setOrganization(data)
        }
      } finally {
        if (isMounted) {
          setIsOrganizationPending(false)
        }
      }
    }

    loadOrganization()

    return () => {
      isMounted = false
    }
  }, [session])

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

  const canConnectGithub =
    organization?.role === 'owner' || organization?.role === 'admin'

  async function handleConnectGithub() {
    setGithubError(null)
    setIsGithubPending(true)

    try {
      const response = await fetch('/api/github/install-url')
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setGithubError(data?.error ?? 'Unable to start GitHub connection.')
        return
      }

      window.location.href = data.url
    } finally {
      setIsGithubPending(false)
    }
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
            Your account is connected to an organization workspace.
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
          Organization
        </h2>
        {isOrganizationPending ? (
          <p className='m-0 text-slate-600'>Loading organization...</p>
        ) : organization ? (
          <dl className='grid gap-4'>
            <div>
              <dt className='text-sm text-slate-500'>Name</dt>
              <dd className='mt-1 font-mono text-sm text-slate-900'>
                {organization.name}
              </dd>
            </div>
            <div>
              <dt className='text-sm text-slate-500'>Slug</dt>
              <dd className='mt-1 font-mono text-sm text-slate-900'>
                {organization.slug}
              </dd>
            </div>
            <div>
              <dt className='text-sm text-slate-500'>Role</dt>
              <dd className='mt-1 font-mono text-sm text-slate-900'>
                {organization.role}
              </dd>
            </div>
          </dl>
        ) : (
          <p className='m-0 text-slate-700'>
            No organization is connected to this account yet. Visit{' '}
            <Link
              href='/sign-up'
              className='font-medium text-slate-900 underline'
            >
              sign up
            </Link>{' '}
            to create a new workspace.
          </p>
        )}
      </section>

      <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h2 className='mb-4 text-xl font-semibold text-slate-900'>GitHub</h2>
        <p className='mb-4 text-slate-700'>
          Connect GitHub to start analyzing repositories, pull requests, review
          delays, and commit activity.
        </p>
        {canConnectGithub ? (
          <button
            type='button'
            onClick={handleConnectGithub}
            disabled={isGithubPending}
            className='inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-70'
          >
            {isGithubPending ? 'Connecting...' : 'Connect GitHub'}
          </button>
        ) : (
          <p className='m-0 text-sm text-slate-600'>
            Only organization owners and admins can connect GitHub.
          </p>
        )}
        {githubError ? (
          <p className='mt-3 text-sm text-red-700'>{githubError}</p>
        ) : null}
      </section>
    </main>
  )
}
