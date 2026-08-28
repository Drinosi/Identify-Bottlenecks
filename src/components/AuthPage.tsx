import Link from 'next/link'
import { headers } from 'next/headers'
import { AuthForm } from '@/components/AuthForm'
import { auth } from '@/lib/auth'
import { SignedInAccount } from '@/components/SignedInAccount'

type AuthPageProps = {
  mode: 'sign-in' | 'sign-up'
  inviteToken?: string | null
}

export async function AuthPage({ mode, inviteToken }: AuthPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return (
    <main className='grid min-h-screen place-items-center auth-background px-6 py-12'>
      <section className='grid w-full max-w-md gap-4 rounded-2xl border border-violet-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.06)]'>
        <Link href='/' className='w-fit text-sm font-semibold text-brand-700'>
          Bottlenecks
        </Link>
        {session?.user ? (
          <SignedInAccount
            email={session.user.email}
            inviteToken={inviteToken}
          />
        ) : (
          <>
            <h1 className='m-0 text-3xl font-semibold text-slate-900'>
              {mode === 'sign-in' ? 'Sign in' : 'Create your account'}
            </h1>
            <p className='m-0 text-base leading-7 text-slate-600'>
              {mode === 'sign-in'
                ? 'Access your workspace to review team bottlenecks, repositories, and delivery signals.'
                : 'Create your workspace to start tracking engineering bottlenecks across your team.'}
            </p>
            <AuthForm mode={mode} inviteToken={inviteToken} />
            <p className='m-0 text-sm text-slate-600'>
              {mode === 'sign-in'
                ? 'Need an account? '
                : 'Already have an account? '}
              <Link
                href={`${mode === 'sign-in' ? '/sign-up' : '/sign-in'}${inviteToken ? `?invite=${encodeURIComponent(inviteToken)}` : ''}`}
                className='font-medium text-brand-700 underline decoration-brand-300 underline-offset-4'
              >
                {mode === 'sign-in' ? 'Create one' : 'Sign in'}
              </Link>
            </p>
          </>
        )}
      </section>
    </main>
  )
}
