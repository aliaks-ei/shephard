import { toValue, type MaybeRefOrGetter } from 'vue'
import { useBanner } from 'src/composables/useBanner'
import type { Category, ExpenseWithCategory, PlanWithItems } from 'src/api'
import type { CategoryBudget } from 'src/types'
import { createPlanExportDownload, downloadExportFile, type ExportFormat } from 'src/utils/export'

export function usePlanExport(
  plan: MaybeRefOrGetter<PlanWithItems | null>,
  categories: MaybeRefOrGetter<Category[]>,
  categoryBudgets: MaybeRefOrGetter<CategoryBudget[]>,
  expenses: MaybeRefOrGetter<ExpenseWithCategory[]>,
) {
  const { showError, showSuccess } = useBanner()

  function exportPlan(format: ExportFormat): boolean {
    const currentPlan = toValue(plan)

    if (!currentPlan) {
      showError('Plan export is unavailable right now.')
      return false
    }

    try {
      const download = createPlanExportDownload(
        currentPlan,
        toValue(categories),
        toValue(categoryBudgets),
        toValue(expenses),
        format,
      )

      downloadExportFile(download)
      showSuccess(`Plan exported as ${format.toUpperCase()}.`)

      return true
    } catch {
      showError(`Failed to export plan as ${format.toUpperCase()}.`)
      return false
    }
  }

  return {
    exportPlan,
  }
}
