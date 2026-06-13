export type MetricStatus = 'healthy' | 'warning' | 'critical' | 'unknown'

export function evaluateMetricStatus({
  value,
  warning,
  critical,
}: {
  value: number | null | undefined
  warning: number
  critical: number
}): MetricStatus {
  if (value === null || value === undefined) {
    return 'unknown'
  }

  if (value >= critical) {
    return 'critical'
  }

  if (value >= warning) {
    return 'warning'
  }

  return 'healthy'
}

export function getMetricStatusLabel(status: MetricStatus) {
  switch (status) {
    case 'healthy':
      return 'Healthy'
    case 'warning':
      return 'Needs attention'
    case 'critical':
      return 'Bottleneck'
    case 'unknown':
      return 'No data'
  }
}
