import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSignUpIntent } from '@/lib/signUpIntent'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = normalizeEmail(body?.email)
  const organizationName =
    typeof body?.organizationName === 'string'
      ? body.organizationName.trim()
      : ''
  const inviteToken =
    typeof body?.inviteToken === 'string' ? body.inviteToken.trim() : ''

  if (!email) {
    return NextResponse.json(
      { error: 'A valid email address is required' },
      { status: 400 }
    )
  }

  if (!organizationName && !inviteToken) {
    return NextResponse.json(
      { error: 'Organization setup details are required' },
      { status: 400 }
    )
  }

  if (inviteToken) {
    const inviteResult = await db.query(
      `
      SELECT
        email,
        expires_at
      FROM organization_invitations
      WHERE token = $1
      LIMIT 1
      `,
      [inviteToken]
    )

    const invite = inviteResult.rows[0]

    if (!invite) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    if (new Date(invite.expires_at) <= new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      )
    }

    if (invite.email.toLowerCase() !== email) {
      return NextResponse.json(
        {
          error: `This invitation is for ${invite.email}. Use that email address to sign up.`,
        },
        { status: 403 }
      )
    }
  }

  if (!inviteToken && !organizationName) {
    return NextResponse.json(
      { error: 'Organization name is required' },
      { status: 400 }
    )
  }

  await createSignUpIntent({
    email,
    organizationName: organizationName || null,
    inviteToken: inviteToken || null,
  })

  return NextResponse.json({ success: true })
}

function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  const normalized = value.trim().toLowerCase()

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : ''
}
