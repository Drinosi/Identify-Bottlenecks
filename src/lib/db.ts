import { Pool } from 'pg'

declare global {
  var __dbPool: Pool | undefined
}

const connectionString = process.env.DATABASE_URL
const shouldUseRelaxedSsl =
  process.env.NODE_ENV === 'production' &&
  typeof connectionString === 'string' &&
  connectionString.length > 0

export const db =
  globalThis.__dbPool ??
  new Pool({
    connectionString,
    ssl: shouldUseRelaxedSsl
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__dbPool = db
}
