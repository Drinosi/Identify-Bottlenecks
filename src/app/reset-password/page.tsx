import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/ResetPasswordForm'

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = {
  title: 'Reset password',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const token = resolvedSearchParams?.token
  const error = resolvedSearchParams?.error

  return (
    <ResetPasswordForm
      token={typeof token === 'string' ? token : null}
      hasInvalidToken={error === 'INVALID_TOKEN'}
    />
  )
}
