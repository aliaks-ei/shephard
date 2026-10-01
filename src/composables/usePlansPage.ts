import { computed, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { usePlans } from './usePlans'
import { useCategoriesQuery } from 'src/queries/categories'
import { usePlanOverviewSnapshotsQuery } from 'src/queries/expenses'
import { usePlanMembersQueries } from 'src/queries/sharing'
import { queryKeys } from 'src/queries/query-keys'
import { useUserStore } from 'src/stores/user'
import { useBanner } from './useBanner'
import { useNetworkStatus } from './useNetworkStatus'
import {
  getAllExpensesByPlanForExport,
  getPlanExpenseSummary,
  getPlanWithItems,
  type Category,
  type PlanWithPermission,
} from 'src/api'
import { getPlanStatus } from 'src/utils/plans'
import { createPlanExportDownload, downloadExportFile, type ExportFormat } from 'src/utils/export'
import type { CategoryBudget } from 'src/types'

export function usePlansPage() {
  const list = usePlans()
  const { categories } = useCategoriesQuery()
  const userStore = useUserStore()
  const { showError, showSuccess } = useBanner()
  const queryClient = useQueryClient()
  const { isOffline } = useNetworkStatus()
  const isShareDialogOpen = ref(false)
  const isExportDialogOpen = ref(false)
  const sharePlanId = ref<string | null>(null)
  const exportPlanId = ref<string | null>(null)
  const sharePlanOwnerId = computed(() =>
    sharePlanId.value
      ? list.allFilteredAndSortedItems.value.find((plan) => plan.id === sharePlanId.value)?.owner_id
      : undefined,
  )

  // Finished plans sit in a collapsed group, so the list leads with what is in progress
  const isFinished = (plan: PlanWithPermission) =>
    ['completed', 'cancelled'].includes(getPlanStatus(plan))
  const currentPlans = computed(() =>
    list.allFilteredAndSortedItems.value.filter((plan) => !isFinished(plan)),
  )
  const finishedPlans = computed(() => list.allFilteredAndSortedItems.value.filter(isFinished))

  // One snapshot request for all current plans gives each card its spend
  const overviewQuery = usePlanOverviewSnapshotsQuery(() =>
    currentPlans.value.map((plan) => plan.id),
  )
  const spentByPlanId = computed(() => {
    const result: Record<string, number> = {}
    for (const row of overviewQuery.snapshots.value) {
      result[row.plan_id] = (result[row.plan_id] ?? 0) + row.actual_amount
    }
    // Plans without expenses have no rows yet; they spent nothing
    if (overviewQuery.isSuccess?.value) {
      for (const plan of currentPlans.value) result[plan.id] ??= 0
    }
    return result
  })

  // Initials of the people a plan is shared with. Only for plans the user owns:
  // the members RPC does not return the owner of a plan shared with the user.
  const sharedOwnedPlanIds = computed(() =>
    currentPlans.value
      .filter((plan) => plan.is_shared && plan.owner_id === userStore.userProfile?.id)
      .map((plan) => plan.id),
  )
  const { membersByPlanId } = usePlanMembersQueries(sharedOwnedPlanIds)
  const memberInitialsByPlanId = computed(() => {
    const result: Record<string, string[]> = {}
    for (const [planId, members] of Object.entries(membersByPlanId.value)) {
      result[planId] = members
        .map((member) => (member.user_name || member.user_email).trim().charAt(0).toUpperCase())
        .filter(Boolean)
    }
    return result
  })

  async function onRefresh(done: () => void) {
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.plans.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.expenses.overviewSnapshotsAll() })
    } finally {
      done()
    }
  }

  function mapBudgets(
    summary: Awaited<ReturnType<typeof getPlanExpenseSummary>>,
    allCategories: Category[],
  ): CategoryBudget[] {
    return summary.map((item) => {
      const category = allCategories.find((entry) => entry.id === item.category_id)
      return {
        categoryId: item.category_id,
        categoryName: category?.name || '',
        categoryColor: category?.color || '',
        categoryIcon: category?.icon || 'eva-folder-outline',
        plannedAmount: item.planned_amount,
        actualAmount: item.actual_amount,
        remainingAmount: item.remaining_amount,
        expenseCount: item.expense_count,
      }
    })
  }

  function handleDeletePlan(plan: PlanWithPermission) {
    list.deleteItem(plan)
  }

  function openShareDialog(planId: string) {
    const plan = list.allFilteredAndSortedItems.value.find((item) => item.id === planId)
    if (!plan || plan.owner_id !== userStore.userProfile?.id) return
    sharePlanId.value = planId
    isShareDialogOpen.value = true
  }

  function openExportDialog(planId: string) {
    exportPlanId.value = planId
    isExportDialogOpen.value = true
  }

  async function handlePlanExport(format: ExportFormat) {
    if (!exportPlanId.value || !userStore.userProfile?.id) {
      showError('Plan export is unavailable right now.')
      return
    }
    try {
      const [plan, expenses, summary] = await Promise.all([
        getPlanWithItems(exportPlanId.value, userStore.userProfile.id),
        getAllExpensesByPlanForExport(exportPlanId.value),
        getPlanExpenseSummary(exportPlanId.value),
      ])
      const download = createPlanExportDownload(
        plan,
        categories.value,
        mapBudgets(summary, categories.value),
        expenses,
        format,
      )
      downloadExportFile(download)
      isExportDialogOpen.value = false
      showSuccess(`Plan exported as ${format.toUpperCase()}.`)
    } catch {
      showError(`Failed to export plan as ${format.toUpperCase()}.`)
    }
  }

  return {
    ...list,
    currentPlans,
    finishedPlans,
    spentByPlanId,
    memberInitialsByPlanId,
    isOffline,
    isShareDialogOpen,
    isExportDialogOpen,
    sharePlanId,
    exportPlanId,
    sharePlanOwnerId,
    onRefresh,
    handleDeletePlan,
    openShareDialog,
    openExportDialog,
    handlePlanExport,
  }
}
