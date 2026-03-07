import type { PlanItem } from 'src/api/plans'

export type CategoryExpenseForBudgetCalculation = {
  amount: number
  plan_item_id: string | null
}

/**
 * Calculate "still to pay" amount for a category
 *
 * Formula: (sum of NON-COMPLETED fixed items) + max(0, sum of non-fixed items - non-fixed expenses)
 *
 * @param categoryId - The category ID to calculate for
 * @param planItems - Array of plan items for the category
 * @param actualExpenses - Total expenses already spent in this category (fallback when no expense details)
 * @param categoryExpenses - Optional detailed expenses for this category
 * @returns The "still to pay" amount
 */
export function calculateStillToPay(
  categoryId: string,
  planItems: PlanItem[],
  actualExpenses: number,
  categoryExpenses?: CategoryExpenseForBudgetCalculation[],
): number {
  // Filter items for this category
  const categoryItems = planItems.filter((item) => item.category_id === categoryId)

  const planItemsById = new Map(planItems.map((item) => [item.id, item]))

  // Calculate non-completed fixed items total
  const nonCompletedFixedTotal = categoryItems
    .filter((item) => item.is_fixed_payment && !item.is_completed)
    .reduce((sum, item) => sum + item.amount, 0)

  // Calculate non-fixed items total
  const nonFixedTotal = categoryItems
    .filter((item) => !item.is_fixed_payment)
    .reduce((sum, item) => sum + item.amount, 0)

  const nonFixedExpenses =
    categoryExpenses?.reduce((sum, expense) => {
      // Unlinked expenses are treated as category-level spending against non-fixed budget.
      if (!expense.plan_item_id) return sum + expense.amount

      const linkedItem = planItemsById.get(expense.plan_item_id)
      if (linkedItem && !linkedItem.is_fixed_payment) {
        return sum + expense.amount
      }

      return sum
    }, 0) ?? actualExpenses

  // Still to pay = (non-completed fixed items) + max(0, non-fixed items - non-fixed expenses)
  return nonCompletedFixedTotal + Math.max(0, nonFixedTotal - nonFixedExpenses)
}
