'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { Workspace } from '@/components/dashboardTypes'
import type {
  OrganizationInvitation,
  OrganizationMember,
} from '@/components/dashboardTypes'

type OrganizationMembersPanelProps = {
  initialWorkspace: Workspace
}

export function OrganizationMembersPanel({
  initialWorkspace,
}: OrganizationMembersPanelProps) {
  const [workspace, setWorkspace] = useState(initialWorkspace)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [cancelInvite, setCancelInvite] =
    useState<OrganizationInvitation | null>(null)
  const [removeMember, setRemoveMember] = useState<OrganizationMember | null>(
    null
  )
  const [isCancelPending, setIsCancelPending] = useState(false)
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null)
  const organization = workspace.organization
  const members = workspace.members
  const invitations = workspace.invitations

  const canManageMembers =
    organization?.role === 'owner' || organization?.role === 'admin'
  const canManageRoles = organization?.role === 'owner'

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
      if (data.email_status === 'sent') {
        setMessage(`Invitation email sent to ${data.invite.email}.`)
      } else {
        setError(
          data.email_status === 'logged'
            ? 'Invitation created, but email delivery is not configured. Copy the link from Pending invites to share it.'
            : 'Invitation created, but the email could not be sent. Copy the link from Pending invites, or submit the same email again to retry.'
        )
      }
      await refreshWorkspace()
    } catch {
      setError(
        'Unable to confirm the invitation. Refresh the page to check Pending invites before trying again.'
      )
    } finally {
      setIsPending(false)
    }
  }

  async function refreshWorkspace() {
    const response = await fetch('/api/me/workspace')
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      setError(data?.error ?? 'Unable to refresh organization members.')
      return
    }

    setWorkspace(data as Workspace)
  }

  async function handleCancelInvite() {
    if (!cancelInvite) {
      return
    }

    setError(null)
    setMessage(null)
    setIsCancelPending(true)

    try {
      const response = await fetch(
        `/api/organizations/invitations/${cancelInvite.id}`,
        {
          method: 'DELETE',
        }
      )
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error ?? 'Unable to cancel invitation.')
        return
      }

      setMessage(`Invitation to ${cancelInvite.email} cancelled.`)
      setCancelInvite(null)
      await refreshWorkspace()
    } catch {
      setError('Unable to cancel invitation. Refresh the page and try again.')
    } finally {
      setIsCancelPending(false)
    }
  }

  async function handleRoleChange(member: OrganizationMember, role: string) {
    setError(null)
    setMessage(null)
    setPendingMemberId(member.id)

    try {
      const response = await fetch(`/api/organizations/members/${member.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error ?? 'Unable to update member role.')
        return
      }

      setMessage(`${member.name} is now ${role}.`)
      await refreshWorkspace()
    } catch {
      setError('Unable to update member role. Refresh the page and try again.')
    } finally {
      setPendingMemberId(null)
    }
  }

  async function handleRemoveMember() {
    if (!removeMember) {
      return
    }

    setError(null)
    setMessage(null)
    setPendingMemberId(removeMember.id)

    try {
      const response = await fetch(
        `/api/organizations/members/${removeMember.id}`,
        {
          method: 'DELETE',
        }
      )
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error ?? 'Unable to remove member.')
        return
      }

      setMessage(`${removeMember.name} removed from the organization.`)
      setRemoveMember(null)
      await refreshWorkspace()
    } catch {
      setError('Unable to remove member. Refresh the page and try again.')
    } finally {
      setPendingMemberId(null)
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
                    {canManageRoles && member.role !== 'owner' ? (
                      <div className='flex shrink-0 items-center gap-2'>
                        <select
                          value={member.role}
                          disabled={pendingMemberId === member.id}
                          onChange={(event) =>
                            handleRoleChange(member, event.target.value)
                          }
                          className='rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium capitalize text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:cursor-wait disabled:opacity-60'
                        >
                          <option value='member'>Member</option>
                          <option value='admin'>Admin</option>
                        </select>
                        <button
                          type='button'
                          disabled={pendingMemberId === member.id}
                          onClick={() => setRemoveMember(member)}
                          className='rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60'
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span className='rounded-full bg-white px-2.5 py-1 text-xs font-medium capitalize text-slate-700'>
                        {member.role}
                      </span>
                    )}
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
                  <div className='mt-3 flex flex-wrap gap-2'>
                    <button
                      type='button'
                      onClick={() => copyInviteUrl(invite.invite_url)}
                      className='inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100'
                    >
                      Copy invite link
                    </button>
                    {canManageMembers ? (
                      <button
                        type='button'
                        onClick={() => setCancelInvite(invite)}
                        className='inline-flex rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50'
                      >
                        Cancel invite
                      </button>
                    ) : null}
                  </div>
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
              className='w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100'
              required
            />
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as 'member' | 'admin')
              }
              className='rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'
            >
              <option value='member'>Member</option>
              <option value='admin'>Admin</option>
            </select>
            <button
              type='submit'
              disabled={isPending}
              className='inline-flex items-center justify-center rounded-lg bg-brand-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-wait disabled:opacity-70'
            >
              {isPending ? 'Sending invitation...' : 'Send invitation'}
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
      <ConfirmDialog
        open={Boolean(cancelInvite)}
        title='Cancel invitation?'
        description={
          cancelInvite
            ? `The invite link for ${cancelInvite.email} will stop working immediately.`
            : ''
        }
        confirmLabel='Cancel invite'
        isPending={isCancelPending}
        tone='danger'
        onConfirm={handleCancelInvite}
        onCancel={() => {
          if (!isCancelPending) {
            setCancelInvite(null)
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(removeMember)}
        title='Remove member?'
        description={
          removeMember
            ? `${removeMember.name} will lose access to this organization immediately.`
            : ''
        }
        confirmLabel='Remove member'
        isPending={Boolean(removeMember && pendingMemberId === removeMember.id)}
        tone='danger'
        onConfirm={handleRemoveMember}
        onCancel={() => {
          if (!pendingMemberId) {
            setRemoveMember(null)
          }
        }}
      />
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
