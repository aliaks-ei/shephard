import { date as quasarDate } from 'quasar'

/**
 * Formats a date string to a standard format (e.g., "Jan 15, 2025")
 * @param dateString - The date string to format
 * @returns Formatted date string in format "MMM D, YYYY"
 */
export function formatDate(dateString: string): string {
  return quasarDate.formatDate(new Date(dateString), 'MMM D, YYYY')
}

/**
 * Formats a date string with relative labels for recent dates
 * Shows "Today", "Yesterday", or formatted date with conditional year
 * @param dateString - The date string to format
 * @returns "Today", "Yesterday", or formatted date like "Jan 15" or "Jan 15, 2024"
 */
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
