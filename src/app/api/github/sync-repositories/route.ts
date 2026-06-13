import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  IntegrationSyncError,
  syncRepositoriesForUser,
} from '@/lib/integrations/sync'

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const result = await syncRepositoriesForUser(session.user.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to sync repositories',
      },
      { status: error instanceof IntegrationSyncError ? error.statusCode : 500 }
    )
  }
}
