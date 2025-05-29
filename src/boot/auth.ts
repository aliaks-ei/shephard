import { defineBoot } from '#q-app/wrappers'
import { useUserStore } from 'src/stores/user'

export default defineBoot(() => {
  // Define the global callback that Google Sign-In will use
  window.handleGoogleSignIn = (response) => {
    // Forward to the Vue component's handler if it exists
    if (window.vueGoogleCallback) {
      window.vueGoogleCallback(response)
    } else {
      console.warn('Google Sign-In callback received but no Vue handler is registered')
    }
  }

  const userStore = useUserStore()

  userStore.initUser()
})
