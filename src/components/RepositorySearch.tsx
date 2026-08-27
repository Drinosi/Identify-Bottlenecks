'use client'

import { useMemo, useState } from 'react'
import { Repository } from './dashboardTypes'
import Link from 'next/link'
import { formatSyncTime } from '@/components/dashboardUtils'
import { HiChevronDown } from 'react-icons/hi'
import { TiArrowSortedDown } from 'react-icons/ti'

import { FaArrowsRotate } from 'react-icons/fa6'

import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from 'next/navigation'

export default function RepositorySearch({
  repositories,
  syncingPullRequestRepositoryId,
  syncingWorkflowRunRepositoryId,
  onSyncPullRequests,
  onSyncWorkflowRuns,
}: {
  repositories: Repository[]
  syncingPullRequestRepositoryId: string | null
  syncingWorkflowRunRepositoryId: string | null
  onSyncPullRequests: (repositoryId: string) => void
  onSyncWorkflowRuns: (repositoryId: string) => void
}) {
  const [query, setQuery] = useState('')

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const sortBy = searchParams.get('sortBy')

  const [sortByToggle, setSortByToggle] = useState(false)

  const repositoriesToShow = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const nextRepositories = repositories.filter((repository) =>
      repository.full_name.toLowerCase().includes(normalizedQuery)
    )

    switch (sortBy) {
      case 'name-desc':
        return nextRepositories.sort((a, b) =>
          b.full_name.localeCompare(a.full_name)
        )
      case 'least-recently-synced':
        return nextRepositories.sort((a, b) => {
          const aSyncTime = new Date(
            a.last_workflow_run_synced_at || 0
          ).getTime()
          const bSyncTime = new Date(
            b.last_workflow_run_synced_at || 0
          ).getTime()

          return aSyncTime - bSyncTime
        })
      case 'most-recently-synced':
        return nextRepositories.sort((a, b) => {
          const aSyncTime = new Date(
            a.last_workflow_run_synced_at || 0
          ).getTime()
          const bSyncTime = new Date(
            b.last_workflow_run_synced_at || 0
          ).getTime()

          return bSyncTime - aSyncTime
        })
      case 'name-asc':
      default:
        return nextRepositories.sort((a, b) =>
          a.full_name.localeCompare(b.full_name)
        )
    }
  }, [query, repositories, sortBy])

  function handleSearch(query: string) {
    setQuery(query)
  }

  function handleSort(sortBy: string) {
    setSortByToggle(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('sortBy')

    params.set('sortBy', sortBy)

    const queryString = params.toString()

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    })
  }

  return (
    <div>
      <div className='relative mb-4 grid grid-cols-[1fr_auto] items-center'>
        <input
          type='text'
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder='Search repositories...'
          className='w-full rounded-lg border border-slate-300 bg-white p-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-300'
        />
        <div>
          <button
            className='ml-2  group flex gap-2 cursor-pointer items-center border border-slate-200 h-full justify-center rounded-lg text-sm bg-slate-200 p-3 text-slate-700 hover:bg-slate-300'
            onClick={() => setSortByToggle((prev) => !prev)}
          >
            Sort By
            <TiArrowSortedDown />
          </button>
          <div
            className={`${sortByToggle ? 'grid' : 'hidden'} absolute right-0 z-10 mt-2 min-w-[150px] gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg`}
          >
            <ul>
              <li
                className='p-2 hover:bg-slate-100 rounded cursor-pointer'
                onClick={() => handleSort('name-asc')}
              >
                <button>Name: A–Z</button>{' '}
              </li>
              <li
                className='p-2 hover:bg-slate-100 rounded cursor-pointer'
                onClick={() => handleSort('name-desc')}
              >
                <button>Name: Z–A</button>
              </li>
              <li
                className='p-2 hover:bg-slate-100 rounded cursor-pointer'
                onClick={() => handleSort('least-recently-synced')}
              >
                <button>Least recently synced</button>
              </li>
              <li
                className='p-2 hover:bg-slate-100 rounded cursor-pointer'
                onClick={() => handleSort('most-recently-synced')}
              >
                <button>Most recently synced</button>
              </li>
            </ul>
          </div>
        </div>
      </div>
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
            {repositoriesToShow.map((repository) => (
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
                    PRs {formatSyncTime(repository.last_pull_request_synced_at)}
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
                  <span className='rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700'>
                    {repository.default_branch}
                  </span>
                </td>
                <td className='px-4 py-3 text-slate-700'>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      repository.private
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {repository.private ? 'Private' : 'Public'}
                  </span>
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
    </div>
  )
}
