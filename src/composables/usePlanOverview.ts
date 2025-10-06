import { ref, computed, unref, type Ref } from 'vue'
import { usePlansStore } from 'src/stores/plans'
import { useExpensesStore } from 'src/stores/expenses'
import { useCategoriesStore } from 'src/stores/categories'
import type { ExpenseWithCategory, PlanWithItems } from 'src/api'
import type { CategoryBudget } from 'src/types'

export function usePlanOverview(
  planId: Ref<string> | string,
  planArg?: Ref<PlanWithItems | null> | PlanWithItems | null,
) {
  const plansStore = usePlansStore()
  const expensesStore = useExpensesStore()
  const categoriesStore = useCategoriesStore()

  const isLoading = ref(false)

  const currentPlanWithItems = computed<PlanWithItems | null>(() => {
    const plan = unref(planArg)
    const currentPlanId = unref(planId)
    if (plan && plan.id === currentPlanId) return plan
    const fromStore = plansStore.plans.find((p) => p.id === currentPlanId)
    return (fromStore as unknown as PlanWithItems) || null
  })

  const totalBudget = computed(() => {
    const plan = currentPlanWithItems.value
    if (!plan) return 0

    const hasItems = Array.isArray(
      (plan as unknown as { plan_items?: { amount: number }[] }).plan_items,
    )
    if (hasItems) {
      const withItems = plan as unknown as { plan_items?: { amount: number }[] }
      return (withItems.plan_items || []).reduce(
        (sum: number, item: { amount: number }) => sum + (item?.amount || 0),
        0,
      )
    }

    return plan.total || 0
  })

  const totalSpent = computed(() => {
    return expensesStore.totalExpensesAmount
  })

  const remainingBudget = computed(() => {
    return totalBudget.value - totalSpent.value
  })

  const categoryBudgets = computed((): CategoryBudget[] => {
    const summary = expensesStore.expenseSummary
    const categories = categoriesStore.categories
    const plan = currentPlanWithItems.value

    const plannedAmountsByCategory = new Map<string, number>()
    if (plan?.plan_items) {
      plan.plan_items.forEach((item) => {
        const existing = plannedAmountsByCategory.get(item.category_id) || 0
        plannedAmountsByCategory.set(item.category_id, existing + item.amount)
      })
    }

    return summary
      .map((item) => {
        const category = categories.find((c) => c.id === item.category_id)
        if (!category) return null

        const plannedAmount = plannedAmountsByCategory.get(item.category_id) || item.planned_amount
        const calculatedRemaining = plannedAmount - item.actual_amount

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

  const recentExpenses = computed((): ExpenseWithCategory[] => {
    return expensesStore.sortedExpenses.slice(0, 10)
  })

  const expensesByCategory = computed(() => {
    return expensesStore.expensesByCategory
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

    const overBudgetCategories = categoryBudgets.value.filter((c) => c.remainingAmount < 0).length
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
    isLoading,
    totalBudget,
    totalSpent,
    remainingBudget,
    categoryBudgets,
    recentExpenses,
    expensesByCategory,
    planHealth,
  }
}
