import { Pool } from 'pg'

declare global {
  var __dbPool: Pool | undefined
}

export const db =
  globalThis.__dbPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__dbPool = db
}
