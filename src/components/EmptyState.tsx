type EmptyStateProps = {
  title: string
  body: string
}

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <div className='min-w-0 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center'>
      <h3 className='m-0 text-base font-semibold text-slate-900'>{title}</h3>
      <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600'>
        {body}
      </p>
    </div>
  )
}
