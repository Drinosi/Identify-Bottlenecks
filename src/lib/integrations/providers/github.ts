import {
  fetchInstallationRepositories,
  fetchPullRequestReviews,
  fetchRepositoryCommits,
  fetchRepositoryPullRequests,
  fetchRepositoryWorkflowRuns,
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
      author: pullRequest.user
        ? {
            externalId: String(pullRequest.user.id),
            login: pullRequest.user.login,
            displayName: null,
            avatarUrl: pullRequest.user.avatar_url,
            profileUrl: pullRequest.user.html_url,
            email: null,
          }
        : null,
      draft: pullRequest.draft,
      openedAt: pullRequest.created_at,
      closedAt: pullRequest.closed_at,
      mergedAt: pullRequest.merged_at,
      mergeCommitSha: pullRequest.merge_commit_sha,
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
  async listWorkflowRuns(connection, repository, options) {
    const workflowRuns = await fetchRepositoryWorkflowRuns(
      connection.externalInstallationId,
      repository.owner,
      repository.name,
      options?.updatedSince
    )

    return workflowRuns.map((workflowRun) => ({
      externalId: workflowRun.id,
      name: workflowRun.name,
      status: workflowRun.status,
      conclusion: workflowRun.conclusion,
      event: workflowRun.event,
      headBranch: workflowRun.head_branch,
      headSha: workflowRun.head_sha,
      htmlUrl: workflowRun.html_url,
      runStartedAt: workflowRun.run_started_at,
      createdAt: workflowRun.created_at,
      updatedAt: workflowRun.updated_at,
    }))
  },
  async listCommits(connection, repository, options) {
    const commits = await fetchRepositoryCommits(
      connection.externalInstallationId,
      repository.owner,
      repository.name,
      repository.defaultBranch,
      options?.updatedSince
    )

    return commits.map((commit) => ({
      externalId: commit.sha,
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.author
        ? {
            externalId: String(commit.author.id),
            login: commit.author.login,
            displayName: null,
            avatarUrl: commit.author.avatar_url,
            profileUrl: commit.author.html_url,
            email: commit.commit.author?.email ?? null,
          }
        : null,
      authorName: commit.commit.author?.name ?? null,
      authorEmail: commit.commit.author?.email ?? null,
      committedAt: commit.commit.author?.date ?? new Date().toISOString(),
      htmlUrl: commit.html_url,
    }))
  },
}
