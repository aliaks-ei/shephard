import { afterEach, describe, expect, it } from 'vitest'
import {
  isClientOnline,
  OfflineActionError,
  requireOnline,
  startNetworkMonitoring,
  useNetworkStatus,
} from './useNetworkStatus'

const originalOnline = navigator.onLine

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    value,
  })
}

afterEach(() => {
  setOnline(originalOnline)
  window.dispatchEvent(new Event(originalOnline ? 'online' : 'offline'))
})

describe('network status', () => {
  it('tracks browser online and offline events', () => {
    const stop = startNetworkMonitoring()
    const { isOnline, isOffline } = useNetworkStatus()

    setOnline(false)
    window.dispatchEvent(new Event('offline'))

    expect(isOnline.value).toBe(false)
    expect(isOffline.value).toBe(true)

    setOnline(true)
    window.dispatchEvent(new Event('online'))

    expect(isOnline.value).toBe(true)
    stop()
  })

  it('rejects online-required actions while offline', () => {
    setOnline(false)

    expect(isClientOnline()).toBe(false)
    expect(() => requireOnline()).toThrow(OfflineActionError)
  })
})
