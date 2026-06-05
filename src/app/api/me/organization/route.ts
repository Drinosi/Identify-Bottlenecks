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

  const result = await db.query(
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

  if (!result.rows[0]) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(result.rows[0])
}
