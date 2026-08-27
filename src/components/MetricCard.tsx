import Link from 'next/link'
import type { ReactNode } from 'react'
import { HiOutlineArrowTopRightOnSquare } from 'react-icons/hi2'
import type { MetricStatus } from '@/lib/evaluateMetricStatus'
import { getMetricStatusLabel } from '@/lib/evaluateMetricStatus'

type MetricCardProps = {
  label: string
  value: string | number
  detail: string
  icon?: ReactNode
  status?: MetricStatus
  href?: string
}

export function MetricCard({
  label,
  value,
  detail,
  icon,
  status,
  href,
}: MetricCardProps) {
  const resolvedStatus = status ?? 'unknown'
  const content = (
    <section
      className={`h-full min-w-0 rounded-lg border p-5 transition-colors ${cardStatusClassNames[resolvedStatus]}`}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-center gap-2'>
          {icon && icon}
          <p
            className={`m-0 text-sm font-medium ${labelStatusClassNames[resolvedStatus]}`}
          >
            {label}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {status ? (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusClassNames[status]}`}
            >
              <span
                aria-hidden='true'
                className={`size-1.5 rounded-full ${statusDotClassNames[status]}`}
              />
              {getMetricStatusLabel(status)}
            </span>
          ) : null}
          {href ? (
            <span className='flex w-30 items-center justify-center items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600'>
              View details
              <HiOutlineArrowTopRightOnSquare className='text-sm' />
            </span>
          ) : null}
        </div>
      </div>
      <p className='mt-3 text-3xl font-semibold text-slate-900'>{value}</p>
      <p className='mt-1 text-sm text-slate-600'>{detail}</p>
    </section>
  )

  if (!href) {
    return content
  }

  return (
    <Link
      href={href}
      className='block cursor-pointer rounded-lg transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
    >
      {content}
    </Link>
  )
}

const statusClassNames: Record<MetricStatus, string> = {
  healthy: 'text-emerald-800',
  warning: 'text-amber-800',
  critical: 'text-red-800',
  unknown: 'text-slate-600',
}

const statusDotClassNames: Record<MetricStatus, string> = {
  healthy: 'bg-emerald-600',
  warning: 'bg-amber-500',
  critical: 'bg-red-600',
  unknown: 'bg-slate-400',
}

const cardStatusClassNames: Record<MetricStatus, string> = {
  healthy: 'border-emerald-200 bg-emerald-50/70',
  warning: 'border-amber-300 bg-amber-50',
  critical: 'border-red-300 bg-red-50',
  unknown: 'border-slate-200 bg-white',
}

const labelStatusClassNames: Record<MetricStatus, string> = {
  healthy: 'text-emerald-900/70',
  warning: 'text-amber-900/70',
  critical: 'text-red-900/70',
  unknown: 'text-slate-500',
}
