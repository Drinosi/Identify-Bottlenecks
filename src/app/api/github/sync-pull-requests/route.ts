import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  IntegrationSyncError,
  syncPullRequestsForUser,
} from '@/lib/integrations/sync'

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const repositoryId =
    typeof body?.repositoryId === 'string' ? body.repositoryId : null

  try {
    const result = await syncPullRequestsForUser(session.user.id, repositoryId)

    return NextResponse.json(result)
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to sync pull requests',
      },
      { status: error instanceof IntegrationSyncError ? error.statusCode : 500 }
    )
  }
}
