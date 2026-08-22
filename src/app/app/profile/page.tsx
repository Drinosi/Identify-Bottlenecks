import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  metricThresholdFieldNames,
  metricThresholdGroups,
  parseMetricThresholdFormData,
  resolveMetricThresholdValues,
  type MetricThresholdFieldName,
  type MetricThresholdOverrides,
} from '@/lib/metricThresholds'
import { ProfileSaveButton } from '@/components/ProfileSaveButton'

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

  const organizationResult = await db.query(
    `
    SELECT thresholds.*
    FROM organization_members AS members
    LEFT JOIN organization_metric_thresholds AS thresholds
      ON thresholds.organization_id = members.organization_id
    WHERE members.user_id = $1
    LIMIT 1
    `,
    [session.user.id]
  )

  const thresholdValues = resolveMetricThresholdValues(
    organizationResult.rows[0] as MetricThresholdOverrides | undefined
  )

  const result = await db.query(
    `
    SELECT
      "user".id,
      "user".name,
      "user".email,
      "user"."emailVerified",
      "user"."createdAt",
      organizations.name AS organization_name,
      organization_members.role AS organization_role
    FROM "user"
    LEFT JOIN organization_members
      ON organization_members.user_id = "user".id
    LEFT JOIN organizations
      ON organizations.id = organization_members.organization_id
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
      <div className='mx-auto grid max-w-screen-xl min-w-0 gap-6'>
        <header className='min-w-0'>
          <Link
            href='/app'
            className='text-sm font-medium text-slate-500 underline'
          >
            Back to workspace
          </Link>
          <h1 className='mt-3 max-w-full break-words text-3xl font-semibold '>
            Profile and Organization settings
          </h1>
          <p className='mt-2 text-slate-500'>
            Manage your account details and see the workspace you belong to.
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

        {status === 'threshold-updated' ? (
          <section className='rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800'>
            Organization thresholds updated.
          </section>
        ) : null}

        {status === 'threshold-error' ? (
          <section className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800'>
            Enter whole numbers and keep each warning value below its critical
            value.
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
              <h2 className='m-0 text-lg font-semibold'>Workspace</h2>
              <dl className='mt-4 grid gap-4 text-sm'>
                <div>
                  <dt className='text-slate-500'>Organization</dt>
                  <dd className='mt-1 font-medium text-slate-900'>
                    {profile?.organization_name ?? 'Not assigned'}
                  </dd>
                </div>
                <div>
                  <dt className='text-slate-500'>Role</dt>
                  <dd className='mt-1'>
                    <span className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700'>
                      {profile?.organization_role ?? 'none'}
                    </span>
                  </dd>
                </div>
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
                  <dt className='text-slate-500'>Joined</dt>
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
        {profile?.organization_role === 'owner' ||
        profile?.organization_role === 'admin' ? (
          <section className='rounded-lg bg-white p-6 shadow-sm'>
            <h2 className='m-0 text-xl font-semibold'>
              Organization thresholds
            </h2>
            <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-600'>
              Choose how long work can wait before it is highlighted on the
              dashboard. These settings apply to everyone in this organization.
            </p>

            <div className='mt-5 grid gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950'>
              <p className='m-0'>
                <strong>Below warning:</strong> the metric is healthy.
              </p>
              <p className='m-0'>
                <strong>At warning:</strong> the metric needs attention.
              </p>
              <p className='m-0'>
                <strong>At critical:</strong> the metric is marked as a
                bottleneck.
              </p>
              <p className='m-0 text-sky-800'>
                Hour values measure elapsed time. Percentage values measure how
                much slower a metric is than its recent baseline. Warning must
                always be lower than critical.
              </p>
            </div>

            <form
              action={updateOrganizationSettingsAction}
              className='mt-8 grid gap-8'
            >
              {metricThresholdGroups.map((group) => (
                <fieldset key={group.title} className='grid gap-5'>
                  <legend className='text-lg font-semibold text-slate-950'>
                    {group.title}
                  </legend>
                  <p className='mt-4 text-sm text-slate-500'>
                    {group.description}
                  </p>

                  <div className='grid gap-4 lg:grid-cols-2'>
                    {group.thresholds.map((threshold) => (
                      <div
                        key={threshold.label}
                        className='rounded-xl border border-slate-200 p-4'
                      >
                        <h3 className='m-0 text-sm font-semibold text-slate-900'>
                          {threshold.label}
                        </h3>
                        <p className='mt-1 text-sm leading-5 text-slate-500'>
                          {threshold.description}
                        </p>
                        <div className='mt-4 grid gap-4 xl:grid-cols-2'>
                          <ThresholdInput
                            name={threshold.warning.name}
                            label='Warning starts at'
                            unit={threshold.unit}
                            defaultValue={
                              thresholdValues[threshold.warning.name]
                            }
                            minimum={threshold.unit === 'percent' ? 0 : 1}
                          />
                          <ThresholdInput
                            name={threshold.critical.name}
                            label='Critical starts at'
                            unit={threshold.unit}
                            defaultValue={
                              thresholdValues[threshold.critical.name]
                            }
                            minimum={1}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </fieldset>
              ))}

              <div className='pt-2'>
                <ProfileSaveButton />
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </main>
  )
}

async function updateOrganizationSettingsAction(formData: FormData) {
  'use server'

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const thresholdValues = parseMetricThresholdFormData(formData)

  if (!thresholdValues) {
    redirect('/app/profile?status=threshold-error')
  }

  const columns = metricThresholdFieldNames.join(', ')
  const placeholders = metricThresholdFieldNames
    .map((_, index) => `$${index + 2}`)
    .join(', ')
  const updates = metricThresholdFieldNames
    .map((name) => `${name} = EXCLUDED.${name}`)
    .join(', ')
  const result = await db.query(
    `
    INSERT INTO organization_metric_thresholds (
      organization_id,
      ${columns}
    )
    SELECT
      organization_id,
      ${placeholders}
    FROM organization_members
    WHERE user_id = $1
      AND role IN ('owner', 'admin')
    LIMIT 1
    ON CONFLICT (organization_id)
    DO UPDATE SET
      ${updates},
      updated_at = NOW()
    `,
    [
      session.user.id,
      ...metricThresholdFieldNames.map((name) => thresholdValues[name]),
    ]
  )

  if (!result.rowCount) {
    redirect('/app/profile?status=threshold-error')
  }

  revalidatePath('/app/profile')
  revalidatePath('/app')
  redirect('/app/profile?status=threshold-updated')
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

function ThresholdInput({
  name,
  label,
  unit,
  defaultValue,
  minimum,
}: {
  name: MetricThresholdFieldName
  label: string
  unit: string
  defaultValue: number
  minimum: number
}) {
  return (
    <label className='grid gap-1.5'>
      <span className='text-xs font-medium text-slate-600'>{label}</span>
      <div className='flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200'>
        <input
          name={name}
          type='number'
          min={minimum}
          step={1}
          required
          defaultValue={defaultValue}
          className='number-input-no-spinner min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none'
        />
        <span className='pr-3 text-xs text-slate-400'>{unit}</span>
      </div>
    </label>
  )
}
