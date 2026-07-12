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
  const content = (
    <section className='min-w-0 rounded-lg bg-white p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-center gap-2'>
          {icon && icon}
          <p className='m-0 text-sm font-medium text-slate-500'>{label}</p>
        </div>
        <div className='flex items-center gap-2'>
          {status ? (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClassNames[status]}`}
            >
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
      className='block cursor-pointer rounded-lg transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300'
    >
      {content}
    </Link>
  )
}

const statusClassNames: Record<MetricStatus, string> = {
  healthy: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  critical: 'bg-red-50 text-red-700',
  unknown: 'bg-slate-100 text-slate-600',
}
