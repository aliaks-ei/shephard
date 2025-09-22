import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useUserStore } from 'src/stores/user'

export function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const userStore = useUserStore()

  // Do not block initial navigation on first load
  if (userStore.isLoading) {
    next()
    return
  }

  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next({ path: '/auth', query: { redirectTo: to.fullPath } })
    return
  }

  if (!to.meta.requiresAuth && userStore.isAuthenticated) {
    next()
    return
  }

  next()
}
