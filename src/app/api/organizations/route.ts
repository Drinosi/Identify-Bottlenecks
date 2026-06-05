import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const result = await db.query(`
    SELECT *
    FROM organizations
    ORDER BY created_at DESC
  `)

  return NextResponse.json(result.rows)
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''

  if (!name) {
    return NextResponse.json(
      { error: 'Organization name is required' },
      { status: 400 }
    )
  }

  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const organizationResult = await client.query(
      `
      INSERT INTO organizations (name)
      VALUES ($1)
      RETURNING *
      `,
      [name]
    )

    const membershipResult = await client.query(
      `
      INSERT INTO organization_members (organization_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [organizationResult.rows[0].id, session.user.id, 'owner']
    )

    await client.query('COMMIT')

    return NextResponse.json(
      {
        organization: organizationResult.rows[0],
        membership: membershipResult.rows[0],
      },
      { status: 201 }
    )
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(error)

    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
