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

  const getDate = (timestamp: number, dayIndex: number) => {
    const date = new Date(timestamp * 1000)
    date.setDate(date.getDate() + dayIndex)

    return date
  }

  const isFutureDate = (date: Date) => {
    const today = new Date()

    today.setHours(0, 0, 0, 0)

    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    return checkDate > today
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
        <div className='mb-2 flex gap-[3px]'>
          {commitActivity.map((week, index) => {
            const date = new Date(week.week * 1000)

            const previousDate =
              index > 0 ? new Date(commitActivity[index - 1].week * 1000) : null

            const isFirstWeek =
              index === 0 || date.getMonth() !== previousDate?.getMonth()

            return (
              <div key={week.week} className='w-3 flex-1 text-xs text-gray-500'>
                {isFirstWeek &&
                  date.toLocaleDateString('en-US', {
                    month: 'short',
                  })}
              </div>
            )
          })}
        </div>

        {/* Activity grid */}
        <div className='flex gap-[3px]'>
          {commitActivity.map((week) => (
            <div key={week.week} className='flex flex-1 flex-col gap-[3px]'>
              {week.days.map((count, dayIndex) => {
                const date = getDate(week.week, dayIndex)
                const future = isFutureDate(date)

                return (
                  <div
                    key={`${week.week}-${dayIndex}`}
                    className={`aspect-square w-full rounded-[2px] ${
                      future ? 'bg-transparent' : getActivityColor(count)
                    }`}
                    title={
                      future
                        ? undefined
                        : formatTooltip(week.week, dayIndex, count)
                    }
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
