import { nextTick } from 'vue'
import { defineRouter } from '#q-app/wrappers'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'
import routes from './routes'
import { authGuard } from 'src/router/guards/auth'
import {
  prepareRouteViewTransition,
  type PendingRouteViewTransition,
  type ViewTransitionDocument,
} from 'src/utils/view-transition'

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

  // Same-document View Transitions between routes (progressive enhancement):
  // hold navigation until the browser snapshots the old view, release the
  // new-view snapshot once Vue has rendered the target route.
  let pendingViewTransition: PendingRouteViewTransition | null = null

  Router.beforeResolve((to, from) => {
    if (to.fullPath === from.fullPath) return

    const doc = typeof document !== 'undefined' ? (document as ViewTransitionDocument) : null
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    pendingViewTransition = prepareRouteViewTransition(doc, prefersReducedMotion)
    return pendingViewTransition?.navigationReady
  })

  Router.afterEach(() => {
    void nextTick(() => {
      pendingViewTransition?.finish()
      pendingViewTransition = null
    })
  })

  Router.onError(() => {
    pendingViewTransition?.finish()
    pendingViewTransition = null
  })

  return Router
})
