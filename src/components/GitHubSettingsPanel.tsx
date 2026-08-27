'use client'

import { useState } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { GitHubPanel } from '@/components/GithubPanel'
import type { Workspace } from '@/components/dashboardTypes'

type GitHubSettingsPanelProps = {
  initialWorkspace: Workspace
}

export function GitHubSettingsPanel({
  initialWorkspace,
}: GitHubSettingsPanelProps) {
  const [workspace, setWorkspace] = useState(initialWorkspace)
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false)
  const [isGithubPending, setIsGithubPending] = useState(false)
  const [isDisconnectGithubPending, setIsDisconnectGithubPending] =
    useState(false)
  const [githubMessage, setGithubMessage] = useState<string | null>(null)
  const [githubError, setGithubError] = useState<string | null>(null)
  const [githubDisconnectUrl, setGithubDisconnectUrl] = useState<string | null>(
    null
  )

  const github = workspace.github
  const organization = workspace.organization
  const canManageIntegrations =
    organization?.role === 'owner' || organization?.role === 'admin'

  async function refreshWorkspace() {
    const response = await fetch('/api/me/workspace')
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      setGithubError(data?.error ?? 'Unable to refresh GitHub settings.')
      return
    }

    setWorkspace(data as Workspace)
  }

  async function handleConnectGithub() {
    setGithubError(null)
    setGithubMessage(null)
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

  async function handleDisconnectGithub() {
    setIsDisconnectDialogOpen(false)
    setGithubError(null)
    setGithubMessage(null)
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

      setGithubMessage('Disconnected GitHub.')
      setGithubDisconnectUrl(data?.uninstallUrl ?? null)
      await refreshWorkspace()
    } finally {
      setIsDisconnectGithubPending(false)
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
      <GitHubPanel
        connected={Boolean(github?.connected)}
        accountLogin={github?.accountLogin ?? null}
        installationId={github?.installationId ?? null}
        lastRepositorySyncedAt={github?.lastRepositorySyncedAt ?? null}
        repositorySyncStatus={github?.repositorySyncStatus ?? 'idle'}
        repositorySyncError={github?.repositorySyncError ?? null}
        canManageIntegrations={canManageIntegrations}
        isGithubPending={isGithubPending}
        isDisconnectGithubPending={isDisconnectGithubPending}
        githubSyncMessage={githubMessage}
        githubError={githubError}
        githubDisconnectUrl={githubDisconnectUrl}
        onConnectGithub={handleConnectGithub}
        onDisconnectGithub={() => setIsDisconnectDialogOpen(true)}
      />
    </>
  )
}
