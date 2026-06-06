import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { fetchInstallationRepositories } from '@/lib/github'

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const installationResult = await db.query(
    `
    SELECT
      github_installations.id,
      github_installations.installation_id
    FROM github_installations
    INNER JOIN organization_members
      ON organization_members.organization_id = github_installations.organization_id
    WHERE organization_members.user_id = $1
      AND organization_members.role IN ('owner', 'admin')
    LIMIT 1
    `,
    [session.user.id]
  )

  const installation = installationResult.rows[0]

  if (!installation) {
    return NextResponse.json(
      { error: 'GitHub is not connected for this organization' },
      { status: 404 }
    )
  }

  const repositories = await fetchInstallationRepositories(
    installation.installation_id
  )
  const accountLogin = repositories[0]?.owner.login

  const client = await db.connect()

  try {
    await client.query('BEGIN')

    if (accountLogin) {
      await client.query(
        `
        UPDATE github_installations
        SET
          account_login = $1,
          updated_at = NOW()
        WHERE id = $2
        `,
        [accountLogin, installation.id]
      )
    }

    for (const repository of repositories) {
      await client.query(
        `
        INSERT INTO github_repositories (
          github_installation_id,
          github_repository_id,
          owner,
          name,
          full_name,
          default_branch,
          private,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (github_repository_id)
        DO UPDATE SET
          owner = EXCLUDED.owner,
          name = EXCLUDED.name,
          full_name = EXCLUDED.full_name,
          default_branch = EXCLUDED.default_branch,
          private = EXCLUDED.private,
          updated_at = NOW()
        `,
        [
          installation.id,
          repository.id,
          repository.owner.login,
          repository.name,
          repository.full_name,
          repository.default_branch,
          repository.private,
        ]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({
      synced: repositories.length,
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(error)

    return NextResponse.json(
      { error: 'Failed to sync repositories' },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
