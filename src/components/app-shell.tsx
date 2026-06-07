'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { MetricCard } from '@/components/metric-card'
import { SignOutButton } from '@/components/sign-out-button'

import { FaGithubSquare } from 'react-icons/fa'
import { FaArrowsRotate } from 'react-icons/fa6'
import { RiGitRepositoryFill } from 'react-icons/ri'
import { FaClock } from 'react-icons/fa6'
import { FiActivity } from 'react-icons/fi'

type Workspace = {
  user: {
    id: string
    name: string
    email: string
  }
  organization: {
    id: string
    name: string
    slug: string
    created_at: string
    role: string
  } | null
  github: {
    connected: boolean
    accountLogin: string | null
    repositories: Repository[]
    pullRequests: {
      total: number
      waitingForReview: number
      averageHoursToFirstReview: number | null
    }
  }
}

type Repository = {
  id: string
  owner: string
  name: string
  full_name: string
  default_branch: string
  private: boolean
  updated_at: string
}

export function AppShell() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [isWorkspacePending, setIsWorkspacePending] = useState(false)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [githubError, setGithubError] = useState<string | null>(null)
  const [githubSyncMessage, setGithubSyncMessage] = useState<string | null>(
    null
  )
  const [isGithubPending, setIsGithubPending] = useState(false)
  const [isGithubSyncPending, setIsGithubSyncPending] = useState(false)
  const [isPullRequestSyncPending, setIsPullRequestSyncPending] =
    useState(false)
  const [syncingPullRequestRepositoryId, setSyncingPullRequestRepositoryId] =
    useState<string | null>(null)

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

    async function loadWorkspace() {
      setIsWorkspacePending(true)
      setWorkspaceError(null)

      try {
        const response = await fetch('/api/me/workspace')
        const data = await response.json().catch(() => null)

        if (!response.ok) {
          setWorkspaceError(data?.error ?? 'Unable to load workspace.')
          return
        }

        if (isMounted) {
          setWorkspace(data as Workspace)
        }
      } finally {
        if (isMounted) {
          setIsWorkspacePending(false)
        }
      }
    }

    loadWorkspace()

    return () => {
      isMounted = false
    }
  }, [session])

  if (isPending || isWorkspacePending) {
    return (
      <main className='grid min-h-screen place-items-center px-6 py-12 text-slate-600'>
        Loading workspace...
      </main>
    )
  }

  if (!session?.session || !session.user) {
    return null
  }

  const organization = workspace?.organization
  const github = workspace?.github
  const canManageIntegrations =
    organization?.role === 'owner' || organization?.role === 'admin'

  async function handleConnectGithub() {
    setGithubError(null)
    setGithubSyncMessage(null)
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

  async function handleSyncRepositories() {
    setGithubError(null)
    setGithubSyncMessage(null)
    setIsGithubSyncPending(true)

    try {
      const response = await fetch('/api/github/sync-repositories', {
        method: 'POST',
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setGithubError(data?.error ?? 'Unable to sync repositories.')
        return
      }

      setGithubSyncMessage(`Synced ${data.synced} repositories.`)
      router.refresh()
      window.location.reload()
    } finally {
      setIsGithubSyncPending(false)
    }
  }

  async function handleSyncPullRequests(repositoryId?: string) {
    setGithubError(null)
    setGithubSyncMessage(null)

    if (repositoryId) {
      setSyncingPullRequestRepositoryId(repositoryId)
    } else {
      setIsPullRequestSyncPending(true)
    }

    try {
      const response = await fetch('/api/github/sync-pull-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: repositoryId ? JSON.stringify({ repositoryId }) : undefined,
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setGithubError(data?.error ?? 'Unable to sync pull requests.')
        return
      }

      setGithubSyncMessage(`Synced ${data.synced} pull requests.`)
      router.refresh()
      window.location.reload()
    } finally {
      if (repositoryId) {
        setSyncingPullRequestRepositoryId(null)
      } else {
        setIsPullRequestSyncPending(false)
      }
    }
  }

  return (
    <main className='min-h-screen overflow-x-hidden bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-8'>
      <div className='mx-auto grid max-w-6xl min-w-0 gap-6'>
        <header className='flex min-w-0 flex-col justify-between gap-4 pb-6 sm:flex-row sm:items-start'>
          <div className='min-w-0'>
            <h1 className='m-0 max-w-full break-words text-3xl font-semibold tracking-tight'>
              Good afternoon, {session.user?.name ?? 'Workspace setup'}
            </h1>
            <p className='mt-2 text-slate-500'>
              Here is how your engineering org is doing.
            </p>
          </div>
          <div className='flex min-w-0 items-center gap-3 sm:shrink-0'>
            <div className='min-w-0 text-left text-sm text-slate-600 sm:text-right'>
              <p className='m-0 font-medium text-slate-900'>
                {session.user.name}
              </p>
              <p className='m-0 break-all'>{session.user.email}</p>
            </div>
            <SignOutButton />
          </div>
        </header>
        {workspaceError ? (
          <section className='rounded-lg border border-red-200 bg-red-50 p-5 text-red-800'>
            {workspaceError}
          </section>
        ) : null}

        <section className='grid gap-4 md:grid-cols-3'>
          <MetricCard
            label='Repositories'
            value={github?.repositories.length ?? 0}
            detail='Synced from GitHub'
            icon={<RiGitRepositoryFill className='text-3xl' />}
          />
          <MetricCard
            label='PR Review Time'
            value={formatReviewTime(
              github?.pullRequests.averageHoursToFirstReview
            )}
            detail='First review and cycle-time metrics'
            icon={<FaClock className='text-2xl' />}
          />
          <MetricCard
            label='Waiting Review'
            value={github?.pullRequests.waitingForReview ?? 0}
            detail={`${github?.pullRequests.total ?? 0} pull requests synced`}
            icon={<FiActivity className='text-3xl' />}
          />
        </section>
        <section className='grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]'>
          <div className='min-w-0 rounded-lg bg-white p-4 sm:p-6'>
            <div className='mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
              <div className='min-w-0 gap-x-2 grid items-center grid-rows-[24px_24px] grid-cols-[max-content_auto]'>
                <FaGithubSquare className='text-5xl col-start-1 col-end-2 row-span-full' />
                <h2 className='text-xl font-semibold'>Repositories</h2>

                <p className='col-start-2 text-sm text-slate-600'>
                  All repositories accessible through your GitHub installation.
                </p>
              </div>
              {canManageIntegrations ? (
                <div className='grid gap-2 w-[250px]'>
                  <button
                    type='button'
                    onClick={handleSyncRepositories}
                    disabled={isGithubSyncPending || !github?.connected}
                    className='inline-flex items-center justify-center rounded-lg border border-purple-primary gap-2 mt-0 bg-white px-4 py-2 text-sm font-medium cursor-pointer text-purple-primary transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60'
                  >
                    <FaArrowsRotate />
                    {isGithubSyncPending ? 'Syncing...' : 'Sync repositories'}
                  </button>
                  <button
                    type='button'
                    onClick={() => handleSyncPullRequests()}
                    disabled={
                      isPullRequestSyncPending || !github?.repositories.length
                    }
                    className='inline-flex items-center justify-center rounded-lg border border-purple-primary gap-2 mt-0 bg-white px-4 py-2 text-sm font-medium cursor-pointer text-purple-primary transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60'
                  >
                    <FaArrowsRotate />
                    {isPullRequestSyncPending
                      ? 'Syncing...'
                      : 'Sync all repository PRs'}
                  </button>
                </div>
              ) : null}
            </div>

            {github?.repositories.length ? (
              <div className='overflow-x-auto rounded-lg border border-slate-200'>
                <table className='w-full min-w-[640px] border-collapse text-left text-sm'>
                  <thead className='bg-slate-50 text-slate-500'>
                    <tr>
                      <th className='px-4 py-3 font-medium'>Repository</th>
                      <th className='px-4 py-3 font-medium'>Default branch</th>
                      <th className='px-4 py-3 font-medium'>Visibility</th>
                      <th className='px-4 py-3 font-medium'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-200'>
                    {github.repositories.map((repository) => (
                      <tr key={repository.id}>
                        <td className='px-4 py-3'>
                          <Link
                            href={`/app/repositories/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`}
                            className='font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900'
                          >
                            {repository.full_name}
                          </Link>
                          <p className='m-0 text-xs text-slate-500'>
                            Last synced {formatDate(repository.updated_at)}
                          </p>
                        </td>
                        <td className='px-4 py-3 font-mono text-xs text-slate-700'>
                          {repository.default_branch}
                        </td>
                        <td className='px-4 py-3 text-slate-700'>
                          {repository.private ? 'Private' : 'Public'}
                        </td>
                        <td className='px-4 py-3'>
                          <button
                            type='button'
                            onClick={() =>
                              handleSyncPullRequests(repository.id)
                            }
                            disabled={
                              syncingPullRequestRepositoryId === repository.id
                            }
                            className='inline-flex items-center justify-center rounded-lg border border-purple-primary gap-2 bg-white px-3 py-2 text-xs font-medium cursor-pointer text-purple-primary transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60'
                          >
                            <FaArrowsRotate />
                            {syncingPullRequestRepositoryId === repository.id
                              ? 'Syncing'
                              : 'Sync PRs'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title='No repositories synced'
                body={
                  github?.connected
                    ? 'Sync repositories to start building bottleneck metrics.'
                    : 'Connect GitHub to choose repositories for analysis.'
                }
              />
            )}
          </div>

          <aside className='grid gap-6'>
            <section className='rounded-lg bg-white p-6'>
              <h2 className='m-0 text-xl font-semibold'>GitHub</h2>
              <p className='mt-2 text-sm leading-6 text-slate-600'>
                Connect the GitHub organization that owns the repositories you
                want to analyze.
              </p>
              <dl className='my-5 grid gap-3 text-sm'>
                <div>
                  <dt className='text-slate-500'>Status</dt>
                  <dd className='mt-1 font-medium'>
                    {github?.connected ? 'Connected' : 'Not connected'}
                  </dd>
                </div>
                <div>
                  <dt className='text-slate-500'>Account</dt>
                  <dd className='mt-1 font-medium'>
                    {github?.accountLogin === 'pending-sync'
                      ? 'Sync repositories to identify account'
                      : (github?.accountLogin ?? 'Not connected')}
                  </dd>
                </div>
              </dl>
              {canManageIntegrations ? (
                <div className='grid gap-3'>
                  <button
                    type='button'
                    onClick={handleConnectGithub}
                    disabled={isGithubPending}
                    className='inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-70'
                  >
                    {isGithubPending
                      ? 'Connecting...'
                      : github?.connected
                        ? 'Reconnect GitHub'
                        : 'Connect GitHub'}
                  </button>
                  {githubSyncMessage ? (
                    <p className='m-0 text-sm text-emerald-700'>
                      {githubSyncMessage}
                    </p>
                  ) : null}
                  {githubError ? (
                    <p className='m-0 text-sm text-red-700'>{githubError}</p>
                  ) : null}
                </div>
              ) : (
                <p className='m-0 text-sm text-slate-600'>
                  Only organization owners and admins can manage GitHub.
                </p>
              )}
            </section>

            <section className='rounded-lg bg-white p-6'>
              <h2 className='m-0 text-xl font-semibold'>Next Metrics</h2>
              <ul className='mt-4 grid gap-3 pl-5 text-sm leading-6 text-slate-700'>
                <li>Average time to first PR review</li>
                <li>Open PRs waiting longer than a week</li>
                <li>Last commit by repository</li>
                <li>PR cycle time by repository</li>
              </ul>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className='min-w-0 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center'>
      <h3 className='m-0 text-base font-semibold text-slate-900'>{title}</h3>
      <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600'>
        {body}
      </p>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatReviewTime(hours: number | null | undefined) {
  if (hours === null || hours === undefined) {
    return 'No data'
  }

  if (hours < 24) {
    return `${hours.toFixed(1)}h`
  }

  return `${(hours / 24).toFixed(1)}d`
}
