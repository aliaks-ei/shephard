export type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => Promise<void>) => unknown
}

export type ViewTransitionDirection = 'forward' | 'back' | 'none'

function routeDepth(path: string): number {
  const cleanPath = path.split(/[?#]/)[0] ?? ''
  return cleanPath.split('/').filter(Boolean).length
}

/**
 * Derives a push/pop direction from route depth so the view-transition CSS can
 * slide detail pages in from the right and back out again. Sibling routes
 * (tab-to-tab) get a plain crossfade.
 */
export function resolveViewTransitionDirection(
  fromPath: string,
  toPath: string,
): ViewTransitionDirection {
  const fromDepth = routeDepth(fromPath)
  const toDepth = routeDepth(toPath)

  if (toDepth > fromDepth) return 'forward'
  if (toDepth < fromDepth) return 'back'
  return 'none'
}

export type PendingRouteViewTransition = {
  finish: () => void
  navigationReady: Promise<void>
}

export function prepareRouteViewTransition(
  documentLike: ViewTransitionDocument | null,
  prefersReducedMotion: boolean,
): PendingRouteViewTransition | null {
  const startViewTransition = documentLike?.startViewTransition?.bind(documentLike)
  if (!startViewTransition || prefersReducedMotion) {
    return null
  }

  let allowNavigation: () => void = () => undefined
  let finishRendering: () => void = () => undefined
  const navigationReady = new Promise<void>((resolve) => {
    allowNavigation = resolve
  })

  try {
    startViewTransition(() => {
      allowNavigation()
      return new Promise<void>((resolve) => {
        finishRendering = resolve
      })
    })
  } catch {
    // Some Safari versions expose partial or experimental implementations.
    // Fall back to normal router navigation if starting the transition fails.
    allowNavigation()
    finishRendering()
    return null
  }

  return {
    navigationReady,
    finish: () => {
      finishRendering()
    },
  }
}
