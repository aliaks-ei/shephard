import type { PlanItem } from 'src/api/plans'

/**
 * Calculate "still to pay" amount for a category
 *
 * Formula: (sum of NON-COMPLETED fixed items) + max(0, sum of non-fixed items - expenses)
 *
 * @param categoryId - The category ID to calculate for
 * @param planItems - Array of plan items for the category
 * @param actualExpenses - Total expenses already spent in this category
 * @returns The "still to pay" amount
 */
export function calculateStillToPay(
  categoryId: string,
  planItems: PlanItem[],
  actualExpenses: number,
): number {
  // Filter items for this category
  const categoryItems = planItems.filter((item) => item.category_id === categoryId)

  // Calculate non-completed fixed items total
  const nonCompletedFixedTotal = categoryItems
    .filter((item) => item.is_fixed_payment && !item.is_completed)
    .reduce((sum, item) => sum + item.amount, 0)

  // Calculate non-fixed items total
  const nonFixedTotal = categoryItems
    .filter((item) => !item.is_fixed_payment)
    .reduce((sum, item) => sum + item.amount, 0)

  // Still to pay = (non-completed fixed items) + max(0, non-fixed items - expenses)
  return nonCompletedFixedTotal + Math.max(0, nonFixedTotal - actualExpenses)
}
