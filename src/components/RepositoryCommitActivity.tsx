type RepositoryCommitActivityProps = {
  commitActivity: {
    days: number[]
    total: number
    week: number
  }[]
}

export default function RepositoryCommitActivity({
  commitActivity = [],
}: RepositoryCommitActivityProps) {
  const getActivityColor = (count: number) => {
    if (count === 0) return 'bg-[#151b23]'
    if (count <= 2) return 'bg-green-300'
    if (count <= 5) return 'bg-green-500'
    if (count <= 10) return 'bg-green-700'
    return 'bg-green-900'
  }

  const formatDate = (timestamp: number, dayIndex: number) => {
    const date = new Date(timestamp * 1000)

    date.setDate(date.getDate() + dayIndex)

    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTooltip = (
    timestamp: number,
    dayIndex: number,
    count: number
  ) => {
    const date = formatDate(timestamp, dayIndex)

    return `${count} contribution${count === 1 ? '' : 's'} on ${date}`
  }

  return (
    <div className='w-full overflow-x-auto'>
      <div className='min-w-[650px]'>
        {/* Month labels */}
        <div
          className='mb-2 grid'
          style={{
            gridTemplateColumns: `repeat(${commitActivity.length}, minmax(0, 1fr))`,
          }}
        >
          {commitActivity.map((week, index) => {
            const date = new Date(week.week * 1000)

            const previousDate =
              index > 0 ? new Date(commitActivity[index - 1].week * 1000) : null

            const isFirstWeek =
              index === 0 || date.getMonth() !== previousDate?.getMonth()

            return (
              <div key={week.week} className='text-xs text-gray-500'>
                {isFirstWeek &&
                  date.toLocaleDateString('en-US', {
                    month: 'short',
                  })}
              </div>
            )
          })}
        </div>

        {/* Activity grid */}
        <div
          className='grid'
          style={{
            gridTemplateColumns: `repeat(${commitActivity.length}, minmax(0, 1fr))`,
            gridTemplateRows: 'repeat(7, 1fr)',
            gap: '3px',
          }}
        >
          {commitActivity.map((week) =>
            week.days.map((count, dayIndex) => (
              <div
                key={`${week.week}-${dayIndex}`}
                className={`aspect-square w-full rounded-[2px] ${getActivityColor(count)}`}
                title={formatTooltip(week.week, dayIndex, count)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
