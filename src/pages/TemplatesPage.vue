<template>
  <ListPageLayout
    title="Templates"
    description="Manage your expense templates and create new ones"
    create-button-label="Create Template"
    @create="goToNew"
  >
    <SearchAndSort
      v-model:search-query="searchQuery"
      v-model:sort-by="sortBy"
      search-placeholder="Search templates..."
      :sort-options="sortOptions"
    />

    <ListPageSkeleton v-if="areItemsLoading" />

    <div
      v-else-if="hasItems"
      class="column q-col-gutter-xl"
    >
      <div v-if="filteredAndSortedOwnedItems.length > 0">
        <ExpenseTemplatesGroup
          title="My Templates"
          :templates="filteredAndSortedOwnedItems"
          @edit="viewItem"
          @delete="deleteItem"
          @share="openShareDialog"
        />
      </div>

      <div v-if="filteredAndSortedSharedItems.length > 0">
        <ExpenseTemplatesGroup
          title="Shared with Me"
          :templates="filteredAndSortedSharedItems"
          chip-color="secondary"
          hide-shared-badge
          @edit="viewItem"
          @delete="deleteItem"
          @share="openShareDialog"
        />
      </div>
    </div>

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

    <ShareExpenseTemplateDialog
      v-if="shareTemplateId"
      v-model="isShareDialogOpen"
      :template-id="shareTemplateId"
      @shared="onTemplateShared"
    />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

import ListPageLayout from 'src/layouts/ListPageLayout.vue'
import SearchAndSort from 'src/components/shared/SearchAndSort.vue'
import ListPageSkeleton from 'src/components/shared/ListPageSkeleton.vue'
import EmptyState from 'src/components/shared/EmptyState.vue'
import ShareExpenseTemplateDialog from 'src/components/expense-templates/ShareExpenseTemplateDialog.vue'
import ExpenseTemplatesGroup from 'src/components/expense-templates/ExpenseTemplatesGroup.vue'
import { useTemplatesStore } from 'src/stores/templates'
import { useNotificationStore } from 'src/stores/notification'
import { useExpenseTemplates } from 'src/composables/useExpenseTemplates'

const templatesStore = useTemplatesStore()
const notificationsStore = useNotificationStore()

const {
  searchQuery,
  sortBy,
  areItemsLoading,
  filteredAndSortedOwnedItems,
  filteredAndSortedSharedItems,
  hasItems,
  sortOptions,
  emptyStateConfig,
  goToNew,
  viewItem,
  deleteItem,
  clearSearch,
} = useExpenseTemplates()

const isShareDialogOpen = ref(false)
const shareTemplateId = ref<string | null>(null)

function openShareDialog(templateId: string): void {
  shareTemplateId.value = templateId
  isShareDialogOpen.value = true
}

function onTemplateShared(): void {
  templatesStore.loadTemplates()
  notificationsStore.showSuccess('Template shared successfully')
}

onMounted(async () => {
  await templatesStore.loadTemplates()
})

onUnmounted(() => {
  templatesStore.reset()
})
</script>
