import { toValue, type MaybeRefOrGetter } from 'vue'
import { useBanner } from 'src/composables/useBanner'
import type { Category, TemplateWithItems } from 'src/api'
import {
  createTemplateExportDownload,
  downloadExportFile,
  type ExportFormat,
} from 'src/utils/export'

export function useTemplateExport(
  template: MaybeRefOrGetter<TemplateWithItems | null>,
  categories: MaybeRefOrGetter<Category[]>,
) {
  const { showError, showSuccess } = useBanner()

  function exportTemplate(format: ExportFormat): boolean {
    const currentTemplate = toValue(template)

    if (!currentTemplate) {
      showError('Template export is unavailable right now.')
      return false
    }

    try {
      const download = createTemplateExportDownload(currentTemplate, toValue(categories), format)

      downloadExportFile(download)
      showSuccess(`Template exported as ${format.toUpperCase()}.`)

      return true
    } catch {
      showError(`Failed to export template as ${format.toUpperCase()}.`)
      return false
    }
  }

  return {
    exportTemplate,
  }
}
