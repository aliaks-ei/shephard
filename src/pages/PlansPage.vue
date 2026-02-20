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
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

import ListPageLayout from 'src/layouts/ListPageLayout.vue'
import SearchAndSort from 'src/components/shared/SearchAndSort.vue'
import ListPageSkeleton from 'src/components/shared/ListPageSkeleton.vue'
import EmptyState from 'src/components/shared/EmptyState.vue'
import PlansGroup from 'src/components/plans/PlansGroup.vue'
import SharePlanDialog from 'src/components/plans/SharePlanDialog.vue'
import { usePlans } from 'src/composables/usePlans'
import { useUpdatePlanMutation } from 'src/queries/plans'
import type { PlanWithPermission } from 'src/api'

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
} = usePlans()

const updatePlanMutation = useUpdatePlanMutation()

const isShareDialogOpen = ref(false)
const sharePlanId = ref<string | null>(null)
const sharePlanOwnerId = computed(() => {
  if (!sharePlanId.value) return undefined
  return allFilteredAndSortedItems.value.find((p) => p.id === sharePlanId.value)?.owner_id
})

function handleDeletePlan(plan: PlanWithPermission): void {
  deleteItem(plan)
}

async function cancelPlan(plan: PlanWithPermission): Promise<void> {
  await updatePlanMutation.mutateAsync({
    id: plan.id,
    updates: { status: 'cancelled' },
  })
}

function openShareDialog(planId: string): void {
  sharePlanId.value = planId
  isShareDialogOpen.value = true
}
</script>
