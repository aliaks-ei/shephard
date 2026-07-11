import { toValue, type MaybeRefOrGetter } from 'vue'
import { useBanner } from 'src/composables/useBanner'
import { usePlanExpenseExport } from 'src/queries/expenses'
import type { Category, PlanWithItems } from 'src/api'
import { createPlanExportDownload, downloadExportFile, type ExportFormat } from 'src/utils/export'

export function usePlanExport(
  plan: MaybeRefOrGetter<PlanWithItems | null>,
  categories: MaybeRefOrGetter<Category[]>,
) {
  const { showError, showSuccess } = useBanner()
  const { fetchAllExpenses, fetchSummary } = usePlanExpenseExport()

  async function exportPlan(format: ExportFormat): Promise<boolean> {
    const currentPlan = toValue(plan)

    if (!currentPlan) {
      showError('Plan export is unavailable right now.')
      return false
    }

    try {
      const [expenses, summary] = await Promise.all([
        fetchAllExpenses(currentPlan.id),
        fetchSummary(currentPlan.id),
      ])
      const currentCategories = toValue(categories)
      const categoryBudgets = summary.flatMap((item) => {
        const category = currentCategories.find((candidate) => candidate.id === item.category_id)
        if (!category) return []

        return [
          {
            categoryId: item.category_id,
            categoryName: category.name,
            categoryColor: category.color,
            categoryIcon: category.icon || 'eva-folder-outline',
            plannedAmount: item.planned_amount,
            actualAmount: item.actual_amount,
            remainingAmount: item.remaining_amount,
            expenseCount: item.expense_count,
          },
        ]
      })
      const download = createPlanExportDownload(
        currentPlan,
        currentCategories,
        categoryBudgets,
        expenses,
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
