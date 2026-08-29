import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

type RouteContext = {
  params: Promise<{
    invitationId: string
  }>
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { invitationId } = await context.params

  if (!invitationId) {
    return NextResponse.json(
      { error: 'Invitation id is required' },
      { status: 400 }
    )
  }

  const result = await db.query(
    `
    DELETE FROM organization_invitations
    USING organization_members
    WHERE organization_invitations.id = $1
      AND organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = $2
      AND organization_members.role IN ('owner', 'admin')
    RETURNING organization_invitations.id
    `,
    [invitationId, session.user.id]
  )

  if (!result.rows[0]) {
    return NextResponse.json(
      { error: 'Invitation not found or you do not have access to cancel it' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true })
}
