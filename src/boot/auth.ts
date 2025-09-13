import { defineBoot } from '#q-app/wrappers'
import { useUserStore } from 'src/stores/user'

export default defineBoot(() => {
  window.handleGoogleSignIn = (response) => {
    if (window.vueGoogleCallback) {
      window.vueGoogleCallback(response)
    } else {
      console.warn('Google Sign-In callback received but no Vue handler is registered')
    }
  }

  const userStore = useUserStore()

  userStore.initUser()
})
