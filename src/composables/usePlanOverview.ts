import { ref, computed } from 'vue'
import { usePlansStore } from 'src/stores/plans'
import { useExpensesStore } from 'src/stores/expenses'
import { useCategoriesStore } from 'src/stores/categories'
import type { ExpenseWithCategory, PlanWithItems } from 'src/api'

interface CategoryBudget {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  plannedAmount: number
  actualAmount: number
  remainingAmount: number
  expenseCount: number
}

export function usePlanOverview(planId: string, planArg?: PlanWithItems | null) {
  const plansStore = usePlansStore()
  const expensesStore = useExpensesStore()
  const categoriesStore = useCategoriesStore()

  // Local state
  const isLoading = ref(false)

  // Load all required data for the overview
  async function loadOverviewData() {
    if (!planId) return

    isLoading.value = true

    try {
      const maybeLoadCategories =
        categoriesStore.categories.length === 0
          ? categoriesStore.loadCategories()
          : Promise.resolve()

      await Promise.all([
        expensesStore.loadExpensesForPlan(planId),
        expensesStore.loadExpenseSummaryForPlan(planId),
        maybeLoadCategories,
      ])
    } finally {
      isLoading.value = false
    }
  }

  // Get the current plan with items
  const currentPlanWithItems = computed<PlanWithItems | null>(() => {
    if (planArg && planArg.id === planId) return planArg
    // Fallback to store (may not include items)
    const fromStore = plansStore.plans.find((p) => p.id === planId)
    return (fromStore as unknown as PlanWithItems) || null
  })

  // Total budget from plan items
  const totalBudget = computed(() => {
    const plan = currentPlanWithItems.value
    if (!plan) return 0

    // Prefer summing plan items if available for accuracy
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

  // Total spent from all expenses
  const totalSpent = computed(() => {
    return expensesStore.totalExpensesAmount
  })

  // Remaining budget
  const remainingBudget = computed(() => {
    return totalBudget.value - totalSpent.value
  })

  // Category budgets with expense data
  const categoryBudgets = computed((): CategoryBudget[] => {
    const summary = expensesStore.expenseSummary
    const categories = categoriesStore.categories
    const plan = currentPlanWithItems.value

    // If we have plan items, use them to get accurate planned amounts
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

        // Use plan items for planned amount if available, otherwise use summary
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
        // Sort by percentage used (descending) to show most critical first
        const aPercentage = a.plannedAmount > 0 ? a.actualAmount / a.plannedAmount : 0
        const bPercentage = b.plannedAmount > 0 ? b.actualAmount / b.plannedAmount : 0
        return bPercentage - aPercentage
      })
  })

  // Recent expenses (last 10)
  const recentExpenses = computed((): ExpenseWithCategory[] => {
    return [...expensesStore.expenses]
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
      .slice(0, 10)
  })

  // Expenses grouped by category
  const expensesByCategory = computed(() => {
    return expensesStore.expensesByCategory
  })

  // Plan health metrics
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
    loadOverviewData,
    totalBudget,
    totalSpent,
    remainingBudget,
    categoryBudgets,
    recentExpenses,
    expensesByCategory,
    planHealth,
  }
}
