import type { TimeType } from '@/types'

const pad = (n: number) => String(n).padStart(2, '0')

export function parseDate(input: string): Date {
  return new Date(input.replace(' ', 'T'))
}

export function formatDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function getAlignedRanges(timeType: TimeType, anchor: Date) {
  const currentEnd = new Date(anchor)
  const currentStart =
    timeType === 'TODAY' ? startOfDay(anchor) : timeType === 'THIS_WEEK' ? startOfWeek(anchor) : startOfMonth(anchor)
  const elapsed = currentEnd.getTime() - currentStart.getTime()
  const previousStart =
    timeType === 'TODAY' ? addDays(currentStart, -1) : timeType === 'THIS_WEEK' ? addDays(currentStart, -7) : addMonths(currentStart, -1)
  const previousEnd = new Date(previousStart.getTime() + elapsed)

  return { currentStart, currentEnd, previousStart, previousEnd }
}

export function getRangeFromTimeType(timeType: TimeType, anchor: Date) {
  const { currentStart, currentEnd } = getAlignedRanges(timeType, anchor)
  return {
    startTime: formatDateTime(currentStart),
    endTime: formatDateTime(currentEnd)
  }
}

export function inRange(input: string, start: Date, end: Date) {
  const value = parseDate(input).getTime()
  return value >= start.getTime() && value <= end.getTime()
}

export function trendLabels(timeType: TimeType, start: Date, end: Date) {
  if (timeType === 'TODAY') {
    const endHour = end.getHours()
    return Array.from({ length: endHour + 1 }, (_, i) => `${pad(i)}:00`)
  }

  const labels: string[] = []
  const cursor = startOfDay(start)
  const stop = startOfDay(end)
  while (cursor.getTime() <= stop.getTime()) {
    labels.push(formatDate(cursor).slice(5))
    cursor.setDate(cursor.getDate() + 1)
  }
  return labels
}

export function trendBucket(input: string, timeType: TimeType) {
  const date = parseDate(input)
  if (timeType === 'TODAY') return `${pad(date.getHours())}:00`
  return formatDate(date).slice(5)
}

export function getRangeFromTrendLabel(label: string, timeType: TimeType, anchor: Date) {
  const { currentStart, currentEnd } = getAlignedRanges(timeType, anchor)
  if (timeType === 'TODAY') {
    const hour = parseInt(label.split(':')[0], 10)
    const st = new Date(currentStart)
    st.setHours(hour, 0, 0, 0)
    const ed = new Date(currentStart)
    ed.setHours(hour, 59, 59, 999)
    return { startTime: formatDateTime(st), endTime: formatDateTime(ed) }
  } else {
    // label is 'MM-DD'
    const [mStr, dStr] = label.split('-')
    const month = parseInt(mStr, 10) - 1
    const day = parseInt(dStr, 10)
    
    let year = currentStart.getFullYear()
    // if week crosses year and month is December but currentStart year is January (wait, currentStart is always the earlier one)
    // Actually currentEnd year is usually enough. If start is Dec and end is Jan:
    if (month === 11 && currentEnd.getMonth() === 0) year = currentStart.getFullYear()
    else if (month === 0 && currentStart.getMonth() === 11) year = currentEnd.getFullYear()

    const st = new Date(year, month, day, 0, 0, 0, 0)
    const ed = new Date(year, month, day, 23, 59, 59, 999)
    return { startTime: formatDateTime(st), endTime: formatDateTime(ed) }
  }
}
