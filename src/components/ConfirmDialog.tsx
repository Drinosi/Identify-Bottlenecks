'use client'

import { useEffect } from 'react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  isPending?: boolean
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  isPending = false,
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const { body } = document
    const previousOverflow = body.style.overflow

    body.style.overflow = 'hidden'

    return () => {
      body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4'
      onClick={isPending ? undefined : onCancel}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='confirm-dialog-title'
        className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id='confirm-dialog-title'
          className='m-0 text-xl font-semibold text-slate-950'
        >
          {title}
        </h2>
        <p className='mt-3 text-sm leading-6 text-slate-600'>{description}</p>
        <div className='mt-6 flex justify-end gap-3'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isPending}
            className='inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60'
          >
            {cancelLabel}
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={isPending}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-wait disabled:opacity-70 ${
              tone === 'danger'
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-slate-900 hover:bg-slate-700'
            }`}
          >
            {isPending ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
