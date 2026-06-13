'use client'

import { useState } from 'react'
import { DashboardMetrics } from '@/components/DashboardMetrics'
import { GitHubPanel } from '@/components/GithubPanel'
import { RepositoryTable } from '@/components/RepositoryTable'
import { SignOutButton } from '@/components/SignOutButton'
import type { Workspace } from '@/components/dashboardTypes'

type DashboardPageProps = {
  initialWorkspace: Workspace
}

export function DashboardPage({ initialWorkspace }: DashboardPageProps) {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace)
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

  const organization = workspace.organization
  const github = workspace.github
  const greeting = getGreeting()

  const canManageIntegrations =
    organization?.role === 'owner' || organization?.role === 'admin'

  async function refreshWorkspace() {
    const response = await fetch('/api/me/workspace')
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      setWorkspaceError(data?.error ?? 'Unable to refresh workspace.')
      return
    }

    setWorkspace(data as Workspace)
  }

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
      const response = await fetch('/api/integrations/sync-repositories', {
        method: 'POST',
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setGithubError(data?.error ?? 'Unable to sync repositories.')
        return
      }

      setGithubSyncMessage(`Synced ${data.synced} repositories.`)
      await refreshWorkspace()
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
      const response = await fetch('/api/integrations/sync-pull-requests', {
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
      await refreshWorkspace()
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
              {greeting}, {workspace.user.name ?? 'Workspace setup'}
            </h1>
            <p className='mt-2 text-slate-500'>
              Here is how your engineering org is doing.
            </p>
          </div>
          <div className='flex min-w-0 items-center gap-3 sm:shrink-0'>
            <div className='min-w-0 text-left text-sm text-slate-600 sm:text-right'>
              <p className='m-0 font-medium text-slate-900'>
                {workspace.user.name}
              </p>
              <p className='m-0 break-all'>{workspace.user.email}</p>
            </div>
            <SignOutButton />
          </div>
        </header>

        {workspaceError ? (
          <section className='rounded-lg border border-red-200 bg-red-50 p-5 text-red-800'>
            {workspaceError}
          </section>
        ) : null}

        <DashboardMetrics github={github} />

        <section className='grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]'>
          <RepositoryTable
            repositories={github?.repositories ?? []}
            isGithubConnected={Boolean(github?.connected)}
            canManageIntegrations={canManageIntegrations}
            isGithubSyncPending={isGithubSyncPending}
            isPullRequestSyncPending={isPullRequestSyncPending}
            syncingPullRequestRepositoryId={syncingPullRequestRepositoryId}
            onSyncRepositories={handleSyncRepositories}
            onSyncPullRequests={handleSyncPullRequests}
          />

          <aside className='grid gap-6'>
            <GitHubPanel
              connected={Boolean(github?.connected)}
              accountLogin={github?.accountLogin ?? null}
              installationId={github?.installationId ?? null}
              lastRepositorySyncedAt={github?.lastRepositorySyncedAt ?? null}
              repositorySyncStatus={github?.repositorySyncStatus ?? 'idle'}
              repositorySyncError={github?.repositorySyncError ?? null}
              canManageIntegrations={canManageIntegrations}
              isGithubPending={isGithubPending}
              githubSyncMessage={githubSyncMessage}
              githubError={githubError}
              onConnectGithub={handleConnectGithub}
            />

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

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) {
    return 'Good morning'
  }

  if (hour < 18) {
    return 'Good afternoon'
  }

  return 'Good evening'
}
