import Link from 'next/link'
import { FaGithubSquare } from 'react-icons/fa'
import { FaArrowsRotate } from 'react-icons/fa6'
import { HiChevronDown } from 'react-icons/hi'
import { EmptyState } from '@/components/EmptyState'
import { formatSyncTime } from '@/components/dashboardUtils'
import type { Repository } from '@/components/dashboardTypes'

type RepositoryTableProps = {
  repositories: Repository[]
  isGithubConnected: boolean
  canManageIntegrations: boolean
  isGithubSyncPending: boolean
  isPullRequestSyncPending: boolean
  isWorkflowRunSyncPending: boolean
  syncingPullRequestRepositoryId: string | null
  syncingWorkflowRunRepositoryId: string | null
  onSyncRepositories: () => void
  onSyncPullRequests: (repositoryId?: string) => void
  onSyncWorkflowRuns: (repositoryId?: string) => void
}

export function RepositoryTable({
  repositories,
  isGithubConnected,
  canManageIntegrations,
  isGithubSyncPending,
  isPullRequestSyncPending,
  isWorkflowRunSyncPending,
  syncingPullRequestRepositoryId,
  syncingWorkflowRunRepositoryId,
  onSyncRepositories,
  onSyncPullRequests,
  onSyncWorkflowRuns,
}: RepositoryTableProps) {
  return (
    <div className='min-w-0 rounded-lg bg-white p-4 sm:p-6'>
      <div className='mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
        <div className='grid min-w-0 grid-cols-[max-content_auto] grid-rows-[24px_24px] items-center gap-x-2'>
          <FaGithubSquare className='col-start-1 col-end-2 row-span-full text-5xl' />
          <h2 className='text-xl font-semibold'>Repositories</h2>

          <p className='col-start-2 text-sm text-slate-600'>
            All repositories accessible through your GitHub installation.
          </p>
        </div>
        {canManageIntegrations ? (
          <details className='group relative w-[170px]'>
            <summary className='flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg border border-black bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50'>
              <span className='inline-flex items-center gap-2'>
                <FaArrowsRotate />
                Sync data
              </span>
              <HiChevronDown className='text-lg transition group-open:rotate-180' />
            </summary>
            <div className='absolute right-0 z-10 mt-2 grid min-w-full gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg'>
              <button
                type='button'
                onClick={onSyncRepositories}
                disabled={isGithubSyncPending || !isGithubConnected}
                className='inline-flex cursor-pointer items-center justify-between gap-3 rounded-lg text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60'
              >
                <span>Repositories</span>
                <span className='text-xs text-slate-500'>
                  {isGithubSyncPending ? 'Syncing...' : 'Run'}
                </span>
              </button>
              <button
                type='button'
                onClick={() => onSyncPullRequests()}
                disabled={isPullRequestSyncPending || !repositories.length}
                className='inline-flex cursor-pointer items-center justify-between gap-3 rounded-lg text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60'
              >
                <span>All pull requests</span>
                <span className='text-xs text-slate-500'>
                  {isPullRequestSyncPending ? 'Syncing...' : 'Run'}
                </span>
              </button>
              <button
                type='button'
                onClick={() => onSyncWorkflowRuns()}
                disabled={isWorkflowRunSyncPending || !repositories.length}
                className='inline-flex cursor-pointer items-center justify-between gap-3 rounded-lg text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60'
              >
                <span>All pipelines</span>
                <span className='text-xs text-slate-500'>
                  {isWorkflowRunSyncPending ? 'Syncing...' : 'Run'}
                </span>
              </button>
            </div>
          </details>
        ) : null}
      </div>

      {repositories.length ? (
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
              {repositories.map((repository) => (
                <tr key={repository.id}>
                  <td className='px-4 py-3'>
                    <Link
                      href={`/app/repositories/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`}
                      className='font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900'
                    >
                      {repository.full_name}
                    </Link>
                    <p className='m-0 mt-1 text-xs'>
                      <a
                        href={`https://github.com/${repository.owner}/${repository.name}`}
                        target='_blank'
                        rel='noreferrer'
                        className='text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900 hover:decoration-slate-900'
                      >
                        Open on GitHub
                      </a>
                    </p>
                    <p className='m-0 text-xs text-slate-500'>
                      PRs{' '}
                      {formatSyncTime(repository.last_pull_request_synced_at)}
                    </p>
                    <p className='m-0 text-xs text-slate-500'>
                      Pipelines{' '}
                      {formatSyncTime(repository.last_workflow_run_synced_at)}
                    </p>
                    {repository.pull_request_sync_error ? (
                      <p className='m-0 mt-1 text-xs text-red-700'>
                        {repository.pull_request_sync_error}
                      </p>
                    ) : null}
                    {repository.workflow_run_sync_error ? (
                      <p className='m-0 mt-1 text-xs text-red-700'>
                        {repository.workflow_run_sync_error}
                      </p>
                    ) : null}
                  </td>
                  <td className='px-4 py-3 font-mono text-xs text-slate-700'>
                    {repository.default_branch}
                  </td>
                  <td className='px-4 py-3 text-slate-700'>
                    {repository.private ? 'Private' : 'Public'}
                  </td>
                  <td className='px-4 py-3'>
                    <details className='group relative w-[140px]'>
                      <summary className='flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg border border-black bg-white px-3 py-2 text-xs font-medium text-slate-900 transition hover:bg-slate-50'>
                        <span className='inline-flex items-center gap-2'>
                          <FaArrowsRotate />
                          Sync
                        </span>
                        <HiChevronDown className='text-base transition group-open:rotate-180' />
                      </summary>
                      <div className='absolute right-0 z-10 mt-2 grid min-w-full gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg'>
                        {repository.pull_request_sync_status === 'failed' ||
                        repository.workflow_run_sync_status === 'failed' ? (
                          <p className='m-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700'>
                            Last sync failed
                          </p>
                        ) : null}
                        <button
                          type='button'
                          onClick={() => onSyncPullRequests(repository.id)}
                          disabled={
                            syncingPullRequestRepositoryId === repository.id ||
                            repository.pull_request_sync_status === 'syncing'
                          }
                          className='inline-flex cursor-pointer items-center justify-between gap-3 rounded-lg text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60'
                        >
                          <span>Pull requests</span>
                          <span className='text-xs text-slate-500'>
                            {syncingPullRequestRepositoryId === repository.id ||
                            repository.pull_request_sync_status === 'syncing'
                              ? 'Syncing...'
                              : 'Run'}
                          </span>
                        </button>
                        <button
                          type='button'
                          onClick={() => onSyncWorkflowRuns(repository.id)}
                          disabled={
                            syncingWorkflowRunRepositoryId === repository.id ||
                            repository.workflow_run_sync_status === 'syncing'
                          }
                          className='inline-flex cursor-pointer items-center justify-between gap-3 rounded-lg text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60'
                        >
                          <span>Pipelines</span>
                          <span className='text-xs text-slate-500'>
                            {syncingWorkflowRunRepositoryId === repository.id ||
                            repository.workflow_run_sync_status === 'syncing'
                              ? 'Syncing...'
                              : 'Run'}
                          </span>
                        </button>
                      </div>
                    </details>
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
            isGithubConnected
              ? 'Sync repositories to start building bottleneck metrics.'
              : 'Connect GitHub to choose repositories for analysis.'
          }
        />
      )}
    </div>
  )
}
