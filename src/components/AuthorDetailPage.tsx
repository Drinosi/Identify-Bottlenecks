import Image from 'next/image'
import Link from 'next/link'
import { MetricCard } from '@/components/MetricCard'
import { formatDate, formatReviewTime } from '@/components/dashboardUtils'

type AuthorDetailPageProps = {
  identity: AuthorIdentity
  metrics: AuthorMetrics
  repositories: AuthorRepository[]
  activity: AuthorActivity[]
  pullRequests: AuthorPullRequest[]
}

type AuthorIdentity = {
  id: string
  provider: string
  external_id: string
  login: string
  display_name: string | null
  avatar_url: string | null
  profile_url: string | null
  email: string | null
  updated_at: string
  organization_name: string
}

type AuthorMetrics = {
  totalPullRequests: number
  openPullRequests: number
  mergedPullRequests: number
  waitingForReview: number
  averageHoursToFirstReview: number | null
  averageHoursToMerge: number | null
}

type AuthorRepository = {
  owner: string
  name: string
  full_name: string
  pull_request_count: number
  merged_count: number
  last_opened_at: string
}

type AuthorActivity = {
  week: string
  opened_count: number
  merged_count: number
}

type AuthorPullRequest = {
  repository_owner: string
  repository_name: string
  repository_full_name: string
  number: number
  title: string
  state: string
  draft: boolean
  opened_at: string
  merged_at: string | null
  first_reviewed_at: string | null
  review_count: number
}

export function AuthorDetailPage({
  identity,
  metrics,
  repositories,
  activity,
  pullRequests,
}: AuthorDetailPageProps) {
  return (
    <main className='overflow-x-hidden px-4 py-6 text-slate-900 sm:px-6 sm:py-8'>
      <div className='mx-auto grid max-w-6xl min-w-0 gap-6'>
        <header className='min-w-0'>
          <Link
            href='/app'
            className='text-sm font-medium text-slate-500 underline'
          >
            Back to workspace
          </Link>
          <div className='mt-4 flex flex-col gap-4 sm:flex-row sm:items-center'>
            {identity.avatar_url ? (
              <Image
                src={identity.avatar_url}
                alt=''
                width={64}
                height={64}
                unoptimized
                className='size-16 rounded-lg border border-slate-200'
              />
            ) : (
              <span className='grid size-16 place-items-center rounded-lg border border-slate-200 bg-slate-100 text-xl font-semibold uppercase text-slate-500'>
                {identity.login.slice(0, 1)}
              </span>
            )}
            <div className='min-w-0'>
              <h1 className='m-0 max-w-full break-words text-3xl font-semibold'>
                {identity.display_name ?? identity.login}
              </h1>
              <div className='mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500'>
                <span>@{identity.login}</span>
                <span className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700'>
                  {identity.provider}
                </span>
                {identity.profile_url ? (
                  <a
                    href={identity.profile_url}
                    target='_blank'
                    rel='noreferrer'
                    className='font-medium text-brand-700 underline decoration-brand-200 underline-offset-4 hover:decoration-brand-600'
                  >
                    Open profile
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <MetricCard
            label='Authored PRs'
            value={metrics.totalPullRequests}
            detail={`${metrics.mergedPullRequests} merged`}
          />
          <MetricCard
            label='Open PRs'
            value={metrics.openPullRequests}
            detail={`${metrics.waitingForReview} waiting for review`}
            status={metrics.waitingForReview > 0 ? 'warning' : 'healthy'}
          />
          <MetricCard
            label='First Review'
            value={formatReviewTime(metrics.averageHoursToFirstReview)}
            detail='Average time to first review'
          />
          <MetricCard
            label='Merge Time'
            value={formatReviewTime(metrics.averageHoursToMerge)}
            detail='Average time from open to merge'
          />
        </section>

        <section className='grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]'>
          <section className='rounded-lg bg-white p-5 shadow-sm'>
            <div className='mb-5'>
              <h2 className='m-0 text-xl font-semibold'>Commit graph</h2>
              <p className='mt-1 text-sm text-slate-600'>
                PR activity by week. Commit-level sync can use this same author
                identity later.
              </p>
            </div>
            <ActivityGraph activity={activity} />
          </section>

          <section className='rounded-lg bg-white p-5 shadow-sm'>
            <h2 className='m-0 text-xl font-semibold'>Repositories</h2>
            <div className='mt-4 grid gap-3'>
              {repositories.length ? (
                repositories.map((repository) => (
                  <Link
                    key={repository.full_name}
                    href={`/app/repositories/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`}
                    className='rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-brand-200 hover:bg-brand-50'
                  >
                    <div className='flex items-center justify-between gap-3'>
                      <p className='m-0 truncate text-sm font-medium text-slate-900'>
                        {repository.full_name}
                      </p>
                      <span className='shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700'>
                        {repository.pull_request_count} PRs
                      </span>
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>
                      {repository.merged_count} merged · latest{' '}
                      {formatDate(repository.last_opened_at)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className='m-0 text-sm text-slate-500'>
                  No repositories found for this author yet.
                </p>
              )}
            </div>
          </section>
        </section>

        <section className='rounded-lg bg-white p-4 shadow-sm sm:p-6'>
          <div className='mb-5'>
            <h2 className='m-0 text-xl font-semibold'>
              Authored pull requests
            </h2>
            <p className='mt-1 text-sm text-slate-600'>
              Latest synced pull requests by this author.
            </p>
          </div>

          {pullRequests.length ? (
            <div className='overflow-x-auto rounded-lg border border-slate-200'>
              <table className='w-full min-w-[820px] border-collapse text-left text-sm'>
                <thead className='bg-slate-50 text-slate-500'>
                  <tr>
                    <th className='px-4 py-3 font-medium'>PR</th>
                    <th className='px-4 py-3 font-medium'>Repository</th>
                    <th className='px-4 py-3 font-medium'>State</th>
                    <th className='px-4 py-3 font-medium'>Opened</th>
                    <th className='px-4 py-3 font-medium'>First review</th>
                    <th className='px-4 py-3 font-medium'>Reviews</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-200'>
                  {pullRequests.map((pullRequest) => (
                    <tr
                      key={`${pullRequest.repository_full_name}-${pullRequest.number}`}
                    >
                      <td className='px-4 py-3'>
                        <a
                          href={`https://github.com/${pullRequest.repository_full_name}/pull/${pullRequest.number}`}
                          target='_blank'
                          rel='noreferrer'
                          className='font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900'
                        >
                          #{pullRequest.number} {pullRequest.title}
                        </a>
                      </td>
                      <td className='px-4 py-3'>
                        <Link
                          href={`/app/repositories/${encodeURIComponent(pullRequest.repository_owner)}/${encodeURIComponent(pullRequest.repository_name)}`}
                          className='text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900'
                        >
                          {pullRequest.repository_full_name}
                        </Link>
                      </td>
                      <td className='px-4 py-3'>
                        <span
                          className={getPullRequestStateClassName(pullRequest)}
                        >
                          {getPullRequestStateLabel(pullRequest)}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-slate-700'>
                        {formatDate(pullRequest.opened_at)}
                      </td>
                      <td className='px-4 py-3 text-slate-700'>
                        {pullRequest.first_reviewed_at
                          ? formatDate(pullRequest.first_reviewed_at)
                          : pullRequest.state === 'closed'
                            ? 'Never reviewed'
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
            <div className='rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center'>
              <h3 className='m-0 text-base font-semibold text-slate-900'>
                No authored pull requests yet
              </h3>
              <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600'>
                Re-sync pull requests after author identity sync is enabled.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function ActivityGraph({ activity }: { activity: AuthorActivity[] }) {
  const weeks = buildRecentWeeks(activity)
  const maxCount = Math.max(...weeks.map((week) => week.openedCount), 1)

  return (
    <div className='grid gap-4'>
      <div className='flex h-52 items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        {weeks.map((week) => {
          const height = Math.max((week.openedCount / maxCount) * 100, 4)

          return (
            <div
              key={week.label}
              className='flex min-w-0 flex-1 flex-col items-center gap-2'
            >
              <div className='flex h-36 w-full items-end'>
                <div
                  className='w-full rounded-t bg-brand-500'
                  style={{ height: `${height}%` }}
                  title={`${week.openedCount} opened, ${week.mergedCount} merged`}
                />
              </div>
              <span className='truncate text-[10px] text-slate-500'>
                {week.label}
              </span>
            </div>
          )
        })}
      </div>
      <div className='flex flex-wrap gap-3 text-xs text-slate-500'>
        <span className='inline-flex items-center gap-1.5'>
          <span className='size-2 rounded-full bg-brand-500' />
          Opened PRs
        </span>
        <span>Merged counts are included in each bar tooltip.</span>
      </div>
    </div>
  )
}

function buildRecentWeeks(activity: AuthorActivity[]) {
  const activityByWeek = new Map(
    activity.map((item) => [
      new Date(item.week).toISOString().slice(0, 10),
      item,
    ])
  )
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - start.getDay() - 11 * 7)

  return Array.from({ length: 12 }, (_, index) => {
    const weekDate = new Date(start)
    weekDate.setDate(start.getDate() + index * 7)
    const key = weekDate.toISOString().slice(0, 10)
    const item = activityByWeek.get(key)

    return {
      label: `${weekDate.getMonth() + 1}/${weekDate.getDate()}`,
      openedCount: item?.opened_count ?? 0,
      mergedCount: item?.merged_count ?? 0,
    }
  })
}

function getPullRequestStateLabel(pullRequest: AuthorPullRequest) {
  if (pullRequest.merged_at) {
    return 'Merged'
  }

  if (pullRequest.draft) {
    return 'Draft'
  }

  return pullRequest.state === 'open' ? 'Open' : 'Closed'
}

function getPullRequestStateClassName(pullRequest: AuthorPullRequest) {
  if (pullRequest.merged_at) {
    return 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700'
  }

  if (pullRequest.draft) {
    return 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600'
  }

  if (pullRequest.state === 'open') {
    return 'rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700'
  }

  return 'rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700'
}
