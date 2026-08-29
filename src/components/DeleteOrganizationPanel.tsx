'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/components/ConfirmDialog'

type DeleteOrganizationPanelProps = {
  organizationName: string
  canDeleteOrganization: boolean
}

export function DeleteOrganizationPanel({
  organizationName,
  canDeleteOrganization,
}: DeleteOrganizationPanelProps) {
  const router = useRouter()
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const canSubmit =
    canDeleteOrganization && confirmation.trim() === organizationName

  async function handleDeleteOrganization() {
    setError(null)
    setIsPending(true)

    try {
      const response = await fetch('/api/organizations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationName: confirmation.trim() }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error ?? 'Unable to delete organization.')
        return
      }

      setIsConfirmOpen(false)
      router.push('/app')
      router.refresh()
    } catch {
      setError('Unable to delete organization. Refresh the page and try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <section className='rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm'>
      <h2 className='m-0 text-xl font-semibold text-red-950'>Danger zone</h2>
      <p className='mt-2 max-w-3xl text-sm leading-6 text-red-800'>
        Delete this organization and all connected GitHub data, members,
        invites, and threshold settings.
      </p>

      {canDeleteOrganization ? (
        <div className='mt-5 grid gap-3 sm:max-w-xl'>
          <label className='grid gap-1.5'>
            <span className='text-xs font-medium text-red-900'>
              Type {organizationName} to confirm
            </span>
            <input
              type='text'
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className='w-full rounded-lg border border-red-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100'
            />
          </label>
          <div>
            <button
              type='button'
              disabled={!canSubmit}
              onClick={() => setIsConfirmOpen(true)}
              className='inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50'
            >
              Delete organization
            </button>
          </div>
          {error ? <p className='m-0 text-sm text-red-800'>{error}</p> : null}
        </div>
      ) : (
        <p className='mt-5 mb-0 text-sm leading-6 text-red-800'>
          Only the organization owner can delete this organization.
        </p>
      )}

      <ConfirmDialog
        open={isConfirmOpen}
        title='Delete organization?'
        description={`This permanently deletes ${organizationName}, removes every member, and clears all connected workspace data.`}
        confirmLabel='Delete organization'
        isPending={isPending}
        tone='danger'
        onConfirm={handleDeleteOrganization}
        onCancel={() => {
          if (!isPending) {
            setIsConfirmOpen(false)
          }
        }}
      />
    </section>
  )
}
