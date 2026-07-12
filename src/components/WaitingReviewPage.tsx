import Link from 'next/link'
import { formatDate, formatReviewTime } from '@/components/dashboardUtils'

type WaitingReviewPageProps = {
  user: {
    name: string
    email: string
  }
  items: WaitingReviewItem[]
}

type WaitingReviewItem = {
  repositoryId: string
  repositoryOwner: string
  repositoryName: string
  repositoryFullName: string
  number: number
  title: string
  authorLogin: string | null
  draft: boolean
  openedAt: string
  waitingHours: number
}

export function WaitingReviewPage({ items }: WaitingReviewPageProps) {
  const groupedItems = groupByRepository(items)

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
          <h1 className='mt-3 max-w-full break-words text-3xl font-semibold tracking-tight'>
            Pull Requests Waiting For Review
          </h1>
          <p className='mt-2 text-slate-500'>
            Open pull requests without a first review, grouped by repository and
            sorted from oldest to newest.
          </p>
        </header>

        {items.length ? (
          <section className='grid gap-4'>
            {groupedItems.map((group) => (
              <section
                key={group.repositoryId}
                className='rounded-2xl bg-white p-5 shadow-sm'
              >
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <h2 className='m-0 text-xl font-semibold text-slate-950'>
                        {group.repositoryFullName}
                      </h2>
                      <span className='rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700'>
                        Open
                      </span>
                    </div>
                    <p className='mt-1 text-sm text-slate-500'>
                      {group.items.length} open{' '}
                      {group.items.length === 1
                        ? 'pull request'
                        : 'pull requests'}{' '}
                      waiting for review
                    </p>
                  </div>
                  <Link
                    href={`/app/repositories/${encodeURIComponent(group.repositoryOwner)}/${encodeURIComponent(group.repositoryName)}`}
                    className='text-sm font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900'
                  >
                    Open repository
                  </Link>
                </div>

                <div className='mt-4 overflow-x-auto rounded-xl border border-slate-200'>
                  <table className='w-full min-w-[720px] border-collapse text-left text-sm'>
                    <thead className='bg-slate-50 text-slate-500'>
                      <tr>
                        <th className='px-4 py-3 font-medium'>PR</th>
                        <th className='px-4 py-3 font-medium'>Author</th>
                        <th className='px-4 py-3 font-medium'>Opened</th>
                        <th className='px-4 py-3 font-medium'>Waiting</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-200'>
                      {group.items.map((item) => (
                        <tr key={`${item.repositoryId}-${item.number}`}>
                          <td className='px-4 py-3'>
                            <a
                              href={`https://github.com/${item.repositoryFullName}/pull/${item.number}`}
                              target='_blank'
                              rel='noreferrer'
                              className='font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900'
                            >
                              #{item.number} {item.title}
                            </a>
                            <div className='mt-2 flex flex-wrap gap-2'>
                              <span className='rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700'>
                                Open
                              </span>
                              {item.draft ? (
                                <span className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600'>
                                  Draft
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className='px-4 py-3 text-slate-700'>
                            {item.authorLogin ?? 'Unknown'}
                          </td>
                          <td className='px-4 py-3 text-slate-700'>
                            {formatDate(item.openedAt)}
                          </td>
                          <td className='px-4 py-3 font-medium text-slate-900'>
                            {formatReviewTime(item.waitingHours)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </section>
        ) : (
          <section className='rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center'>
            <h2 className='m-0 text-xl font-semibold text-slate-950'>
              No pull requests are waiting for review
            </h2>
            <p className='mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600'>
              Everything currently synced has either been reviewed already or is
              no longer open.
            </p>
          </section>
        )}
      </div>
    </main>
  )
}

function groupByRepository(items: WaitingReviewItem[]) {
  const groups = new Map<
    string,
    {
      repositoryId: string
      repositoryOwner: string
      repositoryName: string
      repositoryFullName: string
      items: WaitingReviewItem[]
    }
  >()

  for (const item of items) {
    const existing = groups.get(item.repositoryId)

    if (existing) {
      existing.items.push(item)
      continue
    }

    groups.set(item.repositoryId, {
      repositoryId: item.repositoryId,
      repositoryOwner: item.repositoryOwner,
      repositoryName: item.repositoryName,
      repositoryFullName: item.repositoryFullName,
      items: [item],
    })
  }

  return Array.from(groups.values())
}
