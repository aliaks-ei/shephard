<template>
  <q-pull-to-refresh
    :disable="!$q.screen.lt.md"
    @refresh="onRefresh"
  >
    <ListPageLayout
      title="Templates"
      description="Manage your templates and create new ones"
      create-button-label="Create Template"
      :create-button-disabled="isOffline"
      @create="goToNew"
    >
      <SearchAndSort
        v-model:search-query="searchQuery"
        v-model:sort-by="sortBy"
        search-placeholder="Search templates..."
        :sort-options="sortOptions"
      />

      <ListPageSkeleton v-if="areItemsLoading" />

      <QueryErrorState
        v-else-if="hasLoadError"
        entity-name="Templates"
        :retrying="isRetrying"
        @retry="retryItems"
      />

      <TemplatesGroup
        v-else-if="hasItems"
        title="My Templates"
        :templates="allFilteredAndSortedItems"
        @edit="viewItem"
        @export="openExportDialog"
        @delete="deleteItem"
        @share="openShareDialog"
      />

      <EmptyState
        v-else
        illustration="template"
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

      <!-- Share Template Dialog -->
      <ShareTemplateDialog
        v-if="shareTemplateId"
        v-model="isShareDialogOpen"
        :template-id="shareTemplateId"
        :owner-user-id="shareTemplateOwnerId"
        @shared="isShareDialogOpen = false"
      />

      <ExportDialog
        v-model="isExportDialogOpen"
        @select-format="handleTemplateExport"
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
import TemplatesGroup from 'src/components/templates/TemplatesGroup.vue'
import ShareTemplateDialog from 'src/components/templates/ShareTemplateDialog.vue'
import ExportDialog from 'src/components/shared/ExportDialog.vue'
import { useTemplatesPage } from 'src/composables/useTemplatesPage'

useMeta({ title: 'Templates' })

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
  deleteItem,
  clearSearch,
  retryItems,
  isOffline,
  isShareDialogOpen,
  isExportDialogOpen,
  shareTemplateId,
  shareTemplateOwnerId,
  onRefresh,
  openShareDialog,
  openExportDialog,
  handleTemplateExport,
} = useTemplatesPage()
</script>
