import { Dialog } from 'quasar'
import { useExpensesStore } from 'src/stores/expenses'
import type { ExpenseWithCategory } from 'src/api'

export function useExpenseActions() {
  const expensesStore = useExpensesStore()

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
        onSuccess?.()
      })()
    })
  }

  return {
    confirmDeleteExpense,
  }
}
