import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { finalizeSignUpIntent } from '@/lib/signUpIntent'

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
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    async sendResetPassword({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: 'Reset your Identify Bottlenecks password',
        text: [
          'Reset your Identify Bottlenecks password by opening this link:',
          url,
          'This link expires in one hour. If you did not request a password reset, you can ignore this email.',
        ].join('\n\n'),
        html: `
          <div style="font-family: sans-serif; line-height: 1.5; color: #0f172a;">
            <h1 style="font-size: 20px;">Reset your password</h1>
            <p>We received a request to reset your Identify Bottlenecks password.</p>
            <p>
              <a href="${url}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 12px 18px; border-radius: 10px; text-decoration: none;">
                Reset password
              </a>
            </p>
            <p>This link expires in one hour.</p>
            <p>If the button does not work, copy and paste this link into your browser:</p>
            <p><a href="${url}">${url}</a></p>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
          </div>
        `,
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    async sendVerificationEmail({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: 'Verify your Identify Bottlenecks account',
        text: [
          'Verify your email for Identify Bottlenecks by opening this link:',
          url,
        ].join('\n\n'),
        html: `
          <div style="font-family: sans-serif; line-height: 1.5; color: #0f172a;">
            <h1 style="font-size: 20px;">Verify your email</h1>
            <p>Finish setting up your Identify Bottlenecks account by verifying your email address.</p>
            <p>
              <a href="${url}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 12px 18px; border-radius: 10px; text-decoration: none;">
                Verify email
              </a>
            </p>
            <p>If the button does not work, copy and paste this link into your browser:</p>
            <p><a href="${url}">${url}</a></p>
          </div>
        `,
      })
    },
    async afterEmailVerification(user) {
      await finalizeSignUpIntent(user.email, user.id)
    },
  },
})
