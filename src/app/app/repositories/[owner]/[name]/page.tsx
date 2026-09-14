import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { RepositoryDetailPage } from '@/components/RepositoryDetailPage'
import { fetchAuthorCommitsActivity } from '@/lib/github'

type RepositoryPageProps = {
  params: Promise<{
    owner: string
    name: string
  }>
}

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const { owner: encodedOwner, name: encodedName } = await params
  const owner = decodeURIComponent(encodedOwner)
  const name = decodeURIComponent(encodedName)

  const repositoryResult = await db.query(
    `
    SELECT
      github_repositories.id,
      github_repositories.owner,
      github_repositories.name,
      github_repositories.full_name,
      github_repositories.default_branch,
      github_repositories.private,
      github_repositories.last_pull_request_synced_at,
      github_repositories.last_workflow_run_synced_at,
      github_repositories.updated_at,
      github_installations.account_login,
      github_installations.installation_id,
      organizations.name AS organization_name,
      organization_members.role
    FROM github_repositories
    INNER JOIN github_installations
      ON github_installations.id = github_repositories.github_installation_id
    INNER JOIN organizations
      ON organizations.id = github_installations.organization_id
    INNER JOIN organization_members
      ON organization_members.organization_id = organizations.id
    WHERE organization_members.user_id = $1
      AND github_repositories.owner = $2
      AND github_repositories.name = $3
    LIMIT 1
    `,
    [session.user.id, owner, name]
  )

  const repository = repositoryResult.rows[0]

  if (!repository) {
    notFound()
  }

  const commitActivity = await fetchAuthorCommitsActivity(
    owner,
    name,
    repository.installation_id
  )

  const metricsResult = await db.query(
    `
    WITH first_successful_runs AS (
      SELECT
        head_sha,
        MIN(run_started_at) AS first_successful_run_at
      FROM github_workflow_runs
      WHERE github_repository_id = $1
        AND conclusion = 'success'
        AND run_started_at IS NOT NULL
      GROUP BY head_sha
    )
    SELECT
      COUNT(*)::INT AS total_pull_requests,
      COUNT(*) FILTER (
        WHERE state = 'open'
      )::INT AS open_pull_requests,
      COUNT(*) FILTER (
        WHERE state = 'open'
          AND first_reviewed_at IS NULL
      )::INT AS waiting_for_review,
      ROUND(
        AVG(
          EXTRACT(EPOCH FROM (first_reviewed_at - opened_at)) / 3600
        ) FILTER (WHERE first_reviewed_at IS NOT NULL),
        1
      ) AS average_hours_to_first_review,
      ROUND(
        AVG(
          EXTRACT(EPOCH FROM (merged_at - opened_at)) / 3600
        ) FILTER (WHERE merged_at IS NOT NULL),
        1
      ) AS average_hours_to_merge,
      (
        SELECT COUNT(*)::INT
        FROM github_workflow_runs
        WHERE github_repository_id = $1
          AND conclusion = 'success'
          AND run_started_at >= NOW() - INTERVAL '30 days'
      ) AS successful_pipeline_runs_last_30_days,
      (
        SELECT ROUND(
          (
            COUNT(*) FILTER (WHERE conclusion = 'success')::NUMERIC
            / NULLIF(COUNT(*), 0)::NUMERIC
          ) * 100,
          1
        )
        FROM github_workflow_runs
        WHERE github_repository_id = $1
          AND run_started_at >= NOW() - INTERVAL '30 days'
      ) AS pipeline_success_rate_last_30_days,
      ROUND(
        (
          percentile_cont(0.5) WITHIN GROUP (
            ORDER BY EXTRACT(EPOCH FROM (
              first_successful_runs.first_successful_run_at - github_pull_requests.merged_at
            )) / 3600
          )
        )::NUMERIC,
        1
      ) AS median_hours_merge_to_pipeline
    FROM github_pull_requests
    LEFT JOIN first_successful_runs
      ON first_successful_runs.head_sha = github_pull_requests.merge_commit_sha
    WHERE github_pull_requests.github_repository_id = $1
    `,
    [repository.id]
  )

  const pullRequestsResult = await db.query(
    `
    SELECT
      github_pull_requests.number,
      github_pull_requests.title,
      github_pull_requests.state,
      github_pull_requests.author_login,
      github_pull_requests.author_identity_id,
      integration_identities.avatar_url AS author_avatar_url,
      integration_identities.profile_url AS author_profile_url,
      github_pull_requests.draft,
      github_pull_requests.opened_at,
      github_pull_requests.closed_at,
      github_pull_requests.merged_at,
      github_pull_requests.first_reviewed_at,
      github_pull_requests.review_count,
      github_pull_requests.updated_at
    FROM github_pull_requests
    LEFT JOIN integration_identities
      ON integration_identities.id = github_pull_requests.author_identity_id
    WHERE github_pull_requests.github_repository_id = $1
    ORDER BY github_pull_requests.opened_at DESC
    LIMIT 50
    `,
    [repository.id]
  )
  const metrics = metricsResult.rows[0]

  const workflowRunsResult = await db.query(
    `
    SELECT
      github_workflow_run_id,
      name,
      conclusion,
      event,
      head_branch,
      head_sha,
      html_url,
      run_started_at,
      updated_at
    FROM github_workflow_runs
    WHERE github_repository_id = $1
    ORDER BY COALESCE(run_started_at, updated_at) DESC
    LIMIT 50
    `,
    [repository.id]
  )

  return (
    <RepositoryDetailPage
      user={session.user}
      detail={{
        repository,
        commitActivity,
        metrics: {
          totalPullRequests: metrics?.total_pull_requests ?? 0,
          openPullRequests: metrics?.open_pull_requests ?? 0,
          waitingForReview: metrics?.waiting_for_review ?? 0,
          averageHoursToFirstReview:
            metrics?.average_hours_to_first_review === null
              ? null
              : Number(metrics?.average_hours_to_first_review ?? 0),
          averageHoursToMerge:
            metrics?.average_hours_to_merge === null
              ? null
              : Number(metrics?.average_hours_to_merge ?? 0),
          successfulPipelineRunsLast30Days:
            metrics?.successful_pipeline_runs_last_30_days ?? 0,
          pipelineSuccessRateLast30Days:
            metrics?.pipeline_success_rate_last_30_days === null
              ? null
              : Number(metrics?.pipeline_success_rate_last_30_days ?? 0),
          medianHoursMergeToPipeline:
            metrics?.median_hours_merge_to_pipeline === null
              ? null
              : Number(metrics?.median_hours_merge_to_pipeline ?? 0),
        },
        pullRequests: pullRequestsResult.rows,
        workflowRuns: workflowRunsResult.rows,
      }}
    />
  )
}
