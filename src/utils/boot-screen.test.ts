import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { dismissBootScreen } from './boot-screen'

describe('dismissBootScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-11T12:00:00.000Z'))
    document.body.innerHTML = '<div id="app-boot"></div>'
    document.documentElement.dataset.bootStartedAt = String(Date.now() - 500)
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
    delete document.documentElement.dataset.bootStartedAt
    delete document.documentElement.dataset.iosStandaloneBoot
  })

  it('removes the overlay after the closing transition', () => {
    dismissBootScreen()

    const overlay = document.getElementById('app-boot')
    expect(overlay).not.toBeNull()

    vi.advanceTimersByTime(1)

    expect(overlay?.classList.contains('app-boot--closing')).toBe(true)

    vi.advanceTimersByTime(220)

    expect(document.getElementById('app-boot')).toBeNull()
    expect(document.documentElement.dataset.bootStartedAt).toBeUndefined()
  })

  it('keeps the overlay visible until the minimum display duration has elapsed', () => {
    document.documentElement.dataset.bootStartedAt = String(Date.now() - 50)

    dismissBootScreen()

    vi.advanceTimersByTime(129)
    expect(document.getElementById('app-boot')?.classList.contains('app-boot--closing')).toBe(false)

    vi.advanceTimersByTime(1)
    expect(document.getElementById('app-boot')?.classList.contains('app-boot--closing')).toBe(true)
  })

  it('force-removes the overlay if the normal dismissal timer does not run', () => {
    const realSetTimeout = window.setTimeout.bind(window)
    const setTimeoutSpy = vi
      .spyOn(window, 'setTimeout')
      // @ts-expect-error - DOM setTimeout returns number; Vitest/Node expects Timeout; mock must return compatible value
      .mockImplementation((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
        if (timeout === 1500) {
          return realSetTimeout(handler, timeout, ...args)
        }

        return 0
      })

    dismissBootScreen()

    vi.advanceTimersByTime(1499)
    expect(document.getElementById('app-boot')).not.toBeNull()

    vi.advanceTimersByTime(1)
    expect(document.getElementById('app-boot')).toBeNull()

    setTimeoutSpy.mockRestore()
  })
})
