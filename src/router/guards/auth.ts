import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

export async function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore();

  // Wait for auth store to initialize if it's still loading
  if (authStore.isLoading) {
    await authStore.init();
  }

  // If the route requires auth and user is not authenticated
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ path: '/auth', query: { redirect: to.fullPath } });
    return;
  }

  // If the route doesn't require auth and user is authenticated
  if (!to.meta.requiresAuth && authStore.isAuthenticated) {
    next();
    return;
  }

  next();
}
