import { describe, expect, it, vi } from 'vitest'

import {
  prepareRouteViewTransition,
  resolveViewTransitionDirection,
  type ViewTransitionDocument,
} from './view-transition'

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

describe('resolveViewTransitionDirection', () => {
  it('returns forward when navigating deeper', () => {
    expect(resolveViewTransitionDirection('/plans', '/plans/abc')).toBe('forward')
    expect(resolveViewTransitionDirection('/', '/plans')).toBe('forward')
  })

  it('returns back when navigating shallower', () => {
    expect(resolveViewTransitionDirection('/plans/abc', '/plans')).toBe('back')
    expect(resolveViewTransitionDirection('/plans/abc?tab=items', '/plans')).toBe('back')
  })

  it('returns none for sibling routes', () => {
    expect(resolveViewTransitionDirection('/plans', '/templates')).toBe('none')
  })
})
