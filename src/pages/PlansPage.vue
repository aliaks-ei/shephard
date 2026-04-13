<template>
  <ListPageLayout
    title="Plans"
    description="Manage your financial plans and track your progress"
    create-button-label="Create Plan"
    @create="goToNew"
  >
    <SearchAndSort
      v-model:search-query="searchQuery"
      v-model:sort-by="sortBy"
      search-placeholder="Search plans..."
      :sort-options="sortOptions"
    />

    <ListPageSkeleton v-if="areItemsLoading" />

    <PlansGroup
      v-else-if="hasItems"
      title="My Plans"
      :plans="allFilteredAndSortedItems"
      @edit="viewItem"
      @export="openExportDialog"
      @delete="handleDeletePlan"
      @share="openShareDialog"
      @cancel="cancelPlan"
    />

    <EmptyState
      v-else
      :has-search-query="!!searchQuery"
      :search-icon="emptyStateConfig.searchIcon"
      :empty-icon="emptyStateConfig.emptyIcon"
      :search-title="emptyStateConfig.searchTitle"
      :empty-title="emptyStateConfig.emptyTitle"
      :search-description="emptyStateConfig.searchDescription"
      :empty-description="emptyStateConfig.emptyDescription"
      :create-button-label="emptyStateConfig.createLabel"
      @clear-search="clearSearch"
      @create="goToNew"
    />

    <!-- Share Plan Dialog -->
    <SharePlanDialog
      v-if="sharePlanId"
      v-model="isShareDialogOpen"
      :plan-id="sharePlanId"
      :owner-user-id="sharePlanOwnerId"
      @shared="isShareDialogOpen = false"
    />

    <ExportDialog
      v-model="isExportDialogOpen"
      @select-format="handlePlanExport"
    />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMeta } from 'quasar'

import ListPageLayout from 'src/layouts/ListPageLayout.vue'

useMeta({ title: 'Plans' })
import SearchAndSort from 'src/components/shared/SearchAndSort.vue'
import ListPageSkeleton from 'src/components/shared/ListPageSkeleton.vue'
import EmptyState from 'src/components/shared/EmptyState.vue'
import PlansGroup from 'src/components/plans/PlansGroup.vue'
import SharePlanDialog from 'src/components/plans/SharePlanDialog.vue'
import ExportDialog from 'src/components/shared/ExportDialog.vue'
import { usePlans } from 'src/composables/usePlans'
import { useCategoriesQuery } from 'src/queries/categories'
import { useUserStore } from 'src/stores/user'
import { useBanner } from 'src/composables/useBanner'
import {
  getExpensesByPlan,
  getPlanExpenseSummary,
  getPlanWithItems,
  type PlanWithPermission,
  type Category,
} from 'src/api'
import { createPlanExportDownload, downloadExportFile, type ExportFormat } from 'src/utils/export'
import type { CategoryBudget } from 'src/types'

const {
  searchQuery,
  sortBy,
  areItemsLoading,
  allFilteredAndSortedItems,
  hasItems,
  sortOptions,
  emptyStateConfig,
  goToNew,
  viewItem,
  deleteItem,
  clearSearch,
  cancelPlan,
} = usePlans()
const { categories } = useCategoriesQuery()
const userStore = useUserStore()
const { showError, showSuccess } = useBanner()

const isShareDialogOpen = ref(false)
const isExportDialogOpen = ref(false)
const sharePlanId = ref<string | null>(null)
const exportPlanId = ref<string | null>(null)
const sharePlanOwnerId = computed(() => {
  if (!sharePlanId.value) return undefined
  return allFilteredAndSortedItems.value.find((p) => p.id === sharePlanId.value)?.owner_id
})

function mapPlanSummaryToCategoryBudgets(
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

function handleDeletePlan(plan: PlanWithPermission): void {
  deleteItem(plan)
}

function openShareDialog(planId: string): void {
  sharePlanId.value = planId
  isShareDialogOpen.value = true
}

function openExportDialog(planId: string): void {
  exportPlanId.value = planId
  isExportDialogOpen.value = true
}

async function handlePlanExport(format: ExportFormat): Promise<void> {
  if (!exportPlanId.value || !userStore.userProfile?.id) {
    showError('Plan export is unavailable right now.')
    return
  }

  try {
    const [plan, expenses, summary] = await Promise.all([
      getPlanWithItems(exportPlanId.value, userStore.userProfile.id),
      getExpensesByPlan(exportPlanId.value),
      getPlanExpenseSummary(exportPlanId.value),
    ])

    if (!plan) {
      throw new Error('PLAN_NOT_FOUND')
    }

    const download = createPlanExportDownload(
      plan,
      categories.value,
      mapPlanSummaryToCategoryBudgets(summary, categories.value),
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
</script>
