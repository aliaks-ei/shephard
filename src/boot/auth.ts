import { defineBoot } from '#q-app/wrappers'
import { watch } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { usePreferencesStore } from 'src/stores/preferences'
import { queryClient } from 'src/boot/vue-query'

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
      async (newUser, oldUser) => {
        if (newUser?.id !== oldUser?.id) {
          await queryClient.cancelQueries()
          queryClient.clear()
        }
        if (newUser && newUser.id !== oldUser?.id) {
          await preferencesStore.loadPreferences(newUser.id)
        } else if (!newUser) {
          preferencesStore.reset()
        }
      },
      { immediate: true },
    )
  } catch (e) {
    console.error('[boot/auth] unexpected boot error', e)
  }
})
