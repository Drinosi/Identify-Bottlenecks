import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const result = await db.query(`
    SELECT *
    FROM organizations
    ORDER BY created_at DESC
  `)

  return NextResponse.json(result.rows)
}

export async function POST() {
  const result = await db.query(
    `
    INSERT INTO organizations (name)
    VALUES ($1)
    RETURNING *
    `,
    ['Acme Inc']
  )

  return NextResponse.json(result.rows[0])
}
