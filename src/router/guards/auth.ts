import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useUserStore } from 'src/stores/user'
import { useAuthStore } from 'src/stores/auth'

export async function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  await authStore.ready

  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next({ path: '/auth', query: { redirectTo: to.fullPath } })
    return
  }

  if (!to.meta.requiresAuth && userStore.isAuthenticated) {
    next({ path: '/' })
    return
  }

  next()
}
