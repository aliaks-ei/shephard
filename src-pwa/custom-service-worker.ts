/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.config file > pwa > workboxMode is set to "InjectManifest"
 */

type ClientLike = {
  postMessage: (message: unknown) => void
}

type WindowClientLike = ClientLike & {
  focus: () => Promise<WindowClientLike>
}

type ClientsLike = {
  matchAll: (options?: {
    includeUncontrolled?: boolean
    type?: 'window'
  }) => Promise<WindowClientLike[]>
  openWindow: (url: string) => Promise<WindowClientLike | null>
}

type ServiceWorkerGlobal = ServiceWorkerGlobalScope &
  typeof globalThis & {
    clients: ClientsLike
    registration: ServiceWorkerRegistration
    skipWaiting: () => void
  }

type PushEventLike = Event & {
  data?: {
    json: () => unknown
    text: () => string
  }
  waitUntil: (promise: Promise<unknown>) => void
}

type NotificationClickEventLike = Event & {
  notification: Notification
  waitUntil: (promise: Promise<unknown>) => void
}

type PushSubscriptionChangeEventLike = Event & {
  oldSubscription?: PushSubscription | null
  waitUntil: (promise: Promise<unknown>) => void
}

declare const self: ServiceWorkerGlobal

import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies'

type PushPayload = {
  body?: string
  notificationId?: string
  title?: string
  url?: string
}

function isSameOrigin(url: URL): boolean {
  return url.origin === self.location.origin
}

type StrategyPlugin = NonNullable<
  NonNullable<ConstructorParameters<typeof NetworkFirst>[0]>['plugins']
>[number]

function asStrategyPlugin(plugin: unknown): StrategyPlugin {
  return plugin as StrategyPlugin
}

void self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

if (process.env.PROD) {
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL(process.env.PWA_FALLBACK_HTML), {
      denylist: [new RegExp(process.env.PWA_SERVICE_WORKER_REGEX), /workbox-(.)*\.js$/],
    }),
  )
}

registerRoute(
  ({ url }) => /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/.test(url.href),
  new NetworkFirst({
    cacheName: 'supabase-api',
    networkTimeoutSeconds: 3,
    plugins: [
      asStrategyPlugin(new CacheableResponsePlugin({ statuses: [0, 200] })),
      asStrategyPlugin(
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 5,
        }),
      ),
    ],
  }),
)

registerRoute(
  ({ url }) => /^https:\/\/.*\.supabase\.co\/auth\/.*/.test(url.href),
  new NetworkOnly(),
)

// Never cache dev-server modules: Vite serves scripts/styles with rotating hashes.
// CacheFirst here mixes stale and fresh chunks and breaks Vue (e.g. renderSlot / internal `ce`).
if (process.env.PROD) {
  registerRoute(
    ({ request, url }) =>
      isSameOrigin(url) && (request.destination === 'script' || request.destination === 'style'),
    new CacheFirst({
      cacheName: 'static-assets',
      plugins: [
        asStrategyPlugin(
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          }),
        ),
      ],
    }),
  )
}

registerRoute(
  ({ url }) => /^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(url.href),
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      asStrategyPlugin(
        new ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        }),
      ),
    ],
  }),
)

registerRoute(
  ({ request, url }) => isSameOrigin(url) && request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      asStrategyPlugin(
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 90,
        }),
      ),
    ],
  }),
)

async function broadcastMessage(message: unknown) {
  const windowClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  })

  for (const client of windowClients) {
    client.postMessage(message)
  }
}

self.addEventListener('push', (event: Event) => {
  const pushEvent = event as PushEventLike
  const payload: PushPayload = (() => {
    try {
      return (pushEvent.data?.json() ?? {}) as PushPayload
    } catch {
      return {
        title: 'Shephard',
        body: pushEvent.data?.text() ?? 'You have a new notification.',
      }
    }
  })()

  pushEvent.waitUntil(
    self.registration.showNotification(payload.title ?? 'Shephard', {
      body: payload.body ?? 'You have a new notification.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-128x128.png',
      tag: payload.notificationId ?? `notification-${Date.now()}`,
      data: {
        url: payload.url ?? '/',
      },
    }),
  )
})

self.addEventListener('notificationclick', (event: Event) => {
  const clickEvent = event as NotificationClickEventLike
  const targetUrl = String((clickEvent.notification.data as { url?: string } | null)?.url ?? '/')

  clickEvent.notification.close()
  clickEvent.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const client of windowClients) {
        if ('focus' in client) {
          await client.focus()
          client.postMessage({
            type: 'open-notification-route',
            url: targetUrl,
          })
          return
        }
      }

      await self.clients.openWindow(targetUrl)
    })(),
  )
})

self.addEventListener('pushsubscriptionchange', (event: Event) => {
  const changeEvent = event as PushSubscriptionChangeEventLike

  changeEvent.waitUntil(
    (async () => {
      const applicationServerKey = changeEvent.oldSubscription?.options?.applicationServerKey

      if (!applicationServerKey) {
        await broadcastMessage({
          type: 'push-subscription-changed',
          oldEndpoint: changeEvent.oldSubscription?.endpoint ?? null,
          subscription: null,
        })
        return
      }

      try {
        const subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        })

        await broadcastMessage({
          type: 'push-subscription-changed',
          oldEndpoint: changeEvent.oldSubscription?.endpoint ?? null,
          subscription: subscription.toJSON(),
        })
      } catch {
        await broadcastMessage({
          type: 'push-subscription-changed',
          oldEndpoint: changeEvent.oldSubscription?.endpoint ?? null,
          subscription: null,
        })
      }
    })(),
  )
})
