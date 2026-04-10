import type { BrowserPushSubscription } from 'src/api/notifications'

const MOCK_PERMISSION_KEY = 'mock-push-permission'
const MOCK_SUBSCRIPTION_KEY = 'mock-push-subscription'

export type PushPermissionState = NotificationPermission | 'unsupported'

function isMockMode(): boolean {
  return import.meta.env.VITE_MSW_ENABLED === 'true'
}

function createMockSubscription(): BrowserPushSubscription {
  const randomKey = crypto.randomUUID().replace(/-/g, '')

  return {
    endpoint: `https://mock.push.local/subscriptions/${crypto.randomUUID()}`,
    keys: {
      p256dh: `${randomKey}${randomKey}`.slice(0, 88),
      auth: randomKey.slice(0, 24),
    },
  }
}

const SW_READY_TIMEOUT_MS = 3000

async function getActiveRegistration(): Promise<ServiceWorkerRegistration | null> {
  try {
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), SW_READY_TIMEOUT_MS)),
    ])

    return registration
  } catch {
    return null
  }
}

export function isPushSupported(): boolean {
  if (isMockMode()) {
    return true
  }

  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function getPushPermissionState(): PushPermissionState {
  if (!isPushSupported()) {
    return 'unsupported'
  }

  if (isMockMode()) {
    return (localStorage.getItem(MOCK_PERMISSION_KEY) as NotificationPermission | null) ?? 'default'
  }

  return Notification.permission
}

export async function requestPushPermission(): Promise<PushPermissionState> {
  if (!isPushSupported()) {
    return 'unsupported'
  }

  if (isMockMode()) {
    localStorage.setItem(MOCK_PERMISSION_KEY, 'granted')
    return 'granted'
  }

  return Notification.requestPermission()
}

export async function getCurrentBrowserPushSubscription(): Promise<BrowserPushSubscription | null> {
  if (!isPushSupported()) {
    return null
  }

  if (isMockMode()) {
    const raw = localStorage.getItem(MOCK_SUBSCRIPTION_KEY)

    if (!raw) {
      return null
    }

    return JSON.parse(raw) as BrowserPushSubscription
  }

  const registration = await getActiveRegistration()

  if (!registration) {
    return null
  }

  const subscription = await registration.pushManager.getSubscription()

  return normalizeBrowserPushSubscription(subscription?.toJSON() ?? null)
}

function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)

  return Uint8Array.from(rawData, (char) => char.charCodeAt(0))
}

function normalizeBrowserPushSubscription(
  subscription: PushSubscriptionJSON | null,
): BrowserPushSubscription | null {
  if (!subscription?.endpoint) {
    return null
  }

  const keys =
    subscription.keys?.p256dh && subscription.keys?.auth
      ? {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        }
      : undefined

  return keys
    ? {
        endpoint: subscription.endpoint,
        keys,
      }
    : {
        endpoint: subscription.endpoint,
      }
}

export async function subscribeBrowserPush(
  publicKey: string,
): Promise<BrowserPushSubscription | null> {
  if (!isPushSupported()) {
    return null
  }

  if (isMockMode()) {
    const subscription = createMockSubscription()
    localStorage.setItem(MOCK_SUBSCRIPTION_KEY, JSON.stringify(subscription))
    localStorage.setItem(MOCK_PERMISSION_KEY, 'granted')
    return subscription
  }

  const registration = await getActiveRegistration()

  if (!registration) {
    return null
  }

  const existingSubscription = await registration.pushManager.getSubscription()

  if (existingSubscription) {
    return normalizeBrowserPushSubscription(existingSubscription.toJSON())
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })

  return normalizeBrowserPushSubscription(subscription.toJSON())
}

export async function unsubscribeBrowserPush(): Promise<string | null> {
  if (!isPushSupported()) {
    return null
  }

  if (isMockMode()) {
    const current = localStorage.getItem(MOCK_SUBSCRIPTION_KEY)
    localStorage.removeItem(MOCK_SUBSCRIPTION_KEY)
    return current ? ((JSON.parse(current) as BrowserPushSubscription).endpoint ?? null) : null
  }

  const registration = await getActiveRegistration()

  if (!registration) {
    return null
  }

  const subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    return null
  }

  const endpoint = subscription.endpoint
  await subscription.unsubscribe()

  return endpoint
}
