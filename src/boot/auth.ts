import { defineBoot } from '#q-app/wrappers'
import { useUserStore } from 'src/stores/user'

export default defineBoot(async ({ router }) => {
  try {
    window.handleGoogleSignIn = (response) => {
      if (window.vueGoogleCallback) {
        window.vueGoogleCallback(response)
      } else {
        console.warn('Google Sign-In callback received but no Vue handler is registered')
      }
    }

    const userStore = useUserStore()

    try {
      await userStore.initUser()
    } catch (e) {
      // Defensive logging: prevent silent boot aborts in production
      console.error('[boot/auth] initUser failed', e)
    }

    try {
      const current = router.currentRoute.value
      if (current.meta?.requiresAuth && !userStore.isAuthenticated) {
        await router.replace({ path: '/auth', query: { redirectTo: current.fullPath } })
      }
    } catch (e) {
      console.error('[boot/auth] post-init navigation failed', e)
    }
  } catch (e) {
    console.error('[boot/auth] unexpected boot error', e)
  }
})
