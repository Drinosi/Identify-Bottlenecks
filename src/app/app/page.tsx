import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getWorkspaceForUser } from '@/lib/workspace'
import { DashboardPage } from '@/components/DashboardPage'

export default async function AppPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const workspace = await getWorkspaceForUser(session.user)

  return <DashboardPage initialWorkspace={workspace} />
}
