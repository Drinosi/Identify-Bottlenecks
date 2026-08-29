import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendInvitationEmail } from '@/lib/invitationEmail'

const INVITABLE_ROLES = new Set(['admin', 'member'])

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const membershipResult = await db.query(
    `
    SELECT
      organization_members.organization_id,
      organization_members.role,
      organizations.name AS organization_name
    FROM organization_members
    INNER JOIN organizations
      ON organizations.id = organization_members.organization_id
    WHERE organization_members.user_id = $1
      AND organization_members.role IN ('owner', 'admin')
    LIMIT 1
    `,
    [session.user.id]
  )

  const membership = membershipResult.rows[0]

  if (!membership) {
    return NextResponse.json(
      { error: 'Only organization owners and admins can invite members' },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => null)
  const email = normalizeEmail(body?.email)
  const role = typeof body?.role === 'string' ? body.role : 'member'

  if (!email) {
    return NextResponse.json(
      { error: 'A valid email address is required' },
      { status: 400 }
    )
  }

  if (!INVITABLE_ROLES.has(role)) {
    return NextResponse.json(
      { error: 'Invites can only assign admin or member roles' },
      { status: 400 }
    )
  }

  const existingMemberResult = await db.query(
    `
    SELECT
      "user".id
    FROM organization_members
    INNER JOIN "user"
      ON "user".id = organization_members.user_id
    WHERE organization_members.organization_id = $1
      AND LOWER("user".email) = $2
    LIMIT 1
    `,
    [membership.organization_id, email]
  )

  if (existingMemberResult.rows[0]) {
    return NextResponse.json(
      { error: 'That user is already a member of this organization' },
      { status: 409 }
    )
  }

  const token = randomUUID()
  const inviteResult = await db.query(
    `
    INSERT INTO organization_invitations (
      organization_id,
      email,
      role,
      token,
      invited_by_user_id,
      expires_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days')
    ON CONFLICT (organization_id, email)
    DO UPDATE SET
      role = EXCLUDED.role,
      token = EXCLUDED.token,
      invited_by_user_id = EXCLUDED.invited_by_user_id,
      expires_at = EXCLUDED.expires_at,
      accepted_at = NULL,
      created_at = NOW()
    RETURNING
      id,
      email,
      role,
      token,
      expires_at,
      created_at
    `,
    [membership.organization_id, email, role, token, session.user.id]
  )

  const baseUrl = process.env.BETTER_AUTH_URL ?? new URL(request.url).origin
  const invite = inviteResult.rows[0]
  const inviteUrl = new URL('/join', baseUrl)
  inviteUrl.searchParams.set('invite', invite.token)
  let emailStatus: 'sent' | 'logged' | 'failed' = 'failed'

  try {
    const delivery = await sendInvitationEmail({
      to: invite.email,
      organizationName: membership.organization_name,
      inviterName: session.user.name || session.user.email,
      role: invite.role,
      inviteUrl: inviteUrl.toString(),
    })
    emailStatus = delivery.status
  } catch {
    // Keep the saved invitation usable without logging its secret token.
    console.error('Invitation email delivery failed', {
      invitationId: invite.id,
    })
  }

  return NextResponse.json(
    {
      email_status: emailStatus,
      invite: {
        ...invite,
        invite_url: inviteUrl.toString(),
        organization_name: membership.organization_name,
      },
    },
    { status: 201 }
  )
}

function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  const normalized = value.trim().toLowerCase()

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : ''
}
