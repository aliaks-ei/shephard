import { computed, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { usePlans } from './usePlans'
import { useCategoriesQuery } from 'src/queries/categories'
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

  async function onRefresh(done: () => void) {
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.plans.all })
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
