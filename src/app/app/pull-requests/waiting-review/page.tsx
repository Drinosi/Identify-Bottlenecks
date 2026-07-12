import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { WaitingReviewPage } from '@/components/WaitingReviewPage'

export default async function WaitingReviewRoute() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const result = await db.query(
    `
    SELECT
      github_repositories.id AS repository_id,
      github_repositories.owner AS repository_owner,
      github_repositories.name AS repository_name,
      github_repositories.full_name AS repository_full_name,
      github_pull_requests.number,
      github_pull_requests.title,
      github_pull_requests.author_login,
      github_pull_requests.draft,
      github_pull_requests.opened_at,
      ROUND(EXTRACT(EPOCH FROM (NOW() - github_pull_requests.opened_at)) / 3600, 1) AS waiting_hours
    FROM github_pull_requests
    INNER JOIN github_repositories
      ON github_repositories.id = github_pull_requests.github_repository_id
    INNER JOIN github_installations
      ON github_installations.id = github_repositories.github_installation_id
    INNER JOIN organization_members
      ON organization_members.organization_id = github_installations.organization_id
    WHERE organization_members.user_id = $1
      AND github_pull_requests.state = 'open'
      AND github_pull_requests.first_reviewed_at IS NULL
    ORDER BY github_pull_requests.opened_at ASC, github_repositories.full_name ASC
    `,
    [session.user.id]
  )

  const items = result.rows.map((row) => ({
    repositoryId: row.repository_id as string,
    repositoryOwner: row.repository_owner as string,
    repositoryName: row.repository_name as string,
    repositoryFullName: row.repository_full_name as string,
    number: row.number as number,
    title: row.title as string,
    authorLogin: (row.author_login as string | null) ?? null,
    draft: row.draft as boolean,
    openedAt: row.opened_at as string,
    waitingHours: Number(row.waiting_hours ?? 0),
  }))

  return <WaitingReviewPage user={session.user} items={items} />
}
