import { ref } from 'vue'
import { useDeleteExpenseMutation } from 'src/queries/expenses'
import type { ExpenseWithCategory } from 'src/api'

// Module-level singleton state so a single <ExpenseDeleteDialog /> mounted in the
// layout can render the confirmation for any caller of confirmDeleteExpense().
const pendingDeleteExpense = ref<ExpenseWithCategory | null>(null)
const pendingOnSuccess = ref<(() => void) | undefined>()
const isDeletingExpense = ref(false)

function clearPendingDelete() {
  pendingDeleteExpense.value = null
  pendingOnSuccess.value = undefined
  isDeletingExpense.value = false
}

export function useExpenseActions() {
  const deleteExpenseMutation = useDeleteExpenseMutation()

  async function deleteExpense(
    expense: ExpenseWithCategory,
    onSuccess?: () => void,
  ): Promise<void> {
    await deleteExpenseMutation.mutateAsync({
      expenseId: expense.id,
      planId: expense.plan_id,
    })
    onSuccess?.()
  }

  function confirmDeleteExpense(expense: ExpenseWithCategory, onSuccess?: () => void) {
    pendingDeleteExpense.value = expense
    pendingOnSuccess.value = onSuccess
  }

  async function confirmPendingDelete(): Promise<void> {
    const expense = pendingDeleteExpense.value
    if (!expense || isDeletingExpense.value) return

    isDeletingExpense.value = true
    try {
      await deleteExpense(expense, pendingOnSuccess.value)
    } catch {
      // The mutation reports its own error notification; just reset the sheet state.
    } finally {
      clearPendingDelete()
    }
  }

  function cancelPendingDelete() {
    if (isDeletingExpense.value) return
    clearPendingDelete()
  }

  return {
    confirmDeleteExpense,
    deleteExpense,
    pendingDeleteExpense,
    isDeletingExpense,
    confirmPendingDelete,
    cancelPendingDelete,
  }
}
