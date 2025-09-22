import { defineBoot } from '#q-app/wrappers'
import { useUserStore } from 'src/stores/user'

export default defineBoot(async ({ router }) => {
  window.handleGoogleSignIn = (response) => {
    if (window.vueGoogleCallback) {
      window.vueGoogleCallback(response)
    } else {
      console.warn('Google Sign-In callback received but no Vue handler is registered')
    }
  }

  const userStore = useUserStore()

  // Initialize auth/user state once on startup
  await userStore.initUser()

  // After init, if current route requires auth and user is not authenticated, redirect
  const current = router.currentRoute.value
  if (current.meta?.requiresAuth && !userStore.isAuthenticated) {
    await router.replace({ path: '/auth', query: { redirectTo: current.fullPath } })
  }
})
