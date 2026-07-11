import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token.trim() : ''

  if (!token) {
    return NextResponse.json(
      { error: 'Invitation token is required' },
      { status: 400 }
    )
  }

  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const inviteResult = await client.query(
      `
      SELECT
        organization_invitations.id,
        organization_invitations.organization_id,
        organization_invitations.email,
        organization_invitations.role,
        organization_invitations.expires_at,
        organization_invitations.accepted_at,
        organizations.name AS organization_name
      FROM organization_invitations
      INNER JOIN organizations
        ON organizations.id = organization_invitations.organization_id
      WHERE organization_invitations.token = $1
      LIMIT 1
      `,
      [token]
    )

    const invite = inviteResult.rows[0]

    if (!invite) {
      await client.query('ROLLBACK')

      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    if (invite.accepted_at) {
      await client.query('ROLLBACK')

      return NextResponse.json(
        { error: 'This invitation has already been used' },
        { status: 409 }
      )
    }

    if (new Date(invite.expires_at) <= new Date()) {
      await client.query('ROLLBACK')

      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      )
    }

    if (session.user.email.toLowerCase() !== invite.email) {
      await client.query('ROLLBACK')

      return NextResponse.json(
        {
          error: `This invitation is for ${invite.email}. Sign in with that email to accept it.`,
        },
        { status: 403 }
      )
    }

    const existingMembershipResult = await client.query(
      `
      SELECT
        organization_members.organization_id,
        organizations.name
      FROM organization_members
      INNER JOIN organizations
        ON organizations.id = organization_members.organization_id
      WHERE organization_members.user_id = $1
      LIMIT 1
      `,
      [session.user.id]
    )

    const existingMembership = existingMembershipResult.rows[0]

    if (
      existingMembership &&
      existingMembership.organization_id !== invite.organization_id
    ) {
      await client.query('ROLLBACK')

      return NextResponse.json(
        {
          error: `You already belong to ${existingMembership.name}. Leave that organization before joining another one.`,
        },
        { status: 409 }
      )
    }

    await client.query(
      `
      INSERT INTO organization_members (organization_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (organization_id, user_id)
      DO UPDATE SET role = EXCLUDED.role
      `,
      [invite.organization_id, session.user.id, invite.role]
    )

    await client.query(
      `
      UPDATE organization_invitations
      SET accepted_at = NOW()
      WHERE id = $1
      `,
      [invite.id]
    )

    await client.query(
      `
      DELETE FROM organization_invitations
      WHERE id = $1
      `,
      [invite.id]
    )

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      organization: {
        id: invite.organization_id,
        name: invite.organization_name,
      },
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(error)

    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
