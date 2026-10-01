import { formatDateInput } from './date'

export type ActivitySummary = {
  currency: string
  monthTotal: number
  // Oldest first, one entry per day for the last 14 days, today included
  days: { date: string; total: number }[]
}

type SummaryExpense = { amount: number; expense_date: string; currency: string }

const STRIP_DAYS = 14

/**
 * Month-to-date total and a 14-day strip from the newest expenses.
 * Returns null when the numbers would be wrong: mixed currencies, or the
 * fetched page does not reach back to the start of the window.
 */
export function buildActivitySummary(
  expenses: SummaryExpense[],
  { complete, now = new Date() }: { complete: boolean; now?: Date },
): ActivitySummary | null {
  const first = expenses[0]
  if (!first) return null
  if (expenses.some((expense) => expense.currency !== first.currency)) return null

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const monthStart = formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1))
  const stripStartDate = new Date(today)
  stripStartDate.setDate(stripStartDate.getDate() - (STRIP_DAYS - 1))
  const stripStart = formatDateInput(stripStartDate)
  const windowStart = monthStart < stripStart ? monthStart : stripStart

  const oldest = expenses[expenses.length - 1]?.expense_date.slice(0, 10) ?? ''
  if (!complete && oldest >= windowStart) return null

  const totalsByDay = new Map<string, number>()
  for (const expense of expenses) {
    const day = expense.expense_date.slice(0, 10)
    totalsByDay.set(day, (totalsByDay.get(day) ?? 0) + expense.amount)
  }

  const todayKey = formatDateInput(today)
  let monthTotal = 0
  for (const [day, total] of totalsByDay) {
    if (day >= monthStart && day <= todayKey) monthTotal += total
  }

  const days = Array.from({ length: STRIP_DAYS }, (_, index) => {
    const date = new Date(stripStartDate)
    date.setDate(date.getDate() + index)
    const key = formatDateInput(date)
    return { date: key, total: totalsByDay.get(key) ?? 0 }
  })

  return { currency: first.currency, monthTotal, days }
}
