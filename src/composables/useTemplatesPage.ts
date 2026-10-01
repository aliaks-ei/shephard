import { computed, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useTemplates } from './useTemplates'
import { DEFAULT_CATEGORY_COLOR } from 'src/utils/categories'
import { useCategoriesQuery } from 'src/queries/categories'
import { useTemplateItemSummariesQuery } from 'src/queries/templates'
import { queryKeys } from 'src/queries/query-keys'
import { useUserStore } from 'src/stores/user'
import { useBanner } from './useBanner'
import { useNetworkStatus } from './useNetworkStatus'
import { getTemplateWithItems } from 'src/api'
import {
  createTemplateExportDownload,
  downloadExportFile,
  type ExportFormat,
} from 'src/utils/export'

export type TemplateComposition = {
  itemCount: number
  // Category colour and share of the total, largest first
  segments: { color: string; share: number }[]
}

const MAX_COMPOSITION_SEGMENTS = 5

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

  const itemSummariesQuery = useTemplateItemSummariesQuery(() =>
    list.allFilteredAndSortedItems.value.map((template) => template.id),
  )
  const compositionByTemplateId = computed(() => {
    const byTemplate = new Map<string, { color: string; amount: number }[]>()
    for (const row of itemSummariesQuery.summaries.value) {
      const items = byTemplate.get(row.template_id) ?? []
      items.push({ color: row.categories?.color ?? '', amount: row.amount })
      byTemplate.set(row.template_id, items)
    }
    const result: Record<string, TemplateComposition> = {}
    for (const [templateId, items] of byTemplate) {
      const total = items.reduce((sum, item) => sum + item.amount, 0)
      const amountByColor = new Map<string, number>()
      for (const item of items) {
        amountByColor.set(item.color, (amountByColor.get(item.color) ?? 0) + item.amount)
      }
      const segments = [...amountByColor]
        .map(([color, amount]) => ({ color, share: total > 0 ? (amount / total) * 100 : 0 }))
        .sort((a, b) => b.share - a.share)
      // Many small categories turn the bar into noise: keep the largest, merge the rest
      const otherShare = segments
        .slice(MAX_COMPOSITION_SEGMENTS)
        .reduce((sum, segment) => sum + segment.share, 0)
      result[templateId] = {
        itemCount: items.length,
        segments: [
          ...segments.slice(0, MAX_COMPOSITION_SEGMENTS),
          ...(otherShare > 0 ? [{ color: DEFAULT_CATEGORY_COLOR, share: otherShare }] : []),
        ],
      }
    }
    return result
  })

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
      const template = await getTemplateWithItems(exportTemplateId.value, userStore.userProfile.id)
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
    compositionByTemplateId,
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
