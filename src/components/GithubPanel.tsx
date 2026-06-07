type GitHubPanelProps = {
  connected: boolean
  accountLogin: string | null
  canManageIntegrations: boolean
  isGithubPending: boolean
  githubSyncMessage: string | null
  githubError: string | null
  onConnectGithub: () => void
}

export function GitHubPanel({
  connected,
  accountLogin,
  canManageIntegrations,
  isGithubPending,
  githubSyncMessage,
  githubError,
  onConnectGithub,
}: GitHubPanelProps) {
  return (
    <section className='rounded-lg bg-white p-6'>
      <h2 className='m-0 text-xl font-semibold'>GitHub</h2>
      <p className='mt-2 text-sm leading-6 text-slate-600'>
        Connect the GitHub organization that owns the repositories you want to
        analyze.
      </p>
      <dl className='my-5 grid gap-3 text-sm'>
        <div>
          <dt className='text-slate-500'>Status</dt>
          <dd className='mt-1 font-medium'>
            {connected ? 'Connected' : 'Not connected'}
          </dd>
        </div>
        <div>
          <dt className='text-slate-500'>Account</dt>
          <dd className='mt-1 font-medium'>
            {accountLogin === 'pending-sync'
              ? 'Sync repositories to identify account'
              : (accountLogin ?? 'Not connected')}
          </dd>
        </div>
      </dl>
      {canManageIntegrations ? (
        <div className='grid gap-3'>
          <button
            type='button'
            onClick={onConnectGithub}
            disabled={isGithubPending}
            className='inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-70'
          >
            {isGithubPending
              ? 'Connecting...'
              : connected
                ? 'Reconnect GitHub'
                : 'Connect GitHub'}
          </button>
          {githubSyncMessage ? (
            <p className='m-0 text-sm text-emerald-700'>{githubSyncMessage}</p>
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
  )
}
