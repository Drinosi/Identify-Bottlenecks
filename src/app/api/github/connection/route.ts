import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getGitHubInstallationSettingsUrl } from '@/lib/github'

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const result = await db.query(
    `
    SELECT
      organization_members.organization_id
    FROM organization_members
    WHERE organization_members.user_id = $1
      AND organization_members.role IN ('owner', 'admin')
    LIMIT 1
    `,
    [session.user.id]
  )

  const membership = result.rows[0]

  if (!membership) {
    return NextResponse.json(
      { error: 'Only organization owners and admins can disconnect GitHub' },
      { status: 403 }
    )
  }

  const installationResult = await db.query(
    `
    SELECT
      account_login,
      account_type
    FROM github_installations
    WHERE organization_id = $1
    LIMIT 1
    `,
    [membership.organization_id]
  )

  const installation = installationResult.rows[0]

  if (!installation) {
    return NextResponse.json(
      { error: 'GitHub is not connected for this organization' },
      { status: 404 }
    )
  }

  const deleteResult = await db.query(
    `
    DELETE FROM github_installations
    WHERE organization_id = $1
    `,
    [membership.organization_id]
  )

  return NextResponse.json({
    success: deleteResult.rowCount > 0,
    uninstallUrl: getGitHubInstallationSettingsUrl(
      installation.account_login,
      installation.account_type
    ),
  })
}
