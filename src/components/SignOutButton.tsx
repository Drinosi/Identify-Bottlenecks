'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleSignOut() {
    setIsPending(true)

    try {
      await authClient.signOut()
      router.push('/sign-in')
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      type='button'
      onClick={handleSignOut}
      disabled={isPending}
      className='inline-flex items-center justify-center rounded-full border border-clay-200 bg-clay-50 px-4 py-2.5 text-sm font-medium text-clay-600 transition hover:border-clay-300 hover:bg-clay-100 disabled:cursor-wait disabled:opacity-70'
    >
      {isPending ? 'Signing out...' : 'Sign out'}
    </button>
  )
}
