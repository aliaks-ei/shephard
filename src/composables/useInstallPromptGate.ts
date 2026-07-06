import { useStorage } from '@vueuse/core'

const HAS_SAVED_EXPENSE_KEY = 'shephard-has-saved-expense'

/**
 * Gates the PWA install promotion behind the first successfully saved expense,
 * so the prompt appears right after the user experiences value — not on load.
 */
export function useInstallPromptGate() {
  const hasSavedExpense = useStorage(HAS_SAVED_EXPENSE_KEY, false)

  function markExpenseSaved() {
    hasSavedExpense.value = true
  }

  return {
    hasSavedExpense,
    markExpenseSaved,
  }
}
