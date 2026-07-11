import { describe, expect, it, vi } from 'vitest'

import { prepareRouteViewTransition, type ViewTransitionDocument } from './view-transition'

describe('prepareRouteViewTransition', () => {
  it('falls back to normal navigation when the API is unavailable', () => {
    expect(prepareRouteViewTransition({} as ViewTransitionDocument, false)).toBeNull()
  })

  it('does not animate when reduced motion is requested', () => {
    const startViewTransition = vi.fn()
    const documentLike = { startViewTransition } as unknown as ViewTransitionDocument

    expect(prepareRouteViewTransition(documentLike, true)).toBeNull()
    expect(startViewTransition).not.toHaveBeenCalled()
  })

  it('coordinates navigation and rendering with a supported transition', async () => {
    let transitionCallback: (() => Promise<void>) | undefined
    const documentLike = {
      startViewTransition: vi.fn((callback: () => Promise<void>) => {
        transitionCallback = callback
      }),
    } as unknown as ViewTransitionDocument

    const transition = prepareRouteViewTransition(documentLike, false)
    expect(transition).not.toBeNull()

    const renderingFinished = transitionCallback?.()
    await transition?.navigationReady

    transition?.finish()
    await expect(renderingFinished).resolves.toBeUndefined()
  })

  it('falls back without blocking when a partial implementation throws', () => {
    const documentLike = {
      startViewTransition: vi.fn(() => {
        throw new Error('Unsupported')
      }),
    } as unknown as ViewTransitionDocument

    expect(prepareRouteViewTransition(documentLike, false)).toBeNull()
  })
})
