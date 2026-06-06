import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
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
    SELECT
      organization_members.role,
      organization_members.organization_id
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

  const state = randomUUID()

  await db.query(
    `
    INSERT INTO github_install_states (
      state,
      organization_id,
      user_id,
      expires_at
    )
    VALUES ($1, $2, $3, NOW() + INTERVAL '15 minutes')
    `,
    [state, result.rows[0].organization_id, session.user.id]
  )

  const url = new URL(`https://github.com/apps/${appName}/installations/new`)
  url.searchParams.set('state', state)

  return NextResponse.json({
    url: url.toString(),
  })
}
