import { computed, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useTemplates } from './useTemplates'
import { useCategoriesQuery } from 'src/queries/categories'
import { queryKeys } from 'src/queries/query-keys'
import { useUserStore } from 'src/stores/user'
import { useBanner } from './useBanner'
import { useNetworkStatus } from './useNetworkStatus'
import { getTemplateWithItems } from 'src/api'
import { createTemplateExportDownload, downloadExportFile, type ExportFormat } from 'src/utils/export'

export function useTemplatesPage() {
  const list = useTemplates()
  const { categories } = useCategoriesQuery()
  const queryClient = useQueryClient()
  const userStore = useUserStore()
  const { showError, showSuccess } = useBanner()
  const { isOffline } = useNetworkStatus()
  const isShareDialogOpen = ref(false)
  const isExportDialogOpen = ref(false)
  const shareTemplateId = ref<string | null>(null)
  const exportTemplateId = ref<string | null>(null)
  const shareTemplateOwnerId = computed(() =>
    shareTemplateId.value
      ? list.allFilteredAndSortedItems.value.find(
          (template) => template.id === shareTemplateId.value,
        )?.owner_id
      : undefined,
  )

  async function onRefresh(done: () => void) {
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.templates.all })
    } finally {
      done()
    }
  }

  function openShareDialog(templateId: string) {
    const template = list.allFilteredAndSortedItems.value.find((item) => item.id === templateId)
    if (!template || template.owner_id !== userStore.userProfile?.id) return
    shareTemplateId.value = templateId
    isShareDialogOpen.value = true
  }

  function openExportDialog(templateId: string) {
    exportTemplateId.value = templateId
    isExportDialogOpen.value = true
  }

  async function handleTemplateExport(format: ExportFormat) {
    if (!exportTemplateId.value || !userStore.userProfile?.id) {
      showError('Template export is unavailable right now.')
      return
    }
    try {
      const template = await getTemplateWithItems(
        exportTemplateId.value,
        userStore.userProfile.id,
      )
      const download = createTemplateExportDownload(template, categories.value, format)
      downloadExportFile(download)
      isExportDialogOpen.value = false
      showSuccess(`Template exported as ${format.toUpperCase()}.`)
    } catch {
      showError(`Failed to export template as ${format.toUpperCase()}.`)
    }
  }

  return {
    ...list,
    isOffline,
    isShareDialogOpen,
    isExportDialogOpen,
    shareTemplateId,
    exportTemplateId,
    shareTemplateOwnerId,
    onRefresh,
    openShareDialog,
    openExportDialog,
    handleTemplateExport,
  }
}
