import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { RepositoryDetailPage } from '@/components/RepositoryDetailPage'

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
      github_repositories.updated_at,
      github_installations.account_login,
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

  const metricsResult = await db.query(
    `
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
      ) AS average_hours_to_first_review
    FROM github_pull_requests
    WHERE github_repository_id = $1
    `,
    [repository.id]
  )

  const pullRequestsResult = await db.query(
    `
    SELECT
      number,
      title,
      state,
      author_login,
      draft,
      opened_at,
      closed_at,
      merged_at,
      first_reviewed_at,
      review_count,
      updated_at
    FROM github_pull_requests
    WHERE github_repository_id = $1
    ORDER BY opened_at DESC
    LIMIT 50
    `,
    [repository.id]
  )
  const metrics = metricsResult.rows[0]

  return (
    <RepositoryDetailPage
      user={session.user}
      detail={{
        repository,
        metrics: {
          totalPullRequests: metrics?.total_pull_requests ?? 0,
          openPullRequests: metrics?.open_pull_requests ?? 0,
          waitingForReview: metrics?.waiting_for_review ?? 0,
          averageHoursToFirstReview:
            metrics?.average_hours_to_first_review === null
              ? null
              : Number(metrics?.average_hours_to_first_review ?? 0),
        },
        pullRequests: pullRequestsResult.rows,
      }}
    />
  )
}
