import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { finalizeSignUpIntent } from '@/lib/signUpIntent'

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    await finalizeSignUpIntent(session.user.email, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Failed to finalize sign-up' },
      { status: 500 }
    )
  }
}
