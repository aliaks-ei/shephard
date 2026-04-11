import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  isAppleMobileDevice,
  isNavigatorStandalone,
  isRunningStandaloneApp,
  isStandaloneDisplayMode,
} from './pwa'

describe('pwa utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({ matches: false })),
    })

    Object.defineProperty(window.navigator, 'standalone', {
      writable: true,
      value: undefined,
    })
    Object.defineProperty(window.navigator, 'platform', {
      writable: true,
      value: 'MacIntel',
    })
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0',
    })
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      writable: true,
      value: 0,
    })
  })

  it('detects standalone display mode', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({ matches: true })),
    })

    expect(isStandaloneDisplayMode()).toBe(true)
  })

  it('detects navigator standalone mode', () => {
    Object.defineProperty(window.navigator, 'standalone', {
      writable: true,
      value: true,
    })

    expect(isNavigatorStandalone()).toBe(true)
    expect(isRunningStandaloneApp()).toBe(true)
  })

  it('detects iPhone and iPad user agents', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
    })

    expect(isAppleMobileDevice()).toBe(true)
  })

  it('detects iPadOS desktop-class user agents via MacIntel touch support', () => {
    Object.defineProperty(window.navigator, 'platform', {
      writable: true,
      value: 'MacIntel',
    })
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      writable: true,
      value: 5,
    })

    expect(isAppleMobileDevice()).toBe(true)
  })

  it('does not mark non-Apple desktop browsers as Apple mobile devices', () => {
    Object.defineProperty(window.navigator, 'platform', {
      writable: true,
      value: 'Linux x86_64',
    })
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (X11; Linux x86_64)',
    })

    expect(isAppleMobileDevice()).toBe(false)
  })
})
