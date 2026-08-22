import { FaGithubSquare } from 'react-icons/fa'
import { FaArrowsRotate } from 'react-icons/fa6'
import { HiChevronDown } from 'react-icons/hi'
import { EmptyState } from '@/components/EmptyState'
import type { Repository } from '@/components/dashboardTypes'
import RepositorySearch from '@/components/RepositorySearch'

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
  onSyncAll?: () => void
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
  onSyncAll,
}: RepositoryTableProps) {
  return (
    <div className='min-w-0 rounded-lg bg-white p-4 sm:p-6'>
      <div className='mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
        <div className='grid min-w-0 grid-cols-[max-content_auto] grid-rows-[35px_35px] xl:grid-rows-[24px_24px] items-center gap-x-2'>
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
                onClick={onSyncAll}
                disabled={isGithubSyncPending || !isGithubConnected}
                className='inline-flex cursor-pointer items-center justify-between gap-3 rounded-lg text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60'
              >
                <span>Sync All</span>
                <span className='text-xs text-slate-500'>
                  {isGithubSyncPending ? 'Syncing...' : 'Run'}
                </span>
              </button>
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
        <>
          <RepositorySearch
            onSyncPullRequests={onSyncPullRequests}
            onSyncWorkflowRuns={onSyncWorkflowRuns}
            syncingPullRequestRepositoryId={syncingPullRequestRepositoryId}
            syncingWorkflowRunRepositoryId={syncingWorkflowRunRepositoryId}
            repositories={repositories}
          />
        </>
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
