export type IntegrationProviderId = 'github'

export type IntegrationConnection = {
  provider: IntegrationProviderId
  externalInstallationId: string
}

export type IntegrationRepository = {
  externalId: number
  owner: string
  name: string
  fullName: string
  defaultBranch: string
  private: boolean
  accountLogin: string | null
}

export type IntegrationPullRequest = {
  externalId: number
  number: number
  title: string
  state: string
  authorLogin: string | null
  draft: boolean
  openedAt: string
  closedAt: string | null
  mergedAt: string | null
  mergeCommitSha: string | null
}

export type IntegrationPullRequestReview = {
  submittedAt: string | null
}

export type IntegrationWorkflowRun = {
  externalId: number
  name: string
  status: string
  conclusion: string | null
  event: string
  headBranch: string
  headSha: string
  htmlUrl: string | null
  runStartedAt: string | null
  createdAt: string
  updatedAt: string
}

export type IntegrationProvider = {
  id: IntegrationProviderId
  label: string
  listRepositories: (
    connection: IntegrationConnection
  ) => Promise<IntegrationRepository[]>
  listPullRequests: (
    connection: IntegrationConnection,
    repository: Pick<IntegrationRepository, 'owner' | 'name'>,
    options?: { updatedSince?: string | null }
  ) => Promise<IntegrationPullRequest[]>
  listPullRequestReviews: (
    connection: IntegrationConnection,
    repository: Pick<IntegrationRepository, 'owner' | 'name'>,
    pullRequestNumber: number
  ) => Promise<IntegrationPullRequestReview[]>
  listWorkflowRuns: (
    connection: IntegrationConnection,
    repository: Pick<IntegrationRepository, 'owner' | 'name' | 'defaultBranch'>,
    options?: { updatedSince?: string | null }
  ) => Promise<IntegrationWorkflowRun[]>
}
