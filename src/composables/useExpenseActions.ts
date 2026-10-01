import { ref } from 'vue'
import { Notify } from 'quasar'
import { useDeleteExpenseMutation } from 'src/queries/expenses'
import type { ExpenseWithCategory } from 'src/api'

// Module-level singleton state so a single <ExpenseDeleteDialog /> mounted in the
// layout can render the confirmation for any caller of confirmDeleteExpense().
const pendingDeleteExpense = ref<ExpenseWithCategory | null>(null)
const pendingOnSuccess = ref<(() => void) | undefined>()
const isDeletingExpense = ref(false)

// Rows removed by swipe stay hidden while the undo snackbar is open
const undoPendingIds = ref(new Set<string>())
const UNDO_TIMEOUT_MS = 4000

function setUndoPending(id: string, pending: boolean) {
  const next = new Set(undoPendingIds.value)
  if (pending) next.add(id)
  else next.delete(id)
  undoPendingIds.value = next
}

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

  /**
   * Swipe delete: hide the row at once and delete when the snackbar closes,
   * unless the user taps Undo. No confirm dialog.
   */
  function deleteExpenseWithUndo(expense: ExpenseWithCategory, onSuccess?: () => void) {
    let undone = false
    setUndoPending(expense.id, true)
    Notify.create({
      message: 'Expense deleted',
      icon: 'eva-trash-2-outline',
      timeout: UNDO_TIMEOUT_MS,
      actions: [
        {
          label: 'Undo',
          noCaps: true,
          handler: () => {
            undone = true
            setUndoPending(expense.id, false)
          },
        },
      ],
      onDismiss: () => {
        if (undone) return
        // On success the row leaves the list with the refetch, so the id stays hidden.
        // On error the mutation reports it; show the row again.
        deleteExpense(expense, onSuccess).catch(() => setUndoPending(expense.id, false))
      },
    })
  }

  function isUndoPending(id: string): boolean {
    return undoPendingIds.value.has(id)
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
    deleteExpenseWithUndo,
    isUndoPending,
    pendingDeleteExpense,
    isDeletingExpense,
    confirmPendingDelete,
    cancelPendingDelete,
  }
}
