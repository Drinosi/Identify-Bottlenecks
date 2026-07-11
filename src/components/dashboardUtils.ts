export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatSyncTime(value: string | null | undefined) {
  if (!value) {
    return 'Never synced'
  }

  return `Last synced ${formatDate(value)}`
}

export function formatReviewTime(hours: number | null | undefined) {
  if (hours === null || hours === undefined) {
    return 'No data'
  }

  if (hours < 24) {
    return `${hours.toFixed(1)}h`
  }

  return `${(hours / 24).toFixed(1)}d`
}

export function formatPercentDelta(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return 'No baseline'
  }

  const prefix = value > 0 ? '+' : ''

  return `${prefix}${value.toFixed(1)}%`
}
