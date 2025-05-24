import { useQuasar } from 'quasar'
import { useLocalStorage } from '@vueuse/core'

export function useTheme() {
  const $q = useQuasar()
  const isDark = useLocalStorage('shephard-dark-mode', false)

  // Initialize dark mode based on stored preference
  $q.dark.set(isDark.value)

  // Toggle dark mode
  function toggleDarkMode() {
    isDark.value = !isDark.value
    $q.dark.set(isDark.value)
  }

  return {
    isDark,
    toggleDarkMode,
  }
}
