import { FaClock } from 'react-icons/fa6'
import { FiActivity } from 'react-icons/fi'
import { RiGitRepositoryFill } from 'react-icons/ri'
import { MetricCard } from '@/components/MetricCard'
import { formatReviewTime } from '@/components/dashboardUtils'
import type { Workspace } from '@/components/dashboardTypes'

type DashboardMetricsProps = {
  github: Workspace['github'] | undefined
}

export function DashboardMetrics({ github }: DashboardMetricsProps) {
  return (
    <section className='grid gap-4 md:grid-cols-3'>
      <MetricCard
        label='Repositories'
        value={github?.repositories.length ?? 0}
        detail='Synced from GitHub'
        icon={<RiGitRepositoryFill className='text-3xl' />}
      />
      <MetricCard
        label='PR Review Time'
        value={formatReviewTime(github?.pullRequests.averageHoursToFirstReview)}
        detail='First review and cycle-time metrics'
        icon={<FaClock className='text-2xl' />}
      />
      <MetricCard
        label='Waiting Review'
        value={github?.pullRequests.waitingForReview ?? 0}
        detail={`${github?.pullRequests.total ?? 0} pull requests synced`}
        icon={<FiActivity className='text-3xl' />}
      />
    </section>
  )
}
