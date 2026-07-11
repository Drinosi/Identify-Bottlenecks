import { AuthPage } from '@/components/AuthPage'

type SignInPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const invite = resolvedSearchParams?.invite

  return (
    <AuthPage
      mode='sign-in'
      inviteToken={typeof invite === 'string' ? invite : null}
    />
  )
}
