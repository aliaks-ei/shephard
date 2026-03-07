import { date as quasarDate } from 'quasar'

export function formatDate(dateString: string): string {
  return quasarDate.formatDate(new Date(dateString), 'MMM D, YYYY')
}

export function formatDateRelative(dateString: string): string {
  const parsed = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (parsed.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (parsed.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    const format = parsed.getFullYear() !== today.getFullYear() ? 'MMM D, YYYY' : 'MMM D'
    return quasarDate.formatDate(parsed, format)
  }
}

export function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null
  }

  const parsed = new Date(year, month - 1, day)
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return parsed
}
