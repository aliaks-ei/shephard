import { register } from 'register-service-worker'

const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000

type BrowserDocument = {
  addEventListener: (event: 'visibilitychange', handler: () => void) => void
  visibilityState: 'visible' | 'hidden' | 'prerender' | 'unloaded'
}

type BrowserLocation = {
  reload: () => void
}

type BrowserLikeGlobal = typeof globalThis & {
  document?: BrowserDocument
  location?: BrowserLocation
}

const browserGlobal = globalThis as BrowserLikeGlobal

function checkForUpdates(registration?: ServiceWorkerRegistration): void {
  if (!registration) {
    return
  }

  void registration.update()
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
