import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/lib/db'

const trustedOrigins = Array.from(
  new Set(
    [
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : null,
      process.env.VERCEL_BRANCH_URL
        ? `https://${process.env.VERCEL_BRANCH_URL}`
        : null,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ].filter((value): value is string => Boolean(value))
  )
)

export const auth = betterAuth({
  database: db,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  plugins: [nextCookies()],
  emailAndPassword: {
    enabled: true,
  },
})
