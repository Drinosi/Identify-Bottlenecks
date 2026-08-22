import { defaultMetricThresholds } from '@/lib/defaultMetricThresholds'

export const metricThresholdGroups = [
  {
    title: 'Pull request flow',
    description: 'Define when review and merge delays need attention.',
    thresholds: [
      {
        label: 'Time to first review',
        description:
          'Average time from opening a pull request until its first submitted review.',
        unit: 'hours',
        warning: {
          name: 'first_review_warning_hours',
          defaultValue:
            defaultMetricThresholds.pullRequest.firstReview.warningHours,
        },
        critical: {
          name: 'first_review_critical_hours',
          defaultValue:
            defaultMetricThresholds.pullRequest.firstReview.criticalHours,
        },
      },
      {
        label: 'Time to merge',
        description:
          'Average time from opening a pull request until it is merged.',
        unit: 'hours',
        warning: {
          name: 'merge_time_warning_hours',
          defaultValue:
            defaultMetricThresholds.pullRequest.mergeTime.warningHours,
        },
        critical: {
          name: 'merge_time_critical_hours',
          defaultValue:
            defaultMetricThresholds.pullRequest.mergeTime.criticalHours,
        },
      },
      {
        label: 'Open without review',
        description:
          'Age of the oldest open pull request that has not received a review.',
        unit: 'hours',
        warning: {
          name: 'open_without_review_warning_hours',
          defaultValue:
            defaultMetricThresholds.pullRequest.openWithoutReview.warningHours,
        },
        critical: {
          name: 'open_without_review_critical_hours',
          defaultValue:
            defaultMetricThresholds.pullRequest.openWithoutReview.criticalHours,
        },
      },
      {
        label: 'Reviewed but unmerged',
        description:
          'Time the oldest reviewed pull request has remained open without being merged.',
        unit: 'hours',
        warning: {
          name: 'reviewed_but_unmerged_warning_hours',
          defaultValue:
            defaultMetricThresholds.pullRequest.reviewedButUnmerged
              .warningHours,
        },
        critical: {
          name: 'reviewed_but_unmerged_critical_hours',
          defaultValue:
            defaultMetricThresholds.pullRequest.reviewedButUnmerged
              .criticalHours,
        },
      },
    ],
  },
  {
    title: 'Repository health',
    description: 'Control when inactivity on the default branch is surfaced.',
    thresholds: [
      {
        label: 'Default branch inactivity',
        description:
          'Elapsed time without activity on a repository’s default branch.',
        unit: 'hours',
        warning: {
          name: 'default_branch_activity_warning_hours',
          defaultValue:
            defaultMetricThresholds.repository.defaultBranchActivity
              .warningHours,
        },
        critical: {
          name: 'default_branch_activity_critical_hours',
          defaultValue:
            defaultMetricThresholds.repository.defaultBranchActivity
              .criticalHours,
        },
      },
    ],
  },
  {
    title: 'Delivery health',
    description: 'Tune lead-time and pipeline-regression sensitivity.',
    thresholds: [
      {
        label: 'Change lead time',
        description:
          'Elapsed delivery time for a change before it should be treated as delayed.',
        unit: 'hours',
        warning: {
          name: 'change_lead_time_warning_hours',
          defaultValue:
            defaultMetricThresholds.delivery.changeLeadTime.warningHours,
        },
        critical: {
          name: 'change_lead_time_critical_hours',
          defaultValue:
            defaultMetricThresholds.delivery.changeLeadTime.criticalHours,
        },
      },
      {
        label: 'Merge-to-pipeline increase',
        description:
          'How much slower merge-to-pipeline time may become compared with its recent baseline.',
        unit: 'percent',
        warning: {
          name: 'merge_to_pipeline_increase_warning_percent',
          defaultValue:
            defaultMetricThresholds.delivery.mergeToPipelineIncrease
              .warningPercent,
        },
        critical: {
          name: 'merge_to_pipeline_increase_critical_percent',
          defaultValue:
            defaultMetricThresholds.delivery.mergeToPipelineIncrease
              .criticalPercent,
        },
      },
    ],
  },
] as const

type ThresholdGroup = (typeof metricThresholdGroups)[number]
type ThresholdPair = ThresholdGroup['thresholds'][number]

export type MetricThresholdFieldName =
  | ThresholdPair['warning']['name']
  | ThresholdPair['critical']['name']

export type MetricThresholdOverrides = Partial<
  Record<MetricThresholdFieldName, number | null>
>

export type MetricThresholdValues = Record<MetricThresholdFieldName, number>

export const metricThresholdFieldNames = metricThresholdGroups.flatMap(
  (group) =>
    group.thresholds.flatMap((threshold) => [
      threshold.warning.name,
      threshold.critical.name,
    ])
) as MetricThresholdFieldName[]

export type MetricThresholds = {
  pullRequest: {
    firstReview: ThresholdPairValues
    mergeTime: ThresholdPairValues
    openWithoutReview: ThresholdPairValues
    reviewedButUnmerged: ThresholdPairValues
  }
  repository: {
    defaultBranchActivity: ThresholdPairValues
  }
  delivery: {
    changeLeadTime: ThresholdPairValues
    mergeToPipelineIncrease: {
      warningPercent: number
      criticalPercent: number
    }
  }
}

type ThresholdPairValues = {
  warningHours: number
  criticalHours: number
}

export function resolveMetricThresholdValues(
  overrides: MetricThresholdOverrides = {}
): MetricThresholdValues {
  const values = {} as MetricThresholdValues

  for (const group of metricThresholdGroups) {
    for (const threshold of group.thresholds) {
      values[threshold.warning.name] =
        overrides[threshold.warning.name] ?? threshold.warning.defaultValue
      values[threshold.critical.name] =
        overrides[threshold.critical.name] ?? threshold.critical.defaultValue
    }
  }

  return values
}

export function resolveMetricThresholds(
  overrides: MetricThresholdOverrides = {}
): MetricThresholds {
  const values = resolveMetricThresholdValues(overrides)

  return {
    pullRequest: {
      firstReview: {
        warningHours: values.first_review_warning_hours,
        criticalHours: values.first_review_critical_hours,
      },
      mergeTime: {
        warningHours: values.merge_time_warning_hours,
        criticalHours: values.merge_time_critical_hours,
      },
      openWithoutReview: {
        warningHours: values.open_without_review_warning_hours,
        criticalHours: values.open_without_review_critical_hours,
      },
      reviewedButUnmerged: {
        warningHours: values.reviewed_but_unmerged_warning_hours,
        criticalHours: values.reviewed_but_unmerged_critical_hours,
      },
    },
    repository: {
      defaultBranchActivity: {
        warningHours: values.default_branch_activity_warning_hours,
        criticalHours: values.default_branch_activity_critical_hours,
      },
    },
    delivery: {
      changeLeadTime: {
        warningHours: values.change_lead_time_warning_hours,
        criticalHours: values.change_lead_time_critical_hours,
      },
      mergeToPipelineIncrease: {
        warningPercent: values.merge_to_pipeline_increase_warning_percent,
        criticalPercent: values.merge_to_pipeline_increase_critical_percent,
      },
    },
  }
}

export function parseMetricThresholdFormData(formData: FormData) {
  const values = {} as MetricThresholdValues

  for (const group of metricThresholdGroups) {
    for (const threshold of group.thresholds) {
      const warning = parseThresholdValue(
        formData.get(threshold.warning.name),
        threshold.unit === 'percent' ? 0 : 1
      )
      const critical = parseThresholdValue(
        formData.get(threshold.critical.name),
        1
      )

      if (warning === null || critical === null || warning >= critical) {
        return null
      }

      values[threshold.warning.name] = warning
      values[threshold.critical.name] = critical
    }
  }

  return values
}

function parseThresholdValue(
  value: FormDataEntryValue | null,
  minimum: number
) {
  if (typeof value !== 'string' || value.trim() === '') {
    return null
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed >= minimum ? parsed : null
}
