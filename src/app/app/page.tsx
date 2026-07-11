import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getWorkspaceForUser } from '@/lib/workspace'
import { DashboardPage } from '@/components/DashboardPage'

type AppPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function AppPage({ searchParams }: AppPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const workspace = await getWorkspaceForUser(session.user)
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const githubStatusParam = resolvedSearchParams?.github
  const initialGithubStatus =
    typeof githubStatusParam === 'string' ? githubStatusParam : null

  return (
    <DashboardPage
      initialWorkspace={workspace}
      initialGithubStatus={initialGithubStatus}
    />
  )
}
