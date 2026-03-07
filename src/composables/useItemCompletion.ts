import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import {
  useCreateExpenseMutation,
  useDeleteExpensesBatchMutation,
  useExpensesByPlanQuery,
} from 'src/queries/expenses'
import { useUpdatePlanItemCompletionMutation } from 'src/queries/plans'
import { useBanner } from 'src/composables/useBanner'
import type { PlanItem } from 'src/api/plans'

export function useItemCompletion(planId: MaybeRefOrGetter<string | null>) {
  const resolvedPlanId = computed(() => toValue(planId))
  const { getExpensesForPlanItem } = useExpensesByPlanQuery(resolvedPlanId)
  const createExpenseMutation = useCreateExpenseMutation()
  const deleteExpensesBatchMutation = useDeleteExpensesBatchMutation()
  const completionMutation = useUpdatePlanItemCompletionMutation()
  const { showError } = useBanner()

  async function toggleItemCompletion(item: PlanItem, value?: boolean, onSuccess?: () => void) {
    const currentPlanId = toValue(planId)
    if (!currentPlanId) return

    const newCompletionState = value !== undefined ? value : !item.is_completed
    const previousState = item.is_completed

    try {
      item.is_completed = newCompletionState

      if (newCompletionState) {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        const expenseDate = `${year}-${month}-${day}`

        await completionMutation.mutateAsync({
          itemId: item.id,
          isCompleted: true,
          planId: currentPlanId,
        })

        try {
          await createExpenseMutation.mutateAsync({
            plan_id: currentPlanId,
            category_id: item.category_id,
            name: item.name,
            amount: item.amount,
            expense_date: expenseDate,
            plan_item_id: item.id,
          })
        } catch (error) {
          try {
            await completionMutation.mutateAsync({
              itemId: item.id,
              isCompleted: false,
              planId: currentPlanId,
            })
          } catch {
            // Best-effort rollback to reduce partial updates.
          }
          throw error
        }
      } else {
        await completionMutation.mutateAsync({
          itemId: item.id,
          isCompleted: false,
          planId: currentPlanId,
        })

        const expensesToDelete = getExpensesForPlanItem(item.id)

        if (expensesToDelete.length > 0) {
          try {
            await deleteExpensesBatchMutation.mutateAsync({
              expenseIds: expensesToDelete.map((expense) => expense.id),
              planId: currentPlanId,
            })
          } catch (error) {
            try {
              await completionMutation.mutateAsync({
                itemId: item.id,
                isCompleted: true,
                planId: currentPlanId,
              })
            } catch {
              // Best-effort rollback to reduce partial updates.
            }
            throw error
          }
        }
      }

      onSuccess?.()
    } catch {
      item.is_completed = previousState
      const action = newCompletionState ? 'completed' : 'incomplete'
      showError(`Failed to mark item as ${action}. Please try again.`)
    }
  }

  return {
    toggleItemCompletion,
  }
}
