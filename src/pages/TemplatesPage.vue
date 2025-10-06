<template>
  <ListPageLayout
    title="Templates"
    description="Manage your templates and create new ones"
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

    <TemplatesGroup
      v-else-if="hasItems"
      title="My Templates"
      :templates="allFilteredAndSortedItems"
      @edit="viewItem"
      @delete="deleteItem"
      @share="openShareDialog"
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

    <!-- Share Template Dialog - Lazy Loaded -->
    <component
      :is="ShareTemplateDialog"
      v-if="isShareDialogOpen && shareTemplateId"
      v-model="isShareDialogOpen"
      :template-id="shareTemplateId"
      @shared="onTemplateShared"
    />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue'

import ListPageLayout from 'src/layouts/ListPageLayout.vue'
import SearchAndSort from 'src/components/shared/SearchAndSort.vue'
import ListPageSkeleton from 'src/components/shared/ListPageSkeleton.vue'
import EmptyState from 'src/components/shared/EmptyState.vue'
import TemplatesGroup from 'src/components/templates/TemplatesGroup.vue'
import { useTemplatesStore } from 'src/stores/templates'
import { useNotificationStore } from 'src/stores/notification'
import { useTemplates } from 'src/composables/useTemplates'

const ShareTemplateDialog = defineAsyncComponent(
  () => import('src/components/templates/ShareTemplateDialog.vue'),
)

const templatesStore = useTemplatesStore()
const notificationsStore = useNotificationStore()

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
} = useTemplates()

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
