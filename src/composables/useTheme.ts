import { useQuasar } from 'quasar'
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { saveUserPreference, getUserPreferences } from 'src/services/user.service'

export function useTheme() {
  const $q = useQuasar()
  const authStore = useAuthStore()

  // Default to light mode until preferences are loaded
  const isDark = ref(false)

  // Initialize dark mode based on stored preference
  $q.dark.set(isDark.value)

  // Toggle dark mode
  async function toggleDarkMode() {
    isDark.value = !isDark.value
    $q.dark.set(isDark.value)

    // Save to database if user is authenticated
    if (authStore.isAuthenticated && authStore.user?.id) {
      await saveUserPreference(authStore.user.id, 'darkMode', isDark.value)
    }
  }

  // Load theme preference from database
  async function loadThemePreference() {
    if (!authStore.isAuthenticated || !authStore.user?.id) return

    try {
      const preferences = await getUserPreferences(authStore.user.id)

      if (preferences && typeof preferences === 'object' && 'darkMode' in preferences) {
        isDark.value = !!preferences.darkMode
        $q.dark.set(isDark.value)
      }
    } catch (err) {
      console.error('Error loading theme preference:', err)
    }
  }

  // Watch for auth state changes
  watch(
    () => authStore.isAuthenticated,
    (isAuthenticated) => {
      if (isAuthenticated) {
        loadThemePreference()
      }
    },
  )

  // Load theme preference on mount if authenticated
  onMounted(() => {
    if (authStore.isAuthenticated) {
      loadThemePreference()
    }
  })

  return {
    isDark,
    toggleDarkMode,
  }
}
