import type { MetricThresholds } from '@/lib/metricThresholds'

export type Workspace = {
  user: {
    id: string
    name: string
    email: string
  }
  organization: {
    id: string
    name: string
    slug: string
    created_at: string
    role: string
  } | null
  metricThresholds: MetricThresholds
  members: OrganizationMember[]
  invitations: OrganizationInvitation[]
  github: {
    connected: boolean
    accountLogin: string | null
    installationId: string | null
    lastRepositorySyncedAt: string | null
    repositorySyncStatus: SyncStatus
    repositorySyncError: string | null
    repositories: Repository[]
    pullRequests: {
      total: number
      waitingForReview: number
      oldestWaitingReviewHours: number | null
      oldestWaitingReviewRepositoryFullName: string | null
      reviewedButUnmerged: number
      oldestReviewedButUnmergedHours: number | null
      oldestReviewedButUnmergedRepositoryFullName: string | null
      averageHoursToFirstReview: number | null
      averageHoursToMerge: number | null
    }
    pipeline: {
      successfulRunsLast30Days: number
      successRateLast30Days: number | null
      medianHoursMergeToPipeline: number | null
      baselineMedianHoursMergeToPipeline: number | null
      medianHoursMergeToPipelinePercentChange: number | null
    }
  }
}

export type Repository = {
  id: string
  owner: string
  name: string
  full_name: string
  default_branch: string
  private: boolean
  last_pull_request_synced_at: string | null
  pull_request_sync_status: SyncStatus
  pull_request_sync_error: string | null
  last_workflow_run_synced_at: string | null
  workflow_run_sync_status: SyncStatus
  workflow_run_sync_error: string | null
  updated_at: string
}

export type OrganizationMember = {
  id: string
  name: string
  email: string
  role: string
}

export type OrganizationInvitation = {
  id: string
  email: string
  role: string
  expires_at: string
  invite_url: string
}

export type SyncStatus = 'idle' | 'syncing' | 'failed'
