import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { JoinOrganizationCard } from '@/components/JoinOrganizationCard'

type JoinPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const inviteToken = resolvedSearchParams?.invite
  const token = typeof inviteToken === 'string' ? inviteToken : ''

  if (!token) {
    return <JoinErrorCard message='Invitation link is missing a token.' />
  }

  const inviteResult = await db.query(
    `
    SELECT
      organization_invitations.email,
      organization_invitations.role,
      organization_invitations.expires_at,
      organizations.name AS organization_name
    FROM organization_invitations
    INNER JOIN organizations
      ON organizations.id = organization_invitations.organization_id
    WHERE organization_invitations.token = $1
    LIMIT 1
    `,
    [token]
  )

  const invite = inviteResult.rows[0]

  if (!invite) {
    return <JoinErrorCard message='This invitation is no longer available.' />
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return (
    <JoinOrganizationCard
      inviteToken={token}
      inviteEmail={invite.email}
      organizationName={invite.organization_name}
      inviteRole={invite.role}
      isAuthenticated={Boolean(session?.user)}
      sessionEmail={session?.user?.email ?? null}
      isExpired={new Date(invite.expires_at) <= new Date()}
    />
  )
}

function JoinErrorCard({ message }: { message: string }) {
  return (
    <main className='grid min-h-screen place-items-center px-6 py-12'>
      <section className='grid w-full max-w-md gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm'>
        <p className='m-0 text-sm font-semibold text-slate-600'>
          Identify Bottlenecks
        </p>
        <h1 className='m-0 text-3xl font-semibold tracking-tight text-slate-900'>
          Invitation unavailable
        </h1>
        <p className='m-0 text-base leading-7 text-slate-600'>{message}</p>
      </section>
    </main>
  )
}
