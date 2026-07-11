import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

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

  const deleteResult = await db.query(
    `
    DELETE FROM github_installations
    WHERE organization_id = $1
    `,
    [membership.organization_id]
  )

  if (deleteResult.rowCount === 0) {
    return NextResponse.json(
      { error: 'GitHub is not connected for this organization' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true })
}
