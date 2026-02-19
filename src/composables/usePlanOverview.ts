import { computed, unref, type Ref } from 'vue'
import { useExpensesByPlanQuery, useExpenseSummaryQuery } from 'src/queries/expenses'
import { useCategoriesQuery } from 'src/queries/categories'
import { calculateStillToPay } from 'src/utils/budget-calculations'
import type { ExpenseWithCategory, PlanWithItems } from 'src/api'
import type { CategoryBudget } from 'src/types'

export function usePlanOverview(
  planId: Ref<string> | string,
  planArg: Ref<PlanWithItems | null> | PlanWithItems | null,
) {
  const resolvedPlanId = computed(() => unref(planId))
  const { totalExpensesAmount, sortedExpenses, expensesByCategory } =
    useExpensesByPlanQuery(resolvedPlanId)
  const { expenseSummary } = useExpenseSummaryQuery(resolvedPlanId)
  const { categories } = useCategoriesQuery()

  const currentPlanWithItems = computed<PlanWithItems | null>(() => {
    return unref(planArg) ?? null
  })

  const totalBudget = computed(() => {
    const plan = currentPlanWithItems.value
    if (!plan) return 0

    if (plan.plan_items?.length) {
      return plan.plan_items.reduce((sum, item) => sum + (item?.amount || 0), 0)
    }

    return plan.total || 0
  })

  const totalSpent = computed(() => {
    return totalExpensesAmount.value
  })

  const categoryBudgets = computed((): CategoryBudget[] => {
    const summary = expenseSummary.value
    const cats = categories.value
    const plan = currentPlanWithItems.value

    const totalAmountsByCategory = new Map<string, number>()

    if (plan?.plan_items) {
      plan.plan_items.forEach((item) => {
        const categoryId = item.category_id
        const existingTotal = totalAmountsByCategory.get(categoryId) || 0
        totalAmountsByCategory.set(categoryId, existingTotal + item.amount)
      })
    }

    return summary
      .map((item) => {
        const category = cats.find((c) => c.id === item.category_id)
        if (!category) return null

        const plannedAmount = totalAmountsByCategory.get(item.category_id) || item.planned_amount

        const calculatedRemaining = calculateStillToPay(
          item.category_id,
          plan?.plan_items || [],
          item.actual_amount,
        )

        return {
          categoryId: item.category_id,
          categoryName: category.name,
          categoryColor: category.color,
          categoryIcon: category.icon || 'eva-folder-outline',
          plannedAmount,
          actualAmount: item.actual_amount,
          remainingAmount: calculatedRemaining,
          expenseCount: item.expense_count,
        }
      })
      .filter((item): item is CategoryBudget => item !== null)
      .sort((a, b) => {
        const aPercentage = a.plannedAmount > 0 ? a.actualAmount / a.plannedAmount : 0
        const bPercentage = b.plannedAmount > 0 ? b.actualAmount / b.plannedAmount : 0
        return bPercentage - aPercentage
      })
  })

  const remainingBudget = computed(() => {
    return categoryBudgets.value.reduce((sum, category) => sum + category.remainingAmount, 0)
  })

  const recentExpenses = computed((): ExpenseWithCategory[] => {
    return sortedExpenses.value.slice(0, 10)
  })

  const planHealth = computed(() => {
    const budgetUtilization =
      totalBudget.value > 0 ? (totalSpent.value / totalBudget.value) * 100 : 0

    let status: 'healthy' | 'warning' | 'critical'
    if (budgetUtilization > 100) {
      status = 'critical'
    } else if (budgetUtilization > 80) {
      status = 'warning'
    } else {
      status = 'healthy'
    }

    const overBudgetCategories = categoryBudgets.value.filter(
      (c) => c.actualAmount > c.plannedAmount,
    ).length
    const nearLimitCategories = categoryBudgets.value.filter((c) => {
      const percentage = c.plannedAmount > 0 ? c.actualAmount / c.plannedAmount : 0
      return percentage > 0.8 && percentage <= 1
    }).length

    return {
      status,
      budgetUtilization,
      overBudgetCategories,
      nearLimitCategories,
      totalCategories: categoryBudgets.value.length,
    }
  })

  return {
    totalBudget,
    totalSpent,
    remainingBudget,
    categoryBudgets,
    recentExpenses,
    expensesByCategory,
    planHealth,
  }
}
