import { computed } from 'vue'
import { useSessionStorage, useStorage } from '@vueuse/core'

const HAS_SAVED_EXPENSE_KEY = 'shephard-has-saved-expense'
const INSTALL_PROMPT_SHOWN_SESSION_KEY = 'shephard-install-prompt-shown'

/**
 * Gates the PWA install promotion behind the first successfully saved expense,
 * so the prompt appears right after the user experiences value — not on load.
 */
export function useInstallPromptGate() {
  const hasSavedExpense = useStorage(HAS_SAVED_EXPENSE_KEY, false)
  const hasShownInstallPromptThisSession = useSessionStorage(
    INSTALL_PROMPT_SHOWN_SESSION_KEY,
    false,
  )
  const canShowInstallPrompt = computed(
    () => hasSavedExpense.value && !hasShownInstallPromptThisSession.value,
  )

  function markExpenseSaved() {
    hasSavedExpense.value = true
  }

  function markInstallPromptShown() {
    hasShownInstallPromptThisSession.value = true
  }

  return {
    canShowInstallPrompt,
    hasSavedExpense,
    hasShownInstallPromptThisSession,
    markExpenseSaved,
    markInstallPromptShown,
  }
}
