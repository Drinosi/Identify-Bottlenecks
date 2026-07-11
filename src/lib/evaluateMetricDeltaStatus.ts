import type { MetricStatus } from '@/lib/evaluateMetricStatus'

export function evaluateMetricDeltaStatus({
  current,
  baseline,
  warningPercentIncrease,
  criticalPercentIncrease,
}: {
  current: number | null | undefined
  baseline: number | null | undefined
  warningPercentIncrease: number
  criticalPercentIncrease: number
}): MetricStatus {
  if (
    current === null ||
    current === undefined ||
    baseline === null ||
    baseline === undefined ||
    baseline <= 0
  ) {
    return 'unknown'
  }

  const percentIncrease = ((current - baseline) / baseline) * 100

  if (percentIncrease >= criticalPercentIncrease) {
    return 'critical'
  }

  if (percentIncrease >= warningPercentIncrease) {
    return 'warning'
  }

  return 'healthy'
}
