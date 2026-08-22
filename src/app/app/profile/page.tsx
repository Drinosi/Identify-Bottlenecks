import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ProfileSaveButton } from '@/components/ProfileSaveButton'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

type ProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const result = await db.query(
    `
    SELECT
      "user".id,
      "user".name,
      "user".email,
      "user"."emailVerified",
      "user"."createdAt"
    FROM "user"
    WHERE "user".id = $1
    LIMIT 1
    `,
    [session.user.id]
  )

  const profile = result.rows[0]
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const status =
    typeof resolvedSearchParams?.status === 'string'
      ? resolvedSearchParams.status
      : null

  return (
    <main className='overflow-x-hidden px-4 py-6 text-slate-900 sm:px-6 sm:py-8'>
      <div className='mx-auto grid max-w-4xl min-w-0 gap-6'>
        <header className='min-w-0'>
          <Link
            href='/app'
            className='text-sm font-medium text-slate-500 underline'
          >
            Back to workspace
          </Link>
          <h1 className='mt-3 max-w-full break-words text-3xl font-semibold'>
            Profile settings
          </h1>
          <p className='mt-2 text-slate-500'>
            Manage the personal details associated with your account.
          </p>
        </header>

        {status === 'updated' ? (
          <section className='rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800'>
            Profile updated.
          </section>
        ) : null}

        {status === 'error' ? (
          <section className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800'>
            Please enter a valid name.
          </section>
        ) : null}

        <section className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]'>
          <section className='rounded-lg bg-white p-6 shadow-sm'>
            <div>
              <h2 className='m-0 text-xl font-semibold'>Account Details</h2>
              <p className='mt-2 text-sm leading-6 text-slate-600'>
                Update the display name shown across your workspace.
              </p>
            </div>

            <form action={updateProfileAction} className='mt-6 grid gap-4'>
              <label className='grid gap-1.5'>
                <span className='text-sm font-medium text-slate-700'>Name</span>
                <input
                  name='name'
                  type='text'
                  defaultValue={profile?.name ?? ''}
                  required
                  className='w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200'
                />
              </label>
              <label className='grid gap-1.5'>
                <span className='text-sm font-medium text-slate-700'>
                  Email
                </span>
                <input
                  type='email'
                  value={profile?.email ?? session.user.email}
                  readOnly
                  className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-500 outline-none'
                />
              </label>
              <div className='pt-2'>
                <ProfileSaveButton />
              </div>
            </form>
          </section>

          <aside className='grid gap-6'>
            <section className='rounded-lg bg-white p-6 shadow-sm'>
              <h2 className='m-0 text-lg font-semibold'>Account status</h2>
              <dl className='mt-4 grid gap-4 text-sm'>
                <div>
                  <dt className='text-slate-500'>Email verified</dt>
                  <dd className='mt-1'>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        profile?.emailVerified
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {profile?.emailVerified ? 'Verified' : 'Not verified'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className='text-slate-500'>Account created</dt>
                  <dd className='mt-1 font-medium text-slate-900'>
                    {profile?.createdAt
                      ? formatDate(profile.createdAt as string)
                      : 'Unknown'}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}

async function updateProfileAction(formData: FormData) {
  'use server'

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const name = String(formData.get('name') ?? '').trim()

  if (!name) {
    redirect('/app/profile?status=error')
  }

  await db.query(
    `
      UPDATE "user"
      SET
        name = $2,
        "updatedAt" = NOW()
        WHERE id = $1
  `,
    [session.user.id, name]
  )

  revalidatePath('/app')
  revalidatePath('/app/profile')
  redirect('/app/profile?status=updated')
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(value))
}
