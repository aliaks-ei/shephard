import { computed, readonly, ref } from 'vue'

const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine !== false)
let stopMonitoring: (() => void) | null = null

export class OfflineActionError extends Error {
  constructor() {
    super('This action requires an internet connection')
    this.name = 'OFFLINE_ACTION'
  }
}

export function isOfflineActionError(error: unknown): error is OfflineActionError {
  return (
    error instanceof OfflineActionError ||
    (error instanceof Error && error.name === 'OFFLINE_ACTION')
  )
}

export function isClientOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine !== false
}

export function requireOnline(): void {
  if (!isClientOnline()) {
    throw new OfflineActionError()
  }
}

export function startNetworkMonitoring(): () => void {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  if (stopMonitoring) {
    return stopMonitoring
  }

  const updateStatus = () => {
    isOnline.value = navigator.onLine !== false
  }

  window.addEventListener('online', updateStatus)
  window.addEventListener('offline', updateStatus)
  updateStatus()

  stopMonitoring = () => {
    window.removeEventListener('online', updateStatus)
    window.removeEventListener('offline', updateStatus)
    stopMonitoring = null
  }

  return stopMonitoring
}

export function useNetworkStatus() {
  const isOffline = computed(() => !isOnline.value)

  return {
    isOnline: readonly(isOnline),
    isOffline,
    requireOnline,
  }
}
