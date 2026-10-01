import { describe, it, expect } from 'vitest'
import { buildActivitySummary } from './activity-summary'

const now = new Date(2026, 9, 5, 12) // 5 Oct 2026
const expense = (expense_date: string, amount: number, currency = 'EUR') => ({
  expense_date,
  amount,
  currency,
})

describe('buildActivitySummary', () => {
  it('sums the month so far and fills 14 days, today last', () => {
    const summary = buildActivitySummary(
      [expense('2026-10-05', 10), expense('2026-10-01', 5), expense('2026-09-30', 7)],
      { complete: true, now },
    )

    expect(summary?.monthTotal).toBe(15)
    expect(summary?.days).toHaveLength(14)
    expect(summary?.days.at(-1)).toEqual({ date: '2026-10-05', total: 10 })
    expect(summary?.days.find((day) => day.date === '2026-09-30')?.total).toBe(7)
  })

  it('returns null for mixed currencies', () => {
    expect(
      buildActivitySummary([expense('2026-10-05', 10), expense('2026-10-04', 5, 'USD')], {
        complete: true,
        now,
      }),
    ).toBeNull()
  })

  it('returns null when an incomplete page does not reach the window start', () => {
    expect(
      buildActivitySummary([expense('2026-10-05', 10), expense('2026-10-01', 5)], {
        complete: false,
        now,
      }),
    ).toBeNull()
  })

  it('returns null without expenses', () => {
    expect(buildActivitySummary([], { complete: true, now })).toBeNull()
  })
})
