import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useUserStore } from 'src/stores/user'

export async function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const userStore = useUserStore()

  // Wait for user store to initialize if it's still loading
  if (userStore.isLoading) {
    await userStore.initUser()
  }

  // If the route requires auth and user is not authenticated
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next({ path: '/auth', query: { redirect: to.fullPath } })
    return
  }

  // If the route doesn't require auth and user is authenticated
  if (!to.meta.requiresAuth && userStore.isAuthenticated) {
    next()
    return
  }

  next()
}
