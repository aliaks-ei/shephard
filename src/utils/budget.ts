/**
 * Budget and progress color utilities
 * Provides consistent color logic for budget tracking across the application
 */

/**
 * Determines the progress bar color based on budget usage percentage
 * @param percentage - Budget usage percentage (0-100+)
 * @returns Quasar color name for progress indicators
 */
export function getBudgetProgressColor(percentage: number): string {
  if (percentage < 100) return 'primary'
  if (percentage === 100) return 'positive'
  if (percentage <= 110) return 'warning'
  return 'negative'
}

/**
 * Determines the text color class for remaining budget amounts
 * @param percentage - Budget usage percentage (0-100+)
 * @returns Quasar text color class name
 */
export function getBudgetRemainingColorClass(percentage: number): string {
  if (percentage < 100) return 'text-primary'
  if (percentage === 100) return 'text-positive'
  if (percentage <= 110) return 'text-warning'
  return 'text-negative'
}

/**
 * Calculates budget usage percentage
 * @param spent - Amount spent
 * @param budget - Planned budget
 * @returns Percentage of budget used (0-999, capped to prevent overflow)
 */
export function calculateBudgetPercentage(spent: number, budget: number): number {
  if (budget === 0) return 0
  return Math.min((spent / budget) * 100, 999)
}
