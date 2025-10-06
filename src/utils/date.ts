/**
 * Formats a date string to a standard format (e.g., "Jan 15, 2025")
 * @param dateString - The date string to format
 * @returns Formatted date string in format "MMM DD, YYYY"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/**
 * Formats a date string with relative labels for recent dates
 * Shows "Today", "Yesterday", or formatted date with conditional year
 * @param dateString - The date string to format
 * @returns "Today", "Yesterday", or formatted date like "Jan 15" or "Jan 15, 2024"
 */
export function formatDateRelative(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    }).format(date)
  }
}
