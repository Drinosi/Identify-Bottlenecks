import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const result = await db.query(
    `
    SELECT 1
    FROM "user"
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
    `,
    [email]
  )

  return NextResponse.json({
    available: !result.rows[0],
  })
}
