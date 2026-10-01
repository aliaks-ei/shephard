<template>
  <q-pull-to-refresh
    :disable="!$q.screen.lt.md"
    @refresh="onRefresh"
  >
    <ListPageLayout
      title="Plans"
      create-button-label="New plan"
      :create-button-disabled="isOffline"
      @create="goToNew"
    >
      <SearchAndSort
        v-model:search-query="searchQuery"
        v-model:sort-by="sortBy"
        search-placeholder="Search plans"
        :sort-options="sortOptions"
      />

      <ListPageSkeleton v-if="areItemsLoading" />

      <QueryErrorState
        v-else-if="hasLoadError"
        entity-name="Plans"
        :retrying="isRetrying"
        @retry="retryItems"
      />

      <template v-else-if="hasItems">
        <PlansGroup
          v-if="currentPlans.length > 0"
          :plans="currentPlans"
          :spent-by-plan-id="spentByPlanId"
          :member-initials-by-plan-id="memberInitialsByPlanId"
          @edit="viewItem"
          @export="openExportDialog"
          @delete="handleDeletePlan"
          @share="openShareDialog"
          @cancel="cancelPlan"
        />

        <q-expansion-item
          v-if="finishedPlans.length > 0"
          v-model="showFinishedPlans"
          :label="`Completed (${finishedPlans.length})`"
          header-class="plans-finished__header"
          class="plans-finished q-mt-md"
          dense
        >
          <!-- Wrapper: PlansGroup has two root nodes, so it cannot take spacing classes -->
          <div class="plans-finished__list">
            <PlansGroup
              :plans="finishedPlans"
              @edit="viewItem"
              @export="openExportDialog"
              @delete="handleDeletePlan"
              @share="openShareDialog"
              @cancel="cancelPlan"
            />
          </div>
        </q-expansion-item>
      </template>

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

      <!-- Share plan Dialog -->
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
import { ref, watch } from 'vue'
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
  hasItems,
  currentPlans,
  finishedPlans,
  spentByPlanId,
  memberInitialsByPlanId,
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

const showFinishedPlans = ref(false)
// A search can match a finished plan; show it instead of hiding it in the closed group
watch(searchQuery, (query) => {
  if (query) showFinishedPlans.value = true
})
</script>

<style lang="scss" scoped>
.plans-finished :deep(.plans-finished__header) {
  min-height: 44px;
  padding-inline: 4px;
  border-radius: var(--radius-md);
  font-weight: 600;
  color: hsl(var(--muted-foreground));

  // Quasar's focus tint stays grey after a click; use a light hover instead
  .q-focus-helper {
    display: none;
  }

  &:hover {
    color: hsl(var(--foreground));
  }
}

.plans-finished__list {
  padding-top: 12px;
}

// Room after the last element so it never sits against the bottom bar
.plans-finished {
  margin-bottom: 16px;
}
</style>
