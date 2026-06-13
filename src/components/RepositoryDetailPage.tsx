import Link from 'next/link'
import { MetricCard } from '@/components/MetricCard'
import { SignOutButton } from '@/components/SignOutButton'

type RepositoryDetailPageProps = {
  user: {
    name: string
    email: string
  }
  detail: RepositoryDetail
}

type RepositoryDetail = {
  repository: {
    owner: string
    name: string
    full_name: string
    default_branch: string
    private: boolean
    last_pull_request_synced_at: string | null
    updated_at: string
    account_login: string
    organization_name: string
    role: string
  }
  metrics: {
    totalPullRequests: number
    openPullRequests: number
    waitingForReview: number
    averageHoursToFirstReview: number | null
    averageHoursToMerge: number | null
  }
  pullRequests: PullRequest[]
}

type PullRequest = {
  number: number
  title: string
  state: string
  author_login: string | null
  draft: boolean
  opened_at: string
  closed_at: string | null
  merged_at: string | null
  first_reviewed_at: string | null
  review_count: number
  updated_at: string
}

export function RepositoryDetailPage({
  user,
  detail,
}: RepositoryDetailPageProps) {
  const repository = detail.repository

  return (
    <main className='min-h-screen overflow-x-hidden bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-8'>
      <div className='mx-auto grid max-w-6xl min-w-0 gap-6'>
        <header className='flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-start'>
          <div className='min-w-0'>
            <Link
              href='/app'
              className='text-sm font-medium text-slate-500 underline'
            >
              Back to workspace
            </Link>
            <h1 className='mt-3 max-w-full break-words text-3xl font-semibold tracking-tight'>
              {repository.full_name}
            </h1>
            <p className='mt-2 text-slate-500'>
              {repository.organization_name} - {repository.default_branch} -{' '}
              {repository.private ? 'Private' : 'Public'}
            </p>
            <p className='mt-2 text-sm text-slate-500'>
              PRs {formatSyncTime(repository.last_pull_request_synced_at)}
            </p>
          </div>
          <div className='flex min-w-0 items-center gap-3 sm:shrink-0'>
            <div className='min-w-0 text-left text-sm text-slate-600 sm:text-right'>
              <p className='m-0 font-medium text-slate-900'>{user.name}</p>
              <p className='m-0 break-all'>{user.email}</p>
            </div>
            <SignOutButton />
          </div>
        </header>

        <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <MetricCard
            label='Average First Review'
            value={formatReviewTime(detail.metrics.averageHoursToFirstReview)}
            detail='Across synced pull requests'
          />
          <MetricCard
            label='Merge Time'
            value={formatReviewTime(detail.metrics.averageHoursToMerge)}
            detail='Average time from open to merge'
          />
          <MetricCard
            label='Waiting Review'
            value={detail.metrics.waitingForReview}
            detail='Open PRs without a review'
          />
          <MetricCard
            label='Open PRs'
            value={detail.metrics.openPullRequests}
            detail={`${detail.metrics.totalPullRequests} total synced`}
          />
        </section>

        <section className='min-w-0 rounded-lg bg-white p-4 sm:p-6'>
          <div className='mb-5'>
            <h2 className='m-0 text-xl font-semibold'>Pull Requests</h2>
            <p className='mt-1 text-sm text-slate-600'>
              Latest synced pull requests for this repository.
            </p>
          </div>

          {detail.pullRequests.length ? (
            <div className='overflow-x-auto rounded-lg border border-slate-200'>
              <table className='w-full min-w-[760px] border-collapse text-left text-sm'>
                <thead className='bg-slate-50 text-slate-500'>
                  <tr>
                    <th className='px-4 py-3 font-medium'>PR</th>
                    <th className='px-4 py-3 font-medium'>State</th>
                    <th className='px-4 py-3 font-medium'>Author</th>
                    <th className='px-4 py-3 font-medium'>Opened</th>
                    <th className='px-4 py-3 font-medium'>First review</th>
                    <th className='px-4 py-3 font-medium'>Reviews</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-200'>
                  {detail.pullRequests.map((pullRequest) => (
                    <tr key={pullRequest.number}>
                      <td className='px-4 py-3'>
                        <p className='m-0 font-medium text-slate-900'>
                          #{pullRequest.number} {pullRequest.title}
                        </p>
                      </td>
                      <td className='px-4 py-3 text-slate-700'>
                        {pullRequest.state}
                      </td>
                      <td className='px-4 py-3 text-slate-700'>
                        {pullRequest.author_login ?? 'Unknown'}
                      </td>
                      <td className='px-4 py-3 text-slate-700'>
                        {formatDate(pullRequest.opened_at)}
                      </td>
                      <td className='px-4 py-3 text-slate-700'>
                        {pullRequest.first_reviewed_at
                          ? formatDate(pullRequest.first_reviewed_at)
                          : 'Waiting'}
                      </td>
                      <td className='px-4 py-3 text-slate-700'>
                        {pullRequest.review_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title='No pull requests synced'
              body='Sync PRs from the workspace to populate repository metrics.'
            />
          )}
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

function formatSyncTime(value: string | null | undefined) {
  if (!value) {
    return 'Never synced'
  }

  return `Last synced ${formatDate(value)}`
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
