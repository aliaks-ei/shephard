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
      @shared="onPlanShared"
    />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

import ListPageLayout from 'src/layouts/ListPageLayout.vue'
import SearchAndSort from 'src/components/shared/SearchAndSort.vue'
import ListPageSkeleton from 'src/components/shared/ListPageSkeleton.vue'
import EmptyState from 'src/components/shared/EmptyState.vue'
import PlansGroup from 'src/components/plans/PlansGroup.vue'
import SharePlanDialog from 'src/components/plans/SharePlanDialog.vue'
import { usePlansStore } from 'src/stores/plans'
import { usePlans } from 'src/composables/usePlans'
import type { PlanWithPermission } from 'src/api'

const plansStore = usePlansStore()

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

const isShareDialogOpen = ref(false)
const sharePlanId = ref<string | null>(null)

function handleDeletePlan(plan: PlanWithPermission): void {
  deleteItem(plan)
}

async function cancelPlan(plan: PlanWithPermission): Promise<void> {
  await plansStore.cancelPlan(plan.id)
}

function openShareDialog(planId: string): void {
  sharePlanId.value = planId
  isShareDialogOpen.value = true
}

function onPlanShared(): void {
  plansStore.loadPlans()
}

onMounted(async () => {
  await plansStore.loadPlans()
})

onUnmounted(() => {
  plansStore.reset()
})
</script>
