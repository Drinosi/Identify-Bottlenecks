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

  const appName = process.env.GITHUB_APP_NAME

  if (!appName) {
    return NextResponse.json(
      { error: 'GitHub app name is not configured' },
      { status: 500 }
    )
  }

  const result = await db.query(
    `
    SELECT organization_members.role
    FROM organization_members
    WHERE organization_members.user_id = $1
      AND organization_members.role IN ('owner', 'admin')
    LIMIT 1
    `,
    [session.user.id]
  )

  if (!result.rows[0]) {
    return NextResponse.json(
      { error: 'Only organization owners and admins can connect GitHub' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    url: `https://github.com/apps/${appName}/installations/new`,
  })
}
