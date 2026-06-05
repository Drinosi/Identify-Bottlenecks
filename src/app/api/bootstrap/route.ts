import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const userResult = await client.query(
      `
      SELECT *
      FROM "user"
      ORDER BY "createdAt" ASC
      LIMIT 1
      `
    )

    if (!userResult.rows[0]) {
      await client.query('ROLLBACK')

      return NextResponse.json(
        { error: 'Create an auth user before bootstrapping data' },
        { status: 400 }
      )
    }

    const orgResult = await client.query(
      `
      INSERT INTO organizations (name)
      VALUES ($1)
      RETURNING *
      `,
      ['Bottleneck Test Org']
    )

    const memberResult = await client.query(
      `
      INSERT INTO organization_members (organization_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [orgResult.rows[0].id, userResult.rows[0].id, 'owner']
    )

    await client.query('COMMIT')

    return NextResponse.json({
      user: userResult.rows[0],
      organization: orgResult.rows[0],
      membership: memberResult.rows[0],
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(error)

    return NextResponse.json(
      { error: 'Failed to bootstrap data' },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
