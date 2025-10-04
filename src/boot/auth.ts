import { defineBoot } from '#q-app/wrappers'
import { watch } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { usePreferencesStore } from 'src/stores/preferences'

export default defineBoot(async () => {
  try {
    window.handleGoogleSignIn = (response) => {
      if (window.vueGoogleCallback) {
        window.vueGoogleCallback(response)
      } else {
        console.warn('Google Sign-In callback received but no Vue handler is registered')
      }
    }

    const authStore = useAuthStore()
    const preferencesStore = usePreferencesStore()

    await authStore.ready

    watch(
      () => authStore.user,
      (newUser, oldUser) => {
        if (newUser && newUser.id !== oldUser?.id) {
          preferencesStore.loadPreferences()
        }
      },
      { immediate: true },
    )
  } catch (e) {
    console.error('[boot/auth] unexpected boot error', e)
  }
})
