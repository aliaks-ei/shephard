<template>
  <q-pull-to-refresh
    :disable="!$q.screen.lt.md"
    @refresh="onRefresh"
  >
    <ListPageLayout
      title="Plans"
      description="Manage your financial plans and track your progress"
      create-button-label="Create Plan"
      :create-button-disabled="isOffline"
      @create="goToNew"
    >
      <SearchAndSort
        v-model:search-query="searchQuery"
        v-model:sort-by="sortBy"
        search-placeholder="Search plans..."
        :sort-options="sortOptions"
      />

      <ListPageSkeleton v-if="areItemsLoading" />

      <QueryErrorState
        v-else-if="hasLoadError"
        entity-name="Plans"
        :retrying="isRetrying"
        @retry="retryItems"
      />

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
        illustration="plan"
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
  </q-pull-to-refresh>
</template>

<script setup lang="ts">
import { useMeta } from 'quasar'
import ListPageLayout from 'src/layouts/ListPageLayout.vue'
import SearchAndSort from 'src/components/shared/SearchAndSort.vue'
import ListPageSkeleton from 'src/components/shared/ListPageSkeleton.vue'
import EmptyState from 'src/components/shared/EmptyState.vue'
import QueryErrorState from 'src/components/shared/QueryErrorState.vue'
import PlansGroup from 'src/components/plans/PlansGroup.vue'
import SharePlanDialog from 'src/components/plans/SharePlanDialog.vue'
import ExportDialog from 'src/components/shared/ExportDialog.vue'
import { usePlansPage } from 'src/composables/usePlansPage'

useMeta({ title: 'Plans' })

const {
  searchQuery,
  sortBy,
  areItemsLoading,
  hasLoadError,
  isRetrying,
  allFilteredAndSortedItems,
  hasItems,
  sortOptions,
  emptyStateConfig,
  goToNew,
  viewItem,
  clearSearch,
  retryItems,
  cancelPlan,
  isOffline,
  isShareDialogOpen,
  isExportDialogOpen,
  sharePlanId,
  sharePlanOwnerId,
  onRefresh,
  handleDeletePlan,
  openShareDialog,
  openExportDialog,
  handlePlanExport,
} = usePlansPage()
</script>
