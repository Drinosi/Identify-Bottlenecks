import { db } from '@/lib/db'

type WorkspaceUser = {
  id: string
  name: string
  email: string
}

export async function getWorkspaceForUser(user: WorkspaceUser) {
  const organizationResult = await db.query(
    `
    SELECT
      organizations.id,
      organizations.name,
      organizations.slug,
      organizations.created_at,
      organization_members.role
    FROM organization_members
    INNER JOIN organizations
      ON organizations.id = organization_members.organization_id
    WHERE organization_members.user_id = $1
    ORDER BY organization_members.created_at ASC
    LIMIT 1
    `,
    [user.id]
  )

  const organization = organizationResult.rows[0]

  if (!organization) {
    return {
      user,
      organization: null,
      github: {
        connected: false,
        accountLogin: null,
        installationId: null,
        lastRepositorySyncedAt: null,
        repositorySyncStatus: 'idle',
        repositorySyncError: null,
        repositories: [],
        pullRequests: {
          total: 0,
          waitingForReview: 0,
          oldestWaitingReviewHours: null,
          reviewedButUnmerged: 0,
          oldestReviewedButUnmergedHours: null,
          averageHoursToFirstReview: null,
          averageHoursToMerge: null,
        },
      },
    }
  }

  const githubResult = await db.query(
    `
    SELECT
      id,
      account_login,
      installation_id,
      last_repository_synced_at,
      repository_sync_status,
      repository_sync_error
    FROM github_installations
    WHERE organization_id = $1
    LIMIT 1
    `,
    [organization.id]
  )
  const githubInstallation = githubResult.rows[0]

  const repositoriesResult = githubInstallation
    ? await db.query(
        `
        SELECT
          id,
          owner,
          name,
          full_name,
          default_branch,
          private,
          last_pull_request_synced_at,
          pull_request_sync_status,
          pull_request_sync_error,
          updated_at
        FROM github_repositories
        WHERE github_installation_id = $1
        ORDER BY full_name ASC
        `,
        [githubInstallation.id]
      )
    : { rows: [] }

  const pullRequestMetricsResult = githubInstallation
    ? await db.query(
        `
        SELECT
          COUNT(*)::INT AS total_pull_requests,
          COUNT(*) FILTER (
            WHERE state = 'open'
              AND first_reviewed_at IS NULL
          )::INT AS waiting_for_review,
          ROUND(
            MAX(
              EXTRACT(EPOCH FROM (NOW() - opened_at)) / 3600
            ) FILTER (
              WHERE state = 'open'
                AND first_reviewed_at IS NULL
            ),
            1
          ) AS oldest_waiting_review_hours,
          COUNT(*) FILTER (
            WHERE state = 'open'
              AND first_reviewed_at IS NOT NULL
              AND merged_at IS NULL
          )::INT AS reviewed_but_unmerged,
          ROUND(
            MAX(
              EXTRACT(EPOCH FROM (NOW() - first_reviewed_at)) / 3600
            ) FILTER (
              WHERE state = 'open'
                AND first_reviewed_at IS NOT NULL
                AND merged_at IS NULL
            ),
            1
          ) AS oldest_reviewed_but_unmerged_hours,
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
          ) AS average_hours_to_merge
        FROM github_pull_requests
        INNER JOIN github_repositories
          ON github_repositories.id = github_pull_requests.github_repository_id
        WHERE github_repositories.github_installation_id = $1
        `,
        [githubInstallation.id]
      )
    : { rows: [] }
  const pullRequestMetrics = pullRequestMetricsResult.rows[0]

  return {
    user,
    organization,
    github: {
      connected: Boolean(githubInstallation),
      accountLogin: githubInstallation?.account_login ?? null,
      installationId: githubInstallation?.installation_id
        ? String(githubInstallation.installation_id)
        : null,
      lastRepositorySyncedAt:
        githubInstallation?.last_repository_synced_at ?? null,
      repositorySyncStatus:
        githubInstallation?.repository_sync_status ?? 'idle',
      repositorySyncError: githubInstallation?.repository_sync_error ?? null,
      repositories: repositoriesResult.rows,
      pullRequests: {
        total: pullRequestMetrics?.total_pull_requests ?? 0,
        waitingForReview: pullRequestMetrics?.waiting_for_review ?? 0,
        oldestWaitingReviewHours:
          pullRequestMetrics?.oldest_waiting_review_hours === null
            ? null
            : Number(pullRequestMetrics?.oldest_waiting_review_hours ?? 0),
        reviewedButUnmerged: pullRequestMetrics?.reviewed_but_unmerged ?? 0,
        oldestReviewedButUnmergedHours:
          pullRequestMetrics?.oldest_reviewed_but_unmerged_hours === null
            ? null
            : Number(
                pullRequestMetrics?.oldest_reviewed_but_unmerged_hours ?? 0
              ),
        averageHoursToFirstReview:
          pullRequestMetrics?.average_hours_to_first_review === null
            ? null
            : Number(pullRequestMetrics?.average_hours_to_first_review ?? 0),
        averageHoursToMerge:
          pullRequestMetrics?.average_hours_to_merge === null
            ? null
            : Number(pullRequestMetrics?.average_hours_to_merge ?? 0),
      },
    },
  }
}
