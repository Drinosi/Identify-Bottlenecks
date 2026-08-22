'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DashboardMetrics } from '@/components/DashboardMetrics'
import {
  FirstSyncDialog,
  type FirstSyncStep,
  type FirstSyncStepStatus,
} from '@/components/FirstSyncDialog'
import { GitHubPanel } from '@/components/GithubPanel'
import { OrganizationMembersPanel } from '@/components/OrganizationMembersPanel'
import { RepositoryTable } from '@/components/RepositoryTable'
import type { Workspace } from '@/components/dashboardTypes'

type DashboardPageProps = {
  initialWorkspace: Workspace
  initialGithubStatus: string | null
}

export function DashboardPage({
  initialWorkspace,
  initialGithubStatus,
}: DashboardPageProps) {
  const router = useRouter()
  const initialGithubStatusMessage = initialGithubStatus
    ? getGithubStatusMessage(initialGithubStatus)
    : null
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [githubError, setGithubError] = useState<string | null>(
    initialGithubStatusMessage?.type === 'error'
      ? initialGithubStatusMessage.message
      : null
  )
  const [githubSyncMessage, setGithubSyncMessage] = useState<string | null>(
    initialGithubStatusMessage?.type === 'success'
      ? initialGithubStatusMessage.message
      : null
  )
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false)
  const [githubDisconnectUrl, setGithubDisconnectUrl] = useState<string | null>(
    null
  )
  const [isGithubPending, setIsGithubPending] = useState(false)
  const [isDisconnectGithubPending, setIsDisconnectGithubPending] =
    useState(false)
  const [isGithubSyncPending, setIsGithubSyncPending] = useState(false)
  const [isPullRequestSyncPending, setIsPullRequestSyncPending] =
    useState(false)
  const [isWorkflowRunSyncPending, setIsWorkflowRunSyncPending] =
    useState(false)
  const [syncingPullRequestRepositoryId, setSyncingPullRequestRepositoryId] =
    useState<string | null>(null)
  const [syncingWorkflowRunRepositoryId, setSyncingWorkflowRunRepositoryId] =
    useState<string | null>(null)
  const isFirstConnection = initialGithubStatus === 'connected-first'
  const [isFirstSyncDialogOpen, setIsFirstSyncDialogOpen] =
    useState(isFirstConnection)
  const [isFirstSyncPending, setIsFirstSyncPending] = useState(false)
  const [firstSyncError, setFirstSyncError] = useState<string | null>(null)
  const [hasStartedFirstSync, setHasStartedFirstSync] = useState(false)
  const [firstSyncSteps, setFirstSyncSteps] = useState<FirstSyncStep[]>(
    createFirstSyncSteps()
  )

  const organization = workspace.organization
  const github = workspace.github
  const greeting = getGreeting()

  const canManageIntegrations =
    organization?.role === 'owner' || organization?.role === 'admin'

  useEffect(() => {
    if (initialGithubStatus) {
      router.replace('/app')
    }
  }, [initialGithubStatus, router])

  async function refreshWorkspace() {
    const response = await fetch('/api/me/workspace')
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      setWorkspaceError(data?.error ?? 'Unable to refresh workspace.')
      return
    }

    setWorkspace(data as Workspace)
  }

  async function syncRepositories(): Promise<boolean> {
    const response = await fetch('/api/integrations/sync-repositories', {
      method: 'POST',
    })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      setGithubError(data?.error ?? 'Unable to sync repositories.')
      return false
    }

    setGithubSyncMessage(`Synced ${data.synced} repositories.`)
    return true
  }

  async function syncPullRequests(repositoryId?: string): Promise<boolean> {
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
      return false
    }

    setGithubSyncMessage(`Synced ${data.synced} pull requests.`)
    return true
  }

  async function syncWorkflowRuns(repositoryId?: string): Promise<boolean> {
    const response = await fetch('/api/integrations/sync-workflow-runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: repositoryId ? JSON.stringify({ repositoryId }) : undefined,
    })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      setGithubError(data?.error ?? 'Unable to sync pipeline runs.')
      return false
    }

    setGithubSyncMessage(`Synced ${data.synced} pipeline runs.`)
    return true
  }

  async function handleConnectGithub() {
    setGithubError(null)
    setGithubSyncMessage(null)
    setGithubDisconnectUrl(null)
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
    setGithubDisconnectUrl(null)
    setIsGithubSyncPending(true)

    try {
      const didSync = await syncRepositories()

      if (!didSync) {
        return
      }

      await refreshWorkspace()
    } finally {
      setIsGithubSyncPending(false)
    }
  }

  async function handleDisconnectGithub() {
    setIsDisconnectDialogOpen(false)
    setGithubError(null)
    setGithubSyncMessage(null)
    setGithubDisconnectUrl(null)
    setIsDisconnectGithubPending(true)

    try {
      const response = await fetch('/api/github/connection', {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setGithubError(data?.error ?? 'Unable to disconnect GitHub.')
        return
      }

      setGithubSyncMessage('Disconnected GitHub.')
      setGithubDisconnectUrl(data?.uninstallUrl ?? null)
      await refreshWorkspace()
    } finally {
      setIsDisconnectGithubPending(false)
    }
  }

  async function handleSyncPullRequests(repositoryId?: string) {
    setGithubError(null)
    setGithubSyncMessage(null)
    setGithubDisconnectUrl(null)

    if (repositoryId) {
      setSyncingPullRequestRepositoryId(repositoryId)
    } else {
      setIsPullRequestSyncPending(true)
    }

    try {
      const didSync = await syncPullRequests(repositoryId)

      if (!didSync) {
        return
      }

      await refreshWorkspace()
    } finally {
      if (repositoryId) {
        setSyncingPullRequestRepositoryId(null)
      } else {
        setIsPullRequestSyncPending(false)
      }
    }
  }

  async function handleSyncWorkflowRuns(repositoryId?: string) {
    setGithubError(null)
    setGithubSyncMessage(null)
    setGithubDisconnectUrl(null)

    if (repositoryId) {
      setSyncingWorkflowRunRepositoryId(repositoryId)
    } else {
      setIsWorkflowRunSyncPending(true)
    }

    try {
      const didSync = await syncWorkflowRuns(repositoryId)

      if (!didSync) {
        return
      }

      await refreshWorkspace()
    } finally {
      if (repositoryId) {
        setSyncingWorkflowRunRepositoryId(null)
      } else {
        setIsWorkflowRunSyncPending(false)
      }
    }
  }

  async function handleSyncAll() {
    await handleSyncRepositories()
    await handleSyncPullRequests()
    await handleSyncWorkflowRuns()
  }

  async function handleRunFirstSync() {
    setGithubError(null)
    setGithubSyncMessage(null)
    setGithubDisconnectUrl(null)
    setFirstSyncError(null)
    setHasStartedFirstSync(true)
    setIsFirstSyncPending(true)
    setFirstSyncSteps(createFirstSyncSteps())

    try {
      const steps: Array<{
        key: FirstSyncStep['key']
        run: () => Promise<boolean>
        failureMessage: string
      }> = [
        {
          key: 'repositories',
          run: syncRepositories,
          failureMessage: 'Unable to sync repositories.',
        },
        {
          key: 'pullRequests',
          run: () => syncPullRequests(),
          failureMessage: 'Unable to sync pull requests.',
        },
        {
          key: 'workflowRuns',
          run: () => syncWorkflowRuns(),
          failureMessage: 'Unable to sync pipeline runs.',
        },
      ]

      for (const step of steps) {
        setFirstSyncSteps((currentSteps) =>
          updateFirstSyncStep(currentSteps, step.key, 'loading')
        )

        const didSync = await step.run()

        if (!didSync) {
          setFirstSyncSteps((currentSteps) =>
            updateFirstSyncStep(currentSteps, step.key, 'error')
          )
          setFirstSyncError(step.failureMessage)
          return
        }

        setFirstSyncSteps((currentSteps) =>
          updateFirstSyncStep(currentSteps, step.key, 'success')
        )

        await refreshWorkspace()
      }
    } finally {
      setIsFirstSyncPending(false)
    }
  }

  return (
    <>
      <ConfirmDialog
        open={isDisconnectDialogOpen}
        title='Disconnect GitHub?'
        description='This removes the GitHub connection for this organization and clears synced repositories, pull requests, and pipeline data from the app.'
        confirmLabel='Disconnect GitHub'
        isPending={isDisconnectGithubPending}
        tone='danger'
        onConfirm={handleDisconnectGithub}
        onCancel={() => setIsDisconnectDialogOpen(false)}
      />
      <FirstSyncDialog
        open={isFirstSyncDialogOpen}
        steps={firstSyncSteps}
        hasStarted={hasStartedFirstSync}
        isPending={isFirstSyncPending}
        error={firstSyncError}
        onStart={handleRunFirstSync}
        onClose={() => setIsFirstSyncDialogOpen(false)}
      />
      <main className='overflow-x-hidden px-4 py-6 text-slate-900 sm:px-6 sm:py-8'>
        <div className='mx-auto grid max-w-6xl min-w-0 gap-6'>
          <header>
            <h1 className='m-0 max-w-full break-words text-3xl font-semibold '>
              {greeting}, {workspace.user.name ?? workspace.user.email}
            </h1>
            <p className='mt-2 text-slate-500'>
              Here is how your engineering org is doing.
            </p>
          </header>

          {workspaceError ? (
            <section className='rounded-lg border border-red-200 bg-red-50 p-5 text-red-800'>
              {workspaceError}
            </section>
          ) : null}

          {github?.connected ? (
            <>
              <DashboardMetrics
                github={github}
                thresholds={workspace.metricThresholds}
              />

              {organization ? (
                <OrganizationMembersPanel
                  organization={organization}
                  members={workspace.members}
                  invitations={workspace.invitations}
                  onRefreshWorkspace={refreshWorkspace}
                />
              ) : null}

              <section className='grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]'>
                <RepositoryTable
                  repositories={github?.repositories ?? []}
                  isGithubConnected={Boolean(github?.connected)}
                  canManageIntegrations={canManageIntegrations}
                  isGithubSyncPending={isGithubSyncPending}
                  isPullRequestSyncPending={isPullRequestSyncPending}
                  isWorkflowRunSyncPending={isWorkflowRunSyncPending}
                  syncingPullRequestRepositoryId={
                    syncingPullRequestRepositoryId
                  }
                  syncingWorkflowRunRepositoryId={
                    syncingWorkflowRunRepositoryId
                  }
                  onSyncRepositories={handleSyncRepositories}
                  onSyncPullRequests={handleSyncPullRequests}
                  onSyncWorkflowRuns={handleSyncWorkflowRuns}
                  onSyncAll={handleSyncAll}
                />

                <aside className='grid h-max gap-6'>
                  <GitHubPanel
                    connected={Boolean(github?.connected)}
                    accountLogin={github?.accountLogin ?? null}
                    installationId={github?.installationId ?? null}
                    lastRepositorySyncedAt={
                      github?.lastRepositorySyncedAt ?? null
                    }
                    repositorySyncStatus={
                      github?.repositorySyncStatus ?? 'idle'
                    }
                    repositorySyncError={github?.repositorySyncError ?? null}
                    canManageIntegrations={canManageIntegrations}
                    isGithubPending={isGithubPending}
                    isDisconnectGithubPending={isDisconnectGithubPending}
                    githubSyncMessage={githubSyncMessage}
                    githubError={githubError}
                    githubDisconnectUrl={githubDisconnectUrl}
                    onConnectGithub={handleConnectGithub}
                    onDisconnectGithub={() => setIsDisconnectDialogOpen(true)}
                  />
                </aside>
              </section>
            </>
          ) : (
            <section className='grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]'>
              <section className='rounded-lg h-max border border-dashed border-slate-300 bg-white p-8 sm:p-10'>
                <div className='max-w-2xl'>
                  <p className='m-0 text-sm font-semibold uppercase text-slate-500'>
                    Connect GitHub To Get Started
                  </p>
                  <h2 className='mt-3 text-3xl font-semibold  text-slate-950'>
                    Your dashboard comes alive after your first GitHub
                    connection.
                  </h2>
                  <p className='mt-4 text-base leading-7 text-slate-600'>
                    Connect your GitHub App installation to start syncing
                    repositories, pull requests, pipeline runs, and bottleneck
                    metrics for your organization.
                  </p>
                </div>
                <div className='mt-8 grid gap-4 sm:grid-cols-3'>
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
                    <p className='m-0 text-sm font-semibold text-slate-900'>
                      1. Connect the app
                    </p>
                    <p className='mt-2 text-sm leading-6 text-slate-600'>
                      Install the GitHub App for your organization or account.
                    </p>
                  </div>
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
                    <p className='m-0 text-sm font-semibold text-slate-900'>
                      2. Sync your data
                    </p>
                    <p className='mt-2 text-sm leading-6 text-slate-600'>
                      Pull in repositories, pull requests, and workflow runs.
                    </p>
                  </div>
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
                    <p className='m-0 text-sm font-semibold text-slate-900'>
                      3. Review bottlenecks
                    </p>
                    <p className='mt-2 text-sm leading-6 text-slate-600'>
                      Track review delays, merge time, and pipeline health in
                      one place.
                    </p>
                  </div>
                </div>
              </section>

              <aside className='grid h-max gap-6'>
                <GitHubPanel
                  connected={Boolean(github?.connected)}
                  accountLogin={github?.accountLogin ?? null}
                  installationId={github?.installationId ?? null}
                  lastRepositorySyncedAt={
                    github?.lastRepositorySyncedAt ?? null
                  }
                  repositorySyncStatus={github?.repositorySyncStatus ?? 'idle'}
                  repositorySyncError={github?.repositorySyncError ?? null}
                  canManageIntegrations={canManageIntegrations}
                  isGithubPending={isGithubPending}
                  isDisconnectGithubPending={isDisconnectGithubPending}
                  githubSyncMessage={githubSyncMessage}
                  githubError={githubError}
                  githubDisconnectUrl={githubDisconnectUrl}
                  onConnectGithub={handleConnectGithub}
                  onDisconnectGithub={() => setIsDisconnectDialogOpen(true)}
                />
              </aside>
            </section>
          )}
        </div>
      </main>
    </>
  )
}

function createFirstSyncSteps(): FirstSyncStep[] {
  return [
    {
      key: 'repositories',
      label: 'Syncing repositories',
      description:
        'Pull in the repositories available to this GitHub installation.',
      status: 'idle',
    },
    {
      key: 'pullRequests',
      label: 'Syncing pull requests',
      description:
        'Fetch open and recent pull request activity for repository metrics.',
      status: 'idle',
    },
    {
      key: 'workflowRuns',
      label: 'Syncing pipelines',
      description:
        'Bring in workflow run history so pipeline health can be calculated.',
      status: 'idle',
    },
  ]
}

function updateFirstSyncStep(
  steps: FirstSyncStep[],
  key: FirstSyncStep['key'],
  status: FirstSyncStepStatus
) {
  return steps.map((step) => (step.key === key ? { ...step, status } : step))
}

function getGithubStatusMessage(status: string) {
  switch (status) {
    case 'connected':
      return {
        type: 'success' as const,
        message: 'GitHub connected. Sync repositories to pull in data.',
      }
    case 'connected-first':
      return {
        type: 'success' as const,
        message: 'GitHub connected. Run the first sync to unlock your metrics.',
      }
    case 'missing':
      return {
        type: 'error' as const,
        message: 'GitHub did not return an installation ID.',
      }
    case 'missing-state':
      return {
        type: 'error' as const,
        message: 'GitHub connection expired before it could be completed.',
      }
    case 'forbidden':
      return {
        type: 'error' as const,
        message: 'That GitHub connection request is no longer valid.',
      }
    case 'verification-failed':
      return {
        type: 'error' as const,
        message: 'GitHub connected, but installation verification failed.',
      }
    default:
      return {
        type: 'error' as const,
        message: 'GitHub connection could not be completed.',
      }
  }
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
