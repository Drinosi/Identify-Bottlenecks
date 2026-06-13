import {
  fetchInstallationRepositories,
  fetchPullRequestReviews,
  fetchRepositoryPullRequests,
} from '@/lib/github'
import type { IntegrationProvider } from '@/lib/integrations/types'

export const githubProvider: IntegrationProvider = {
  id: 'github',
  label: 'GitHub',
  async listRepositories(connection) {
    const repositories = await fetchInstallationRepositories(
      connection.externalInstallationId
    )

    return repositories.map((repository) => ({
      externalId: repository.id,
      owner: repository.owner.login,
      name: repository.name,
      fullName: repository.full_name,
      defaultBranch: repository.default_branch,
      private: repository.private,
      accountLogin: repository.owner.login,
    }))
  },
  async listPullRequests(connection, repository, options) {
    const pullRequests = await fetchRepositoryPullRequests(
      connection.externalInstallationId,
      repository.owner,
      repository.name,
      options?.updatedSince
    )

    return pullRequests.map((pullRequest) => ({
      externalId: pullRequest.id,
      number: pullRequest.number,
      title: pullRequest.title,
      state: pullRequest.state,
      authorLogin: pullRequest.user?.login ?? null,
      draft: pullRequest.draft,
      openedAt: pullRequest.created_at,
      closedAt: pullRequest.closed_at,
      mergedAt: pullRequest.merged_at,
    }))
  },
  async listPullRequestReviews(connection, repository, pullRequestNumber) {
    const reviews = await fetchPullRequestReviews(
      connection.externalInstallationId,
      repository.owner,
      repository.name,
      pullRequestNumber
    )

    return reviews.map((review) => ({
      submittedAt: review.submitted_at,
    }))
  },
}
