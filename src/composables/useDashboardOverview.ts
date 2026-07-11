import { computed } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { usePlansQuery } from 'src/queries/plans'
import { useTemplatesQuery } from 'src/queries/templates'
import { usePlanOverviewSnapshotsQuery, useRecentExpensesInfiniteQuery } from 'src/queries/expenses'
import { queryKeys } from 'src/queries/query-keys'
import { useUserStore } from 'src/stores/user'
import { useNetworkStatus } from 'src/composables/useNetworkStatus'
import { useSortedRecentItems } from 'src/composables/useSortedRecentItems'
import type { PlanOverviewSnapshotRow } from 'src/api'
import type { CategoryBudget } from 'src/types'

export type DashboardPlanOverview = {
  totalBudget: number
  totalSpent: number
  remainingBudget: number
  categoryBudgets: CategoryBudget[]
}

const MAX_DISPLAYED_ITEMS = 3
const DASHBOARD_RECENT_EXPENSE_COUNT = 4

export function useDashboardOverview() {
  const queryClient = useQueryClient()
  const userStore = useUserStore()
  const userId = computed(() => userStore.userProfile?.id)
  const { isOnline, isOffline } = useNetworkStatus()

  const plansQuery = usePlansQuery(userId)
  const templatesQuery = useTemplatesQuery(userId)
  const { activePlans, plansForExpenses } = plansQuery
  const { templates, templatesCount } = templatesQuery

  const activePlanIds = computed(() => activePlans.value.map((plan) => plan.id))
  const overviewQuery = usePlanOverviewSnapshotsQuery(activePlanIds)
  const recentExpensesQuery = useRecentExpensesInfiniteQuery(userId)

  const overviewByPlanId = computed(() => {
    const result: Record<string, DashboardPlanOverview> = {}
    const rowsByPlanId = new Map<string, PlanOverviewSnapshotRow[]>()

    for (const row of overviewQuery.snapshots.value) {
      const rows = rowsByPlanId.get(row.plan_id)
      if (rows) {
        rows.push(row)
      } else {
        rowsByPlanId.set(row.plan_id, [row])
      }
    }

    for (const plan of activePlans.value) {
      const rows = rowsByPlanId.get(plan.id) ?? []
      result[plan.id] = {
        totalBudget: plan.total || 0,
        totalSpent: rows.reduce((sum, row) => sum + row.actual_amount, 0),
        remainingBudget: rows.reduce((sum, row) => sum + row.remaining_amount, 0),
        categoryBudgets: rows
          .map((row) => ({
            categoryId: row.category_id,
            categoryName: row.category_name,
            categoryColor: row.category_color,
            categoryIcon: row.category_icon || 'eva-folder-outline',
            plannedAmount: row.planned_amount,
            actualAmount: row.actual_amount,
            remainingAmount: row.remaining_amount,
            expenseCount: row.expense_count,
          }))
          .sort((a, b) => {
            const aPercentage = a.plannedAmount > 0 ? a.actualAmount / a.plannedAmount : 0
            const bPercentage = b.plannedAmount > 0 ? b.actualAmount / b.plannedAmount : 0
            return bPercentage - aPercentage
          }),
      }
    }

    return result
  })

  const primaryPlan = computed(() => {
    if (activePlans.value.length === 0) return null
    return (
      [...activePlans.value].sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime(),
      )[0] ?? null
    )
  })
  const primaryPlanOverview = computed(() =>
    primaryPlan.value ? (overviewByPlanId.value[primaryPlan.value.id] ?? null) : null,
  )

  const recentActivePlans = useSortedRecentItems(activePlans, MAX_DISPLAYED_ITEMS)
  const recentTemplates = useSortedRecentItems(templates, MAX_DISPLAYED_ITEMS)
  const recentExpenses = computed(() =>
    recentExpensesQuery.expenses.value.slice(0, DASHBOARD_RECENT_EXPENSE_COUNT),
  )

  const isLoading = computed(() => plansQuery.isPending.value || templatesQuery.isPending.value)
  const plansLoadError = computed(
    () =>
      ((plansQuery.isError?.value ?? false) || isOffline.value) && activePlans.value.length === 0,
  )
  const templatesLoadError = computed(
    () =>
      ((templatesQuery.isError?.value ?? false) || isOffline.value) && templates.value.length === 0,
  )
  const overviewLoadError = computed(
    () =>
      ((overviewQuery.isError?.value ?? false) || isOffline.value) &&
      overviewQuery.snapshots.value.length === 0,
  )
  const recentExpensesLoadError = computed(
    () =>
      ((recentExpensesQuery.isError?.value ?? false) || isOffline.value) &&
      recentExpenses.value.length === 0,
  )

  async function refreshDashboard(): Promise<void> {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.recentAll() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.overviewSnapshotsAll() }),
    ])
  }

  return {
    activePlans,
    plansForExpenses,
    templates,
    templatesCount,
    primaryPlan,
    primaryPlanOverview,
    overviewByPlanId,
    recentActivePlans,
    recentTemplates,
    recentExpenses,
    activePlansCount: computed(() => activePlans.value.length),
    canAddExpense: computed(() => isOnline.value && plansForExpenses.value.length > 0),
    isOnline,
    isLoading,
    plansLoadError,
    templatesLoadError,
    overviewLoadError,
    recentExpensesLoadError,
    plansRetrying: computed(() => plansQuery.isFetching?.value ?? false),
    templatesRetrying: computed(() => templatesQuery.isFetching?.value ?? false),
    overviewRetrying: computed(() => overviewQuery.isFetching?.value ?? false),
    overviewLoading: computed(() => overviewQuery.isPending.value && !isOffline.value),
    recentExpensesLoading: computed(() => recentExpensesQuery.isPending.value && !isOffline.value),
    recentExpensesRetrying: computed(() => recentExpensesQuery.isFetching?.value ?? false),
    retryPlans: () => plansQuery.refetch(),
    retryTemplates: () => templatesQuery.refetch(),
    retryOverview: () => overviewQuery.refetch(),
    retryRecentExpenses: () => recentExpensesQuery.refetch(),
    refreshDashboard,
    maxDisplayedItems: MAX_DISPLAYED_ITEMS,
  }
}
