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
      @export="openExportDialog"
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMeta } from 'quasar'

import ListPageLayout from 'src/layouts/ListPageLayout.vue'

useMeta({ title: 'Templates' })
import SearchAndSort from 'src/components/shared/SearchAndSort.vue'
import ListPageSkeleton from 'src/components/shared/ListPageSkeleton.vue'
import EmptyState from 'src/components/shared/EmptyState.vue'
import TemplatesGroup from 'src/components/templates/TemplatesGroup.vue'
import ShareTemplateDialog from 'src/components/templates/ShareTemplateDialog.vue'
import ExportDialog from 'src/components/shared/ExportDialog.vue'
import { useTemplates } from 'src/composables/useTemplates'
import { useCategoriesQuery } from 'src/queries/categories'
import { useUserStore } from 'src/stores/user'
import { useBanner } from 'src/composables/useBanner'
import { getTemplateWithItems } from 'src/api'
import {
  createTemplateExportDownload,
  downloadExportFile,
  type ExportFormat,
} from 'src/utils/export'

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
const { categories } = useCategoriesQuery()
const userStore = useUserStore()
const { showError, showSuccess } = useBanner()

const isShareDialogOpen = ref(false)
const isExportDialogOpen = ref(false)
const shareTemplateId = ref<string | null>(null)
const exportTemplateId = ref<string | null>(null)
const shareTemplateOwnerId = computed(() => {
  if (!shareTemplateId.value) return undefined
  return allFilteredAndSortedItems.value.find((t) => t.id === shareTemplateId.value)?.owner_id
})

function openShareDialog(templateId: string): void {
  shareTemplateId.value = templateId
  isShareDialogOpen.value = true
}

function openExportDialog(templateId: string): void {
  exportTemplateId.value = templateId
  isExportDialogOpen.value = true
}

async function handleTemplateExport(format: ExportFormat): Promise<void> {
  if (!exportTemplateId.value || !userStore.userProfile?.id) {
    showError('Template export is unavailable right now.')
    return
  }

  try {
    const template = await getTemplateWithItems(exportTemplateId.value, userStore.userProfile.id)

    if (!template) {
      throw new Error('TEMPLATE_NOT_FOUND')
    }

    const download = createTemplateExportDownload(template, categories.value, format)

    downloadExportFile(download)
    isExportDialogOpen.value = false
    showSuccess(`Template exported as ${format.toUpperCase()}.`)
  } catch {
    showError(`Failed to export template as ${format.toUpperCase()}.`)
  }
}
</script>
