import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import {
  useCategoryExpensesInfiniteQuery,
  useExpenseSummaryQuery,
  usePlanExpensesInfiniteQuery,
  useRecentPlanExpensesQuery,
} from 'src/queries/expenses'
import { useCategoriesQuery } from 'src/queries/categories'
import type { PlanWithItems } from 'src/api'
import type { CategoryBudget } from 'src/types'

type PlanOverviewOptions = {
  historyEnabled?: MaybeRefOrGetter<boolean>
  categoryId?: MaybeRefOrGetter<string | null>
  categoryHistoryEnabled?: MaybeRefOrGetter<boolean>
}

export function usePlanOverview(
  planId: MaybeRefOrGetter<string | null>,
  planArg: MaybeRefOrGetter<PlanWithItems | null>,
  options: PlanOverviewOptions = {},
) {
  const resolvedPlanId = computed(() => toValue(planId))
  const summaryQuery = useExpenseSummaryQuery(resolvedPlanId)
  const { expenseSummary } = summaryQuery
  const recentExpensesQuery = useRecentPlanExpensesQuery(resolvedPlanId)
  const historyQuery = usePlanExpensesInfiniteQuery(resolvedPlanId, options.historyEnabled ?? false)
  const categoryHistoryQuery = useCategoryExpensesInfiniteQuery(
    resolvedPlanId,
    options.categoryId ?? null,
    options.categoryHistoryEnabled ?? false,
  )
  const { categories } = useCategoriesQuery()

  const currentPlanWithItems = computed<PlanWithItems | null>(() => {
    return toValue(planArg) ?? null
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
    return expenseSummary.value.reduce((sum, item) => sum + item.actual_amount, 0)
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

        return {
          categoryId: item.category_id,
          categoryName: category.name,
          categoryColor: category.color,
          categoryIcon: category.icon || 'eva-folder-outline',
          plannedAmount,
          actualAmount: item.actual_amount,
          remainingAmount: item.remaining_amount,
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

  const recentExpenses = recentExpensesQuery.expenses

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
    historyExpenses: historyQuery.expenses,
    categoryExpenses: categoryHistoryQuery.expenses,
    historyQuery,
    categoryHistoryQuery,
    recentExpensesQuery,
    summaryQuery,
    planHealth,
  }
}
