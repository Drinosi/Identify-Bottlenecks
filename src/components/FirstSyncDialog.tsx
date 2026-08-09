'use client'

import { useEffect } from 'react'
import { FaCheck, FaSpinner } from 'react-icons/fa'

type FirstSyncStepStatus = 'idle' | 'loading' | 'success' | 'error'

type FirstSyncStep = {
  key: 'repositories' | 'pullRequests' | 'workflowRuns'
  label: string
  description: string
  status: FirstSyncStepStatus
}

type FirstSyncDialogProps = {
  open: boolean
  steps: FirstSyncStep[]
  hasStarted: boolean
  isPending: boolean
  error: string | null
  onStart: () => void
  onClose: () => void
}

export function FirstSyncDialog({
  open,
  steps,
  hasStarted,
  isPending,
  error,
  onStart,
  onClose,
}: FirstSyncDialogProps) {
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

  const completedSteps = steps.filter(
    (step) => step.status === 'success'
  ).length
  const isComplete =
    completedSteps === steps.length &&
    steps.every((step) => step.status === 'success')

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4'
      onClick={isPending ? undefined : onClose}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='first-sync-dialog-title'
        className='w-full max-w-xl rounded-[1.75rem] bg-white p-6 shadow-2xl sm:p-7'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className='m-0 text-sm font-semibold  text-slate-400 uppercase'>
              GitHub Connected
            </p>
            <h2
              id='first-sync-dialog-title'
              className='mt-3 text-2xl font-semibold  text-slate-950'
            >
              Sync once to unlock your metrics
            </h2>
            <p className='mt-3 text-sm leading-7 text-slate-600 sm:text-base'>
              We need one initial sync before the dashboard can show repository,
              pull request, and pipeline insights. This only takes a moment.
            </p>
          </div>
          {isComplete ? (
            <span className='rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800'>
              Ready
            </span>
          ) : null}
        </div>

        <div className='mt-6 grid gap-3'>
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={`flex items-start gap-4 rounded-lg border px-4 py-4 transition ${
                step.status === 'success'
                  ? 'border-emerald-200 bg-emerald-50'
                  : step.status === 'loading'
                    ? 'border-sky-200 bg-sky-50'
                    : step.status === 'error'
                      ? 'border-red-200 bg-red-50'
                      : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                  step.status === 'success'
                    ? 'bg-emerald-600 text-white'
                    : step.status === 'loading'
                      ? 'bg-sky-600 text-white'
                      : step.status === 'error'
                        ? 'bg-red-600 text-white'
                        : 'bg-white text-slate-500'
                }`}
              >
                {step.status === 'success' ? (
                  <FaCheck className='text-sm' />
                ) : step.status === 'loading' ? (
                  <FaSpinner className='animate-spin text-sm' />
                ) : (
                  index + 1
                )}
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center justify-between gap-3'>
                  <p className='m-0 text-sm font-semibold text-slate-950 sm:text-base'>
                    {step.label}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      step.status === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : step.status === 'loading'
                          ? 'bg-sky-100 text-sky-800'
                          : step.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-white text-slate-600'
                    }`}
                  >
                    {step.status === 'success'
                      ? 'Done'
                      : step.status === 'loading'
                        ? 'Syncing'
                        : step.status === 'error'
                          ? 'Failed'
                          : 'Waiting'}
                  </span>
                </div>
                <p className='m-0 mt-1 text-sm leading-6 text-slate-600'>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {error ? (
          <p className='mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
            {error}
          </p>
        ) : null}

        <div className='mt-6 flex flex-wrap justify-end gap-3'>
          {!isComplete ? (
            <button
              type='button'
              onClick={onClose}
              disabled={isPending}
              className='inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60'
            >
              {hasStarted ? 'Hide for now' : 'Later'}
            </button>
          ) : null}
          <button
            type='button'
            onClick={isComplete ? onClose : onStart}
            disabled={isPending}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-wait disabled:opacity-70 ${
              isComplete
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-slate-900 hover:bg-slate-700'
            }`}
          >
            {isComplete
              ? 'View dashboard'
              : isPending
                ? 'Syncing...'
                : 'Start sync'}
          </button>
        </div>
      </div>
    </div>
  )
}

export type { FirstSyncStep, FirstSyncStepStatus }
