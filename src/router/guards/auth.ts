import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useUserStore } from 'src/stores/user'

export function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next({ path: '/auth', query: { redirect: to.fullPath } })
    return
  }

  if (!to.meta.requiresAuth && userStore.isAuthenticated) {
    next()
    return
  }

  next()
}
