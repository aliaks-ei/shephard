import { defineRouter } from '#q-app/wrappers'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'
import routes from './routes'
import { authGuard } from 'src/router/guards/auth'

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Add global navigation guard
  Router.beforeEach(authGuard)

  // Prefetch routes after navigation for better performance
  Router.afterEach((to) => {
    const prefetchRoutes = to.meta.prefetch as string[] | undefined
    if (prefetchRoutes?.length) {
      // Use requestIdleCallback for non-blocking prefetch
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          prefetchRoutes.forEach((route) => {
            const resolved = Router.resolve(route)
            resolved.matched.forEach((record) => {
              // Trigger component loading for prefetch
              const component = record.components?.default
              // Check if component is a lazy-loaded function
              if (component && 'then' in component && typeof component.then === 'function') {
                // It's a Promise from dynamic import, trigger it
                void component
              }
            })
          })
        })
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          prefetchRoutes.forEach((route) => {
            const resolved = Router.resolve(route)
            resolved.matched.forEach((record) => {
              const component = record.components?.default
              // Check if component is a lazy-loaded function
              if (component && 'then' in component && typeof component.then === 'function') {
                // It's a Promise from dynamic import, trigger it
                void component
              }
            })
          })
        }, 100)
      }
    }
  })

  return Router
})
