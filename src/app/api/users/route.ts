import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const result = await db.query(`
    SELECT
      id,
      name,
      email,
      "emailVerified",
      image,
      "createdAt",
      "updatedAt"
    FROM "user"
    ORDER BY "createdAt" DESC
  `)

  return NextResponse.json(result.rows)
}
