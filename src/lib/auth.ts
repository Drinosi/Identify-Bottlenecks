import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { finalizeSignUpIntent } from '@/lib/signUpIntent'

export const auth = betterAuth({
  database: db,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: ['https://sediment-harvest-patriarch.ngrok-free.dev'],
  plugins: [nextCookies()],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
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
          `Verify your email for Identify Bottlenecks by opening this link:`,
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
