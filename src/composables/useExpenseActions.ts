import { Dialog } from 'quasar'
import { useDeleteExpenseMutation } from 'src/queries/expenses'
import type { ExpenseWithCategory } from 'src/api'

export function useExpenseActions() {
  const deleteExpenseMutation = useDeleteExpenseMutation()

  async function deleteExpense(
    expense: ExpenseWithCategory,
    onSuccess?: () => void,
  ): Promise<void> {
    await deleteExpenseMutation.mutateAsync({
      expenseId: expense.id,
      planId: expense.plan_id,
      planItemId: expense.plan_item_id,
    })
    onSuccess?.()
  }

  function confirmDeleteExpense(expense: ExpenseWithCategory, onSuccess?: () => void) {
    Dialog.create({
      title: 'Delete Expense?',
      message: `Are you sure you want to delete "${expense.name}"?`,
      persistent: true,
      ok: {
        label: 'Delete',
        color: 'negative',
        unelevated: true,
      },
      cancel: {
        label: 'Cancel',
        flat: true,
        color: 'text-white',
      },
    }).onOk(() => {
      void (async () => {
        await deleteExpense(expense, onSuccess)
      })()
    })
  }

  return {
    confirmDeleteExpense,
    deleteExpense,
  }
}
