export type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => Promise<void>) => unknown
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
