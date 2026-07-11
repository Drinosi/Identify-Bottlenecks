import { AuthPage } from '@/components/AuthPage'

type SignUpPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const invite = resolvedSearchParams?.invite

  return (
    <AuthPage
      mode='sign-up'
      inviteToken={typeof invite === 'string' ? invite : null}
    />
  )
}
