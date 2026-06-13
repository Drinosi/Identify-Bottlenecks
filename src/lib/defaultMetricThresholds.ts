/*
 * Product defaults for bottleneck detection.
 *
 * These are intentionally not "industry standards". DORA's delivery metrics
 * frame what matters for throughput and stability, while code-review thresholds
 * are practical starting assumptions that should become organization-editable.
 */
export const defaultMetricThresholds = {
  pullRequest: {
    firstReview: {
      warningHours: 24,
      criticalHours: 72,
    },
    mergeTime: {
      warningHours: 72,
      criticalHours: 168,
    },
    openWithoutReview: {
      warningHours: 48,
      criticalHours: 120,
    },
    reviewedButUnmerged: {
      warningHours: 72,
      criticalHours: 168,
    },
  },
  repository: {
    defaultBranchActivity: {
      warningHours: 168,
      criticalHours: 336,
    },
  },
  delivery: {
    changeLeadTime: {
      warningHours: 72,
      criticalHours: 168,
    },
  },
} as const

export type DefaultMetricThresholds = typeof defaultMetricThresholds
