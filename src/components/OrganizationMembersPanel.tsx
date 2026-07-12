'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Workspace } from '@/components/dashboardTypes'

type OrganizationMembersPanelProps = {
  organization: Workspace['organization']
  members: Workspace['members']
  invitations: Workspace['invitations']
  onRefreshWorkspace: () => Promise<void>
}

export function OrganizationMembersPanel({
  organization,
  members,
  invitations,
  onRefreshWorkspace,
}: OrganizationMembersPanelProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const canManageMembers =
    organization?.role === 'owner' || organization?.role === 'admin'

  async function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setIsPending(true)

    try {
      const response = await fetch('/api/organizations/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error ?? 'Unable to create invitation.')
        return
      }

      setEmail('')
      setRole('member')
      setMessage(`Invite created for ${data.invite.email}.`)
      await copyInviteUrl(data.invite.invite_url)
      await onRefreshWorkspace()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <section className='rounded-lg bg-white p-6'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h2 className='m-0 text-xl font-semibold'>People</h2>
          <p className='mt-2 text-sm text-slate-600'>
            Invite developers into {organization?.name ?? 'your organization'}.
          </p>
        </div>
        <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700'>
          {members.length} members
        </span>
      </div>

      <div className='mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
        <div className='rounded-lg border border-slate-200 p-4'>
          <h3 className='m-0 text-sm font-semibold text-slate-900'>Members</h3>
          <div className='mt-3 grid gap-3'>
            {members.length ? (
              members.map((member) => (
                <div
                  key={member.id}
                  className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'
                >
                  <div className='flex items-center justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='m-0 truncate text-sm font-medium text-slate-900'>
                        {member.name}
                      </p>
                      <p className='m-0 truncate text-xs text-slate-500'>
                        {member.email}
                      </p>
                    </div>
                    <span className='rounded-full bg-white px-2.5 py-1 text-xs font-medium capitalize text-slate-700'>
                      {member.role}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className='m-0 text-sm text-slate-500'>No members yet.</p>
            )}
          </div>
        </div>

        <div className='rounded-lg border border-slate-200 p-4'>
          <h3 className='m-0 text-sm font-semibold text-slate-900'>
            Pending invites
          </h3>
          <div className='mt-3 grid gap-3'>
            {invitations.length ? (
              invitations.map((invite) => (
                <div
                  key={invite.id}
                  className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'
                >
                  <div className='flex items-center justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='m-0 truncate text-sm font-medium text-slate-900'>
                        {invite.email}
                      </p>
                      <p className='m-0 text-xs text-slate-500'>
                        Expires {formatDateTime(invite.expires_at)}
                      </p>
                    </div>
                    <span className='rounded-full bg-white px-2.5 py-1 text-xs font-medium capitalize text-slate-700'>
                      {invite.role}
                    </span>
                  </div>
                  <button
                    type='button'
                    onClick={() => copyInviteUrl(invite.invite_url)}
                    className='mt-3 inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100'
                  >
                    Copy invite link
                  </button>
                </div>
              ))
            ) : (
              <p className='m-0 text-sm text-slate-500'>
                No pending invitations.
              </p>
            )}
          </div>
        </div>
      </div>

      {canManageMembers ? (
        <form onSubmit={handleInviteSubmit} className='mt-5 grid gap-3'>
          <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]'>
            <input
              type='email'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className='w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200'
              required
            />
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as 'member' | 'admin')
              }
              className='rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200'
            >
              <option value='member'>Member</option>
              <option value='admin'>Admin</option>
            </select>
            <button
              type='submit'
              disabled={isPending}
              className='inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-70'
            >
              {isPending ? 'Inviting...' : 'Invite member'}
            </button>
          </div>
          {message ? (
            <p className='m-0 text-sm text-emerald-700'>{message}</p>
          ) : null}
          {error ? <p className='m-0 text-sm text-red-700'>{error}</p> : null}
        </form>
      ) : (
        <p className='mt-5 mb-0 text-sm text-slate-600'>
          Only organization owners and admins can invite members.
        </p>
      )}
    </section>
  )
}

async function copyInviteUrl(inviteUrl: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return
  }

  try {
    await navigator.clipboard.writeText(inviteUrl)
  } catch {
    // Best-effort clipboard support.
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
