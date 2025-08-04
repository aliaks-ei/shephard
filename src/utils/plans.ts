import type { Plan } from 'src/api/plans'

export type PlanStatus = 'pending' | 'active' | 'completed' | 'cancelled'

/**
 * Calculate end date based on template duration and start date
 */
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

/**
 * Determine current plan status based on dates
 */
export function getPlanStatus(plan: Plan): PlanStatus {
  if (plan.status === 'cancelled') {
    return 'cancelled'
  }

  const now = new Date()
  const startDate = new Date(plan.start_date)
  const endDate = new Date(plan.end_date)

  // Reset time to compare dates only
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

/**
 * Check if plan can be edited based on status and permissions
 */
export function canEditPlan(plan: Plan, isOwner: boolean): boolean {
  // Only owners can edit plans
  if (!isOwner) {
    return false
  }

  // Cancelled and completed plans cannot be edited
  if (plan.status === 'cancelled' || getPlanStatus(plan) === 'completed') {
    return false
  }

  return true
}

/**
 * Check if plan start date can be modified
 */
export function canEditStartDate(plan: Plan): boolean {
  const status = getPlanStatus(plan)
  // Can only edit start date if plan is still pending
  return status === 'pending'
}

/**
 * Get days remaining for active plans
 */
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

/**
 * Get days until plan starts for pending plans
 */
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

/**
 * Get status display text
 */
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

/**
 * Get status color for UI components
 */
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

/**
 * Get status icon
 */
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

/**
 * Format date range for display
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const startFormatted = start.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })

  const endFormatted = end.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return `${startFormatted} - ${endFormatted}`
}
