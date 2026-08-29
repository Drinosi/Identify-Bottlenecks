import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const ASSIGNABLE_ROLES = new Set(['admin', 'member'])

type RouteContext = {
  params: Promise<{
    memberId: string
  }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { memberId } = await context.params
  const body = await request.json().catch(() => null)
  const role = typeof body?.role === 'string' ? body.role : ''

  if (!memberId) {
    return NextResponse.json(
      { error: 'Member id is required' },
      { status: 400 }
    )
  }

  if (!ASSIGNABLE_ROLES.has(role)) {
    return NextResponse.json(
      { error: 'Members can only be changed to admin or member' },
      { status: 400 }
    )
  }

  const result = await db.query(
    `
    UPDATE organization_members AS target_member
    SET role = $1
    FROM organization_members AS current_member
    WHERE target_member.id = $2
      AND current_member.organization_id = target_member.organization_id
      AND current_member.user_id = $3
      AND current_member.role = 'owner'
      AND target_member.role <> 'owner'
    RETURNING target_member.id, target_member.role
    `,
    [role, memberId, session.user.id]
  )

  if (!result.rows[0]) {
    return NextResponse.json(
      { error: 'Member not found or you do not have access to edit them' },
      { status: 404 }
    )
  }

  return NextResponse.json({ member: result.rows[0] })
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { memberId } = await context.params

  if (!memberId) {
    return NextResponse.json(
      { error: 'Member id is required' },
      { status: 400 }
    )
  }

  const result = await db.query(
    `
    DELETE FROM organization_members AS target_member
    USING organization_members AS current_member
    WHERE target_member.id = $1
      AND current_member.organization_id = target_member.organization_id
      AND current_member.user_id = $2
      AND current_member.role = 'owner'
      AND target_member.role <> 'owner'
    RETURNING target_member.id
    `,
    [memberId, session.user.id]
  )

  if (!result.rows[0]) {
    return NextResponse.json(
      { error: 'Member not found or you do not have access to remove them' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true })
}
