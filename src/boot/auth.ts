import { defineBoot } from '#q-app/wrappers'
import { useAuthStore } from 'src/stores/auth'

export default defineBoot(() => {
  try {
    window.handleGoogleSignIn = (response) => {
      if (window.vueGoogleCallback) {
        window.vueGoogleCallback(response)
      } else {
        console.warn('Google Sign-In callback received but no Vue handler is registered')
      }
    }

    const authStore = useAuthStore()

    authStore.ready.catch((error) => {
      console.error('[boot/auth] auth initialization error', error)
    })
  } catch (e) {
    console.error('[boot/auth] unexpected boot error', e)
  }
})
