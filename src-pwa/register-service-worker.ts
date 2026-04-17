import { register } from 'register-service-worker'
import {
  revokePushSubscription,
  savePushSubscription,
  type BrowserPushSubscription,
} from 'src/api/notifications'
import { sanitizeRedirectPath } from 'src/utils/navigation'

const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000

type BrowserDocument = {
  addEventListener: (event: 'visibilitychange', handler: () => void) => void
  visibilityState: 'visible' | 'hidden' | 'prerender' | 'unloaded'
}

type BrowserLocation = {
  href: string
  reload: () => void
}

type BrowserLikeGlobal = typeof globalThis & {
  document?: BrowserDocument
  location?: BrowserLocation
}

const browserGlobal = globalThis as BrowserLikeGlobal

type ServiceWorkerMessage =
  | {
      type: 'open-notification-route'
      url: string
    }
  | {
      type: 'push-subscription-changed'
      oldEndpoint?: string | null
      subscription: BrowserPushSubscription | null
    }

function checkForUpdates(registration?: ServiceWorkerRegistration): void {
  if (!registration) {
    return
  }

  void registration.update()
}

function isServiceWorkerMessage(data: unknown): data is ServiceWorkerMessage {
  if (typeof data !== 'object' || data === null || !('type' in data)) {
    return false
  }

  return data.type === 'open-notification-route' || data.type === 'push-subscription-changed'
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event: MessageEvent<unknown>) => {
    const message = event.data

    if (!isServiceWorkerMessage(message)) {
      return
    }

    if (message.type === 'open-notification-route') {
      if (message.url && browserGlobal.location) {
        browserGlobal.location.href = sanitizeRedirectPath(message.url, '/')
      }
      return
    }

    void (async () => {
      if (message.oldEndpoint) {
        await revokePushSubscription(message.oldEndpoint)
      }

      if (message.subscription?.endpoint) {
        await savePushSubscription(message.subscription)
      }
    })()
  })
}

// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

register(process.env.SERVICE_WORKER_FILE, {
  // The registrationOptions object will be passed as the second argument
  // to ServiceWorkerContainer.register()
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

  registrationOptions: { updateViaCache: 'none' },

  ready(/* registration */) {
    // console.log('Service worker is active.')
  },

  registered(registration) {
    // console.log('Service worker has been registered.')

    checkForUpdates(registration)

    browserGlobal.setInterval(() => {
      checkForUpdates(registration)
    }, UPDATE_CHECK_INTERVAL_MS)

    browserGlobal.document?.addEventListener('visibilitychange', () => {
      if (browserGlobal.document?.visibilityState === 'visible') {
        checkForUpdates(registration)
      }
    })
  },

  cached(/* registration */) {
    // console.log('Content has been cached for offline use.')
  },

  updatefound(/* registration */) {
    // console.log('New content is downloading.')
  },

  updated(registration) {
    // Force activate latest version right away for standalone iOS PWAs
    checkForUpdates(registration)
    browserGlobal.location?.reload()
  },

  offline() {
    // console.log('No internet connection found. App is running in offline mode.')
  },

  error(/* err */) {
    // console.error('Error during service worker registration:', err)
  },
})
