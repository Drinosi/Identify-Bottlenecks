import { EmailVerificationPage } from '@/components/EmailVerificationPage'

type CheckEmailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function CheckEmailPage({
  searchParams,
}: CheckEmailPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const email = resolvedSearchParams?.email
  const invite = resolvedSearchParams?.invite
  const callbackURL =
    typeof invite === 'string' && invite
      ? `/app?invite=${encodeURIComponent(invite)}`
      : '/app'

  return (
    <EmailVerificationPage
      email={typeof email === 'string' ? email : null}
      callbackURL={callbackURL}
    />
  )
}
