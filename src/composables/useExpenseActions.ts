import { Dialog } from 'quasar'
import { useExpensesStore } from 'src/stores/expenses'
import { useNotificationStore } from 'src/stores/notification'
import type { ExpenseWithCategory } from 'src/api'

export function useExpenseActions() {
  const expensesStore = useExpensesStore()
  const notificationStore = useNotificationStore()

  /**
   * Shows a confirmation dialog and deletes the expense if confirmed
   * @param expense - The expense to delete
   * @param onSuccess - Optional callback to execute after successful deletion
   */
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
        await expensesStore.removeExpense(expense.id)
        notificationStore.showSuccess('Expense deleted successfully')
        onSuccess?.()
      })()
    })
  }

  return {
    confirmDeleteExpense,
  }
}
