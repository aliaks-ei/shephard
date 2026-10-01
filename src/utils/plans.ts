import { date as quasarDate } from 'quasar'
import type { Plan } from 'src/api/plans'

export type PlanStatus = 'pending' | 'active' | 'completed' | 'cancelled'

export function calculateEndDate(startDate: Date, duration: 'weekly' | 'monthly' | 'yearly'): Date {
  const endDate = new Date(startDate)

  switch (duration) {
    case 'weekly':
      endDate.setDate(endDate.getDate() + 7)
      break
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1)
      break
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1)
      break
  }

  return endDate
}

export function getPlanStatus(plan: Plan): PlanStatus {
  if (plan.status === 'cancelled') {
    return 'cancelled'
  }

  const now = new Date()
  const startDate = new Date(plan.start_date)
  const endDate = new Date(plan.end_date)

  now.setHours(0, 0, 0, 0)
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)

  if (now < startDate) {
    return 'pending'
  } else if (now >= startDate && now <= endDate) {
    return 'active'
  } else {
    return 'completed'
  }
}

export function canEditPlan(plan: Plan & { permission_level?: string }, isOwner: boolean): boolean {
  if (!isOwner && plan.permission_level !== 'edit') {
    return false
  }

  if (plan.status === 'cancelled' || getPlanStatus(plan) === 'completed') {
    return false
  }

  return true
}

export function canAddExpensesToPlan(
  plan: Plan & { permission_level?: string },
  isOwner: boolean,
): boolean {
  if (plan.status === 'cancelled' || getPlanStatus(plan) === 'completed') {
    return false
  }

  if (isOwner) {
    return true
  }

  return plan.permission_level === 'edit'
}

export function getDaysRemaining(plan: Plan): number | null {
  const status = getPlanStatus(plan)

  if (status !== 'active') {
    return null
  }

  const now = new Date()
  const endDate = new Date(plan.end_date)

  now.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)

  const diffTime = endDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

export function getDaysUntilStart(plan: Plan): number | null {
  const status = getPlanStatus(plan)

  if (status !== 'pending') {
    return null
  }

  const now = new Date()
  const startDate = new Date(plan.start_date)

  now.setHours(0, 0, 0, 0)
  startDate.setHours(0, 0, 0, 0)

  const diffTime = startDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

export function getStatusText(plan: Plan): string {
  const status = getPlanStatus(plan)

  switch (status) {
    case 'pending': {
      const days = getDaysUntilStart(plan)
      return days === 0 ? 'Starts today' : `Starts in ${days} day${days === 1 ? '' : 's'}`
    }
    case 'active': {
      const days = getDaysRemaining(plan)
      if (days === 0) return 'Ends today'
      if (days === 1) return '1 day left'
      return `${days} days left`
    }
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return 'Unknown'
  }
}

export function getStatusColor(plan: Plan): string {
  const status = getPlanStatus(plan)

  switch (status) {
    case 'pending':
      return 'orange'
    case 'active':
      return 'green'
    case 'completed':
      return 'grey'
    case 'cancelled':
      return 'red'
    default:
      return 'grey'
  }
}

export function getStatusIcon(plan: Plan): string {
  const status = getPlanStatus(plan)

  switch (status) {
    case 'pending':
      return 'eva-clock-outline'
    case 'active':
      return 'eva-play-circle-outline'
    case 'completed':
      return 'eva-checkmark-circle-outline'
    case 'cancelled':
      return 'eva-close-circle-outline'
    default:
      return 'eva-question-mark-circle-outline'
  }
}

export function formatDateRange(startDate: string, endDate: string): string {
  const startFormatted = quasarDate.formatDate(new Date(startDate), 'D MMM')
  const endFormatted = quasarDate.formatDate(new Date(endDate), 'D MMM YYYY')

  return `${startFormatted} - ${endFormatted}`
}

export type PlanPaceStatus = 'on-track' | 'ahead' | 'over'

export type PlanPace = {
  // What the user can spend per day for the rest of the plan, today included.
  dailyAllowance: number
  // Share of the plan period used up by the end of today, 0..1. Drives the "today" marker.
  elapsedRatio: number
  status: PlanPaceStatus
}

const DAY_MS = 1000 * 60 * 60 * 24

/**
 * Spend pace for an active plan. "ahead" means spending runs ahead of the calendar:
 * the spent share is larger than the elapsed share of the period.
 */
export function getPlanPace(
  plan: Plan,
  totalBudget: number,
  totalSpent: number,
  now: Date = new Date(),
): PlanPace | null {
  if (getPlanStatus(plan) !== 'active' || totalBudget <= 0) return null

  const today = new Date(now)
  const start = new Date(plan.start_date)
  const end = new Date(plan.end_date)
  today.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  const totalDays = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1
  const elapsedDays = Math.round((today.getTime() - start.getTime()) / DAY_MS) + 1
  const daysLeft = Math.max(1, totalDays - elapsedDays + 1)
  const remaining = totalBudget - totalSpent
  const elapsedRatio = Math.min(1, Math.max(0, elapsedDays / totalDays))

  let status: PlanPaceStatus = 'on-track'
  if (remaining < 0) status = 'over'
  else if (totalSpent / totalBudget > elapsedRatio) status = 'ahead'

  return {
    dailyAllowance: Math.max(0, remaining) / daysLeft,
    elapsedRatio,
    status,
  }
}
