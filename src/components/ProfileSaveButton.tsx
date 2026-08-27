'use client'

import { useFormStatus } from 'react-dom'

export function ProfileSaveButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type='submit'
      disabled={pending}
      className='inline-flex items-center justify-center rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-wait disabled:opacity-70'
    >
      {pending ? 'Saving...' : 'Save changes'}
    </button>
  )
}
