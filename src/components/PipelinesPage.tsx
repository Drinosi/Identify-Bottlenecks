import Link from 'next/link'
import { formatDate } from '@/components/dashboardUtils'

type PipelinesPageProps = {
  user: {
    name: string
    email: string
  }
  items: PipelineItem[]
}

type PipelineItem = {
  repositoryId: string
  repositoryOwner: string
  repositoryName: string
  repositoryFullName: string
  workflowRunId: number
  name: string
  conclusion: string | null
  event: string
  headBranch: string
  htmlUrl: string | null
  startedAt: string
}

export function PipelinesPage({ user: _user, items }: PipelinesPageProps) {
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
            Pipeline Runs
          </h1>
          <p className='mt-2 text-slate-500'>
            Recent GitHub Actions runs, grouped by repository and sorted from
            newest to oldest.
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
                    <h2 className='m-0 text-xl font-semibold text-slate-950'>
                      {group.repositoryFullName}
                    </h2>
                    <p className='mt-1 text-sm text-slate-500'>
                      {group.items.length} synced{' '}
                      {group.items.length === 1 ? 'pipeline run' : 'pipeline runs'}
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
                  <table className='w-full min-w-[760px] border-collapse text-left text-sm'>
                    <thead className='bg-slate-50 text-slate-500'>
                      <tr>
                        <th className='px-4 py-3 font-medium'>Run</th>
                        <th className='px-4 py-3 font-medium'>Conclusion</th>
                        <th className='px-4 py-3 font-medium'>Event</th>
                        <th className='px-4 py-3 font-medium'>Branch</th>
                        <th className='px-4 py-3 font-medium'>Started</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-200'>
                      {group.items.map((item) => (
                        <tr key={`${item.repositoryId}-${item.workflowRunId}`}>
                          <td className='px-4 py-3'>
                            {item.htmlUrl ? (
                              <a
                                href={item.htmlUrl}
                                target='_blank'
                                rel='noreferrer'
                                className='font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900'
                              >
                                {item.name}
                              </a>
                            ) : (
                              <p className='m-0 font-medium text-slate-900'>
                                {item.name}
                              </p>
                            )}
                          </td>
                          <td className='px-4 py-3'>
                            <span
                              className={getWorkflowConclusionClassName(
                                item.conclusion
                              )}
                            >
                              {item.conclusion ?? 'Unknown'}
                            </span>
                          </td>
                          <td className='px-4 py-3 text-slate-700'>
                            {item.event}
                          </td>
                          <td className='px-4 py-3 text-slate-700'>
                            <span className='rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700'>
                              {item.headBranch}
                            </span>
                          </td>
                          <td className='px-4 py-3 text-slate-700'>
                            {formatDate(item.startedAt)}
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
              No pipeline runs have been synced
            </h2>
            <p className='mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600'>
              Sync workflow runs from the workspace to populate pipeline
              history here.
            </p>
          </section>
        )}
      </div>
    </main>
  )
}

function groupByRepository(items: PipelineItem[]) {
  const groups = new Map<
    string,
    {
      repositoryId: string
      repositoryOwner: string
      repositoryName: string
      repositoryFullName: string
      items: PipelineItem[]
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

function getWorkflowConclusionClassName(conclusion: string | null) {
  if (conclusion === 'success') {
    return 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700'
  }

  if (
    conclusion === 'failure' ||
    conclusion === 'cancelled' ||
    conclusion === 'timed_out'
  ) {
    return 'rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700'
  }

  return 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600'
}
