import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { PipelinesPage } from '@/components/PipelinesPage'

export default async function PipelinesRoute() {
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
      github_workflow_runs.github_workflow_run_id,
      github_workflow_runs.name,
      github_workflow_runs.conclusion,
      github_workflow_runs.event,
      github_workflow_runs.head_branch,
      github_workflow_runs.html_url,
      COALESCE(github_workflow_runs.run_started_at, github_workflow_runs.updated_at) AS started_at
    FROM github_workflow_runs
    INNER JOIN github_repositories
      ON github_repositories.id = github_workflow_runs.github_repository_id
    INNER JOIN github_installations
      ON github_installations.id = github_repositories.github_installation_id
    INNER JOIN organization_members
      ON organization_members.organization_id = github_installations.organization_id
    WHERE organization_members.user_id = $1
    ORDER BY COALESCE(github_workflow_runs.run_started_at, github_workflow_runs.updated_at) DESC, github_repositories.full_name ASC
    LIMIT 300
    `,
    [session.user.id]
  )

  const items = result.rows.map((row) => ({
    repositoryId: row.repository_id as string,
    repositoryOwner: row.repository_owner as string,
    repositoryName: row.repository_name as string,
    repositoryFullName: row.repository_full_name as string,
    workflowRunId: row.github_workflow_run_id as number,
    name: row.name as string,
    conclusion: (row.conclusion as string | null) ?? null,
    event: row.event as string,
    headBranch: row.head_branch as string,
    htmlUrl: (row.html_url as string | null) ?? null,
    startedAt: row.started_at as string,
  }))

  return <PipelinesPage user={session.user} items={items} />
}
