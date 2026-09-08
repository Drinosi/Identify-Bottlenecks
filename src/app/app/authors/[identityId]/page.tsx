import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { AuthorDetailPage } from '@/components/AuthorDetailPage'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

type AuthorPageProps = {
  params: Promise<{
    identityId: string
  }>
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const { identityId } = await params
  const identityResult = await db.query(
    `
    SELECT
      integration_identities.id,
      integration_identities.provider,
      integration_identities.external_id,
      integration_identities.login,
      integration_identities.display_name,
      integration_identities.avatar_url,
      integration_identities.profile_url,
      integration_identities.email,
      integration_identities.commit_message,
      integration_identities.updated_at,
   

      organizations.name AS organization_name
    FROM integration_identities
    INNER JOIN organizations
      ON organizations.id = integration_identities.organization_id
    INNER JOIN organization_members
      ON organization_members.organization_id = organizations.id
    WHERE integration_identities.id = $1
      AND organization_members.user_id = $2
    LIMIT 1
    `,
    [identityId, session.user.id]
  )
  const identity = identityResult.rows[0]

  if (!identity) {
    notFound()
  }

  const metricsResult = await db.query(
    `
    SELECT
      COUNT(*)::INT AS total_pull_requests,
      COUNT(*) FILTER (WHERE github_pull_requests.state = 'open')::INT AS open_pull_requests,
      COUNT(*) FILTER (WHERE github_pull_requests.merged_at IS NOT NULL)::INT AS merged_pull_requests,
      COUNT(*) FILTER (
        WHERE github_pull_requests.state = 'open'
          AND github_pull_requests.first_reviewed_at IS NULL
      )::INT AS waiting_for_review,
      ROUND(
        AVG(EXTRACT(EPOCH FROM (github_pull_requests.first_reviewed_at - github_pull_requests.opened_at)) / 3600)
          FILTER (WHERE github_pull_requests.first_reviewed_at IS NOT NULL),
        1
      ) AS average_hours_to_first_review,
      ROUND(
        AVG(EXTRACT(EPOCH FROM (github_pull_requests.merged_at - github_pull_requests.opened_at)) / 3600)
          FILTER (WHERE github_pull_requests.merged_at IS NOT NULL),
        1
      ) AS average_hours_to_merge
    FROM github_pull_requests
    INNER JOIN github_repositories
      ON github_repositories.id = github_pull_requests.github_repository_id
    INNER JOIN github_installations
      ON github_installations.id = github_repositories.github_installation_id
    INNER JOIN organization_members
      ON organization_members.organization_id = github_installations.organization_id
    WHERE github_pull_requests.author_identity_id = $1
      AND organization_members.user_id = $2
    `,
    [identityId, session.user.id]
  )

  const repositoriesResult = await db.query(
    `
    SELECT
      github_repositories.owner,
      github_repositories.name,
      github_repositories.full_name,
      COUNT(*)::INT AS pull_request_count,
      COUNT(*) FILTER (WHERE github_pull_requests.merged_at IS NOT NULL)::INT AS merged_count,
      MAX(github_pull_requests.opened_at) AS last_opened_at
    FROM github_pull_requests
    INNER JOIN github_repositories
      ON github_repositories.id = github_pull_requests.github_repository_id
    INNER JOIN github_installations
      ON github_installations.id = github_repositories.github_installation_id
    INNER JOIN organization_members
      ON organization_members.organization_id = github_installations.organization_id
    WHERE github_pull_requests.author_identity_id = $1
      AND organization_members.user_id = $2
    GROUP BY
      github_repositories.owner,
      github_repositories.name,
      github_repositories.full_name
    ORDER BY pull_request_count DESC, github_repositories.full_name ASC
    LIMIT 12
    `,
    [identityId, session.user.id]
  )

  const activityResult = await db.query(
    `
    SELECT
      DATE_TRUNC('week', github_pull_requests.opened_at)::DATE AS week,
      COUNT(*)::INT AS opened_count,
      COUNT(*) FILTER (WHERE github_pull_requests.merged_at IS NOT NULL)::INT AS merged_count
    FROM github_pull_requests
    INNER JOIN github_repositories
      ON github_repositories.id = github_pull_requests.github_repository_id
    INNER JOIN github_installations
      ON github_installations.id = github_repositories.github_installation_id
    INNER JOIN organization_members
      ON organization_members.organization_id = github_installations.organization_id
    WHERE github_pull_requests.author_identity_id = $1
      AND organization_members.user_id = $2
      AND github_pull_requests.opened_at >= NOW() - INTERVAL '12 weeks'
    GROUP BY DATE_TRUNC('week', github_pull_requests.opened_at)::DATE
    ORDER BY week ASC
    `,
    [identityId, session.user.id]
  )

  const pullRequestsResult = await db.query(
    `
    SELECT
      github_repositories.owner AS repository_owner,
      github_repositories.name AS repository_name,
      github_repositories.full_name AS repository_full_name,
      github_pull_requests.number,
      github_pull_requests.title,
      github_pull_requests.state,
      github_pull_requests.draft,
      github_pull_requests.opened_at,
      github_pull_requests.merged_at,
      github_pull_requests.first_reviewed_at,
      github_pull_requests.review_count
    FROM github_pull_requests
    INNER JOIN github_repositories
      ON github_repositories.id = github_pull_requests.github_repository_id
    INNER JOIN github_installations
      ON github_installations.id = github_repositories.github_installation_id
    INNER JOIN organization_members
      ON organization_members.organization_id = github_installations.organization_id
    WHERE github_pull_requests.author_identity_id = $1
      AND organization_members.user_id = $2
    ORDER BY github_pull_requests.opened_at DESC
    LIMIT 50
    `,
    [identityId, session.user.id]
  )
  const metrics = metricsResult.rows[0]

  return (
    <AuthorDetailPage
      identity={identity}
      metrics={{
        totalPullRequests: metrics?.total_pull_requests ?? 0,
        openPullRequests: metrics?.open_pull_requests ?? 0,
        mergedPullRequests: metrics?.merged_pull_requests ?? 0,
        waitingForReview: metrics?.waiting_for_review ?? 0,
        averageHoursToFirstReview:
          metrics?.average_hours_to_first_review === null
            ? null
            : Number(metrics?.average_hours_to_first_review ?? 0),
        averageHoursToMerge:
          metrics?.average_hours_to_merge === null
            ? null
            : Number(metrics?.average_hours_to_merge ?? 0),
      }}
      repositories={repositoriesResult.rows}
      activity={activityResult.rows}
      pullRequests={pullRequestsResult.rows}
    />
  )
}
