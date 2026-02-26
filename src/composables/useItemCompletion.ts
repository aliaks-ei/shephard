import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import {
  useCreateExpenseMutation,
  useDeleteExpensesBatchMutation,
  useExpensesByPlanQuery,
} from 'src/queries/expenses'
import { useUpdatePlanItemCompletionMutation } from 'src/queries/plans'
import { useNotificationStore } from 'src/stores/notification'
import type { PlanItem } from 'src/api/plans'

export function useItemCompletion(planId: MaybeRefOrGetter<string | null>) {
  const resolvedPlanId = computed(() => toValue(planId))
  const { getExpensesForPlanItem } = useExpensesByPlanQuery(resolvedPlanId)
  const createExpenseMutation = useCreateExpenseMutation()
  const deleteExpensesBatchMutation = useDeleteExpensesBatchMutation()
  const completionMutation = useUpdatePlanItemCompletionMutation()
  const notificationStore = useNotificationStore()

  async function toggleItemCompletion(item: PlanItem, value?: boolean, onSuccess?: () => void) {
    const currentPlanId = toValue(planId)
    if (!currentPlanId) return

    const newCompletionState = value !== undefined ? value : !item.is_completed
    const previousState = item.is_completed

    try {
      if (newCompletionState) {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        const expenseDate = `${year}-${month}-${day}`

        item.is_completed = newCompletionState

        await createExpenseMutation.mutateAsync({
          plan_id: currentPlanId,
          category_id: item.category_id,
          name: item.name,
          amount: item.amount,
          expense_date: expenseDate,
          plan_item_id: item.id,
        })
      } else {
        const expensesToDelete = getExpensesForPlanItem(item.id)

        if (expensesToDelete.length === 0) {
          notificationStore.showError('No expenses found to remove for this item')
          return
        }

        item.is_completed = newCompletionState
        await deleteExpensesBatchMutation.mutateAsync({
          expenseIds: expensesToDelete.map((expense) => expense.id),
          planId: currentPlanId,
          planItemId: item.id,
          hasRemainingExpensesForItem: false,
        })
      }

      await completionMutation.mutateAsync({
        itemId: item.id,
        isCompleted: newCompletionState,
        planId: currentPlanId,
      })

      onSuccess?.()
    } catch {
      item.is_completed = previousState
      const action = newCompletionState ? 'completed' : 'incomplete'
      notificationStore.showError(`Failed to mark item as ${action}. Please try again.`)
    }
  }

  return {
    toggleItemCompletion,
  }
}
