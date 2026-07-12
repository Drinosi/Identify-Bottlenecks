import { FaClock } from 'react-icons/fa6'
import { FiActivity } from 'react-icons/fi'
import { RiGitRepositoryFill } from 'react-icons/ri'
import { MetricCard } from '@/components/MetricCard'
import { formatReviewTime } from '@/components/dashboardUtils'
import { formatPercentDelta } from '@/components/dashboardUtils'
import { evaluateMetricStatus } from '@/lib/evaluateMetricStatus'
import { evaluateMetricDeltaStatus } from '@/lib/evaluateMetricDeltaStatus'
import { defaultMetricThresholds } from '@/lib/defaultMetricThresholds'
import type { Workspace } from '@/components/dashboardTypes'

type DashboardMetricsProps = {
  github: Workspace['github'] | undefined
}

export function DashboardMetrics({ github }: DashboardMetricsProps) {
  const firstReviewStatus = evaluateMetricStatus({
    value: github?.pullRequests.averageHoursToFirstReview,
    warning: defaultMetricThresholds.pullRequest.firstReview.warningHours,
    critical: defaultMetricThresholds.pullRequest.firstReview.criticalHours,
  })
  const waitingReviewStatus = evaluateMetricStatus({
    value:
      (github?.pullRequests.waitingForReview ?? 0) > 0
        ? github?.pullRequests.oldestWaitingReviewHours
        : 0,
    warning: defaultMetricThresholds.pullRequest.openWithoutReview.warningHours,
    critical:
      defaultMetricThresholds.pullRequest.openWithoutReview.criticalHours,
  })
  const reviewedButUnmergedStatus = evaluateMetricStatus({
    value:
      (github?.pullRequests.reviewedButUnmerged ?? 0) > 0
        ? github?.pullRequests.oldestReviewedButUnmergedHours
        : 0,
    warning:
      defaultMetricThresholds.pullRequest.reviewedButUnmerged.warningHours,
    critical:
      defaultMetricThresholds.pullRequest.reviewedButUnmerged.criticalHours,
  })
  const mergeTimeStatus = evaluateMetricStatus({
    value: github?.pullRequests.averageHoursToMerge,
    warning: defaultMetricThresholds.pullRequest.mergeTime.warningHours,
    critical: defaultMetricThresholds.pullRequest.mergeTime.criticalHours,
  })
  const mergeToPipelineStatus = evaluateMetricDeltaStatus({
    current: github?.pipeline.medianHoursMergeToPipeline,
    baseline: github?.pipeline.baselineMedianHoursMergeToPipeline,
    warningPercentIncrease:
      defaultMetricThresholds.delivery.mergeToPipelineIncrease.warningPercent,
    criticalPercentIncrease:
      defaultMetricThresholds.delivery.mergeToPipelineIncrease.criticalPercent,
  })

  return (
    <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
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
        status={firstReviewStatus}
      />
      <MetricCard
        label='Merge Time'
        value={formatReviewTime(github?.pullRequests.averageHoursToMerge)}
        detail='Average time from open to merge'
        icon={<FaClock className='text-2xl' />}
        status={mergeTimeStatus}
      />
      <MetricCard
        label='Successful Pipelines'
        value={github?.pipeline.successfulRunsLast30Days ?? 0}
        detail={
          github?.pipeline.successRateLast30Days === null
            ? 'No pipeline data in the last 30 days'
            : `${github?.pipeline.successRateLast30Days.toFixed(1)}% success rate in the last 30 days`
        }
        icon={<FiActivity className='text-3xl' />}
        href='/app/pipelines'
      />
      <MetricCard
        label='Waiting Review'
        value={github?.pullRequests.waitingForReview ?? 0}
        detail={
          (github?.pullRequests.waitingForReview ?? 0) > 0
            ? `Oldest waiting ${formatReviewTime(github?.pullRequests.oldestWaitingReviewHours)} in ${github?.pullRequests.oldestWaitingReviewRepositoryFullName ?? 'an unknown repository'}`
            : `${github?.pullRequests.total ?? 0} pull requests synced`
        }
        icon={<FiActivity className='text-3xl' />}
        status={waitingReviewStatus}
        href='/app/pull-requests/waiting-review'
      />
      <MetricCard
        label='Ready to be merged'
        value={github?.pullRequests.reviewedButUnmerged ?? 0}
        detail={
          (github?.pullRequests.reviewedButUnmerged ?? 0) > 0
            ? `Oldest reviewed ${formatReviewTime(github?.pullRequests.oldestReviewedButUnmergedHours)} in ${github?.pullRequests.oldestReviewedButUnmergedRepositoryFullName ?? 'an unknown repository'}`
            : `${github?.pullRequests.total ?? 0} pull requests synced`
        }
        icon={<FiActivity className='text-3xl' />}
        status={reviewedButUnmergedStatus}
      />
      <MetricCard
        label='Merge to Pipeline'
        value={formatReviewTime(github?.pipeline.medianHoursMergeToPipeline)}
        detail={
          github?.pipeline.baselineMedianHoursMergeToPipeline === null
            ? 'Need more daily baseline data'
            : `${formatPercentDelta(github?.pipeline.medianHoursMergeToPipelinePercentChange)} vs 14-day baseline`
        }
        icon={<FaClock className='text-2xl' />}
        status={mergeToPipelineStatus}
      />
    </section>
  )
}
