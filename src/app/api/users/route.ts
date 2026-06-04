import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
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
