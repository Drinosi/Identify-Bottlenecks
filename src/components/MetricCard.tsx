import type { ReactNode } from 'react'

type MetricCardProps = {
  label: string
  value: string | number
  detail: string
  icon?: ReactNode
}

export function MetricCard({ label, value, detail, icon }: MetricCardProps) {
  return (
    <section className='min-w-0 rounded-lg bg-white p-5'>
      <div className='flex items-center gap-2'>
        {icon && icon}
        <p className='m-0 text-sm font-medium text-slate-500'>{label}</p>
      </div>
      <p className='mt-3 text-3xl font-semibold text-slate-900'>{value}</p>
      <p className='mt-1 text-sm text-slate-600'>{detail}</p>
    </section>
  )
}
