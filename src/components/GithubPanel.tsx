import Image from 'next/image'

import cubes from '@/assets/images/github-cubes.webp'

import { FaGithubSquare } from 'react-icons/fa'

type GitHubPanelProps = {
  connected: boolean
  accountLogin: string | null
  installationId: string | null
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
  installationId,
  onConnectGithub,
}: GitHubPanelProps) {
  return (
    <section className='rounded-lg bg-white p-4'>
      <div className='flex items-center justify-between'>
        <h2 className='font-semibold flex items-center gap-2'>
          <FaGithubSquare className='text-5xl' />
          GitHub
        </h2>
        <span
          className={`${connected ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'} px-2.5 py-1 rounded-lg text-sm`}
        >
          {connected ? 'Connected' : 'Not connected'}
        </span>
      </div>
      {accountLogin && (
        <p className='text-slate-500 text-sm mt-2'>
          Connected as <span className='text-black'>{accountLogin}</span>
        </p>
      )}
      {installationId ? (
        <div className='flex text-sm text-slate-500 mt-3 items-center justify-between'>
          <dt className='text-slate-500'>Installation ID</dt>
          <dd className='mt-1 px-2.5 py-1 bg-slate-100 rounded-full text-xs text-slate-900'>
            {installationId}
          </dd>
        </div>
      ) : null}

      <dl className='my-5 grid gap-3 text-sm'>
        <div>
          <Image
            loading='eager'
            className='w-full h-[200px] object-cover rounded-lg'
            src={cubes}
            alt='github cubes'
            width={0}
            height={0}
          />
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
