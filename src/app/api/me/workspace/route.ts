import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getWorkspaceForUser } from '@/lib/workspace'

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  return NextResponse.json(await getWorkspaceForUser(session.user))
}
