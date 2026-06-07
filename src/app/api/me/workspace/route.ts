import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

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
    [session.user.id]
  )

  const organization = organizationResult.rows[0]

  if (!organization) {
    return NextResponse.json({
      user: session.user,
      organization: null,
      github: {
        connected: false,
        accountLogin: null,
        repositories: [],
      },
    })
  }

  const githubResult = await db.query(
    `
    SELECT
      id,
      account_login
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
            AVG(
              EXTRACT(EPOCH FROM (first_reviewed_at - opened_at)) / 3600
            ) FILTER (WHERE first_reviewed_at IS NOT NULL),
            1
          ) AS average_hours_to_first_review
        FROM github_pull_requests
        INNER JOIN github_repositories
          ON github_repositories.id = github_pull_requests.github_repository_id
        WHERE github_repositories.github_installation_id = $1
        `,
        [githubInstallation.id]
      )
    : { rows: [] }
  const pullRequestMetrics = pullRequestMetricsResult.rows[0]

  return NextResponse.json({
    user: session.user,
    organization,
    github: {
      connected: Boolean(githubInstallation),
      accountLogin: githubInstallation?.account_login ?? null,
      repositories: repositoriesResult.rows,
      pullRequests: {
        total: pullRequestMetrics?.total_pull_requests ?? 0,
        waitingForReview: pullRequestMetrics?.waiting_for_review ?? 0,
        averageHoursToFirstReview:
          pullRequestMetrics?.average_hours_to_first_review === null
            ? null
            : Number(pullRequestMetrics?.average_hours_to_first_review ?? 0),
      },
    },
  })
}
