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
    SELECT organizations.*
    FROM organizations
    INNER JOIN organization_members
      ON organization_members.organization_id = organizations.id
    WHERE organization_members.user_id = $1
    ORDER BY organizations.created_at DESC
    `,
    [session.user.id]
  )

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
  const slug = createSlug(name)

  if (!name) {
    return NextResponse.json(
      { error: 'Organization name is required' },
      { status: 400 }
    )
  }

  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const existingMembershipResult = await client.query(
      `
      SELECT
        organizations.*,
        organization_members.role
      FROM organization_members
      INNER JOIN organizations
        ON organizations.id = organization_members.organization_id
      WHERE organization_members.user_id = $1
      LIMIT 1
      `,
      [session.user.id]
    )

    if (existingMembershipResult.rows[0]) {
      await client.query('COMMIT')

      return NextResponse.json(
        {
          organization: existingMembershipResult.rows[0],
          membership: {
            role: existingMembershipResult.rows[0].role,
          },
        },
        { status: 200 }
      )
    }

    const organizationResult = await client.query(
      `
      INSERT INTO organizations (name, slug)
      VALUES ($1, $2)
      RETURNING *
      `,
      [name, slug]
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

    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: 'Organization already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

function createSlug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'organization'
  )
}

function isUniqueViolation(error: unknown) {
  return (error as { code?: string }).code === '23505'
}
