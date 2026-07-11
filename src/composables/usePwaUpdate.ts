import { computed, onMounted, onUnmounted, ref } from 'vue'

const UPDATE_AVAILABLE_EVENT = 'shephard:pwa-update-available'
const UPDATE_BLOCKER_SELECTOR = '[data-pwa-update-blocker]'

type PwaUpdateWindow = Window & {
  __shephardPendingServiceWorkerUpdate?: ServiceWorkerRegistration
}

type UpdateAvailableEvent = CustomEvent<{
  registration: ServiceWorkerRegistration
}>

type UpdateResult = 'activating' | 'blocked' | 'unavailable'

export function usePwaUpdate() {
  const registration = ref<ServiceWorkerRegistration | null>(null)
  const isApplying = ref(false)
  const hasBlockingWork = ref(false)
  const requiresReload = ref(false)
  const dirtyForms = new Set<Element>()
  let blockerObserver: MutationObserver | null = null
  let shouldReloadOnControllerChange = false

  const isUpdateAvailable = computed(
    () => registration.value?.waiting != null || requiresReload.value,
  )

  function refreshBlockingWork(): void {
    for (const form of dirtyForms) {
      if (!form.isConnected) {
        dirtyForms.delete(form)
      }
    }

    const hasOpenDialog =
      typeof document !== 'undefined' &&
      document.querySelector(`${UPDATE_BLOCKER_SELECTOR}[data-pwa-update-blocker="dialog"]`) !==
        null

    hasBlockingWork.value = hasOpenDialog || dirtyForms.size > 0
  }

  function handlePotentialFormChange(event: Event): void {
    if (!(event.target instanceof Element)) {
      return
    }

    const form = event.target.closest(`${UPDATE_BLOCKER_SELECTOR}[data-pwa-update-blocker="form"]`)
    if (!form) {
      return
    }

    dirtyForms.add(form)
    refreshBlockingWork()
  }

  function handleUpdateAvailable(event: Event): void {
    const updateEvent = event as UpdateAvailableEvent
    registration.value = updateEvent.detail.registration
    requiresReload.value = false
    refreshBlockingWork()
  }

  function handleControllerChange(): void {
    if (!shouldReloadOnControllerChange) {
      if (!registration.value) {
        return
      }

      registration.value = null
      requiresReload.value = true
      return
    }

    shouldReloadOnControllerChange = false
    window.location.reload()
  }

  function activateUpdate(): UpdateResult {
    refreshBlockingWork()

    if (hasBlockingWork.value) {
      return 'blocked'
    }

    if (requiresReload.value) {
      isApplying.value = true
      window.location.reload()
      return 'activating'
    }

    const waitingWorker = registration.value?.waiting
    if (!waitingWorker) {
      return 'unavailable'
    }

    isApplying.value = true
    shouldReloadOnControllerChange = true
    waitingWorker.postMessage({ type: 'skip-waiting' })
    return 'activating'
  }

  onMounted(() => {
    const pwaWindow = window as PwaUpdateWindow
    registration.value = pwaWindow.__shephardPendingServiceWorkerUpdate ?? null

    window.addEventListener(UPDATE_AVAILABLE_EVENT, handleUpdateAvailable)
    navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange)
    document.addEventListener('input', handlePotentialFormChange, true)
    document.addEventListener('change', handlePotentialFormChange, true)
    document.addEventListener('click', handlePotentialFormChange, true)

    blockerObserver = new MutationObserver(refreshBlockingWork)
    blockerObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-pwa-update-blocker'],
    })
    refreshBlockingWork()
  })

  onUnmounted(() => {
    window.removeEventListener(UPDATE_AVAILABLE_EVENT, handleUpdateAvailable)
    navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange)
    document.removeEventListener('input', handlePotentialFormChange, true)
    document.removeEventListener('change', handlePotentialFormChange, true)
    document.removeEventListener('click', handlePotentialFormChange, true)
    blockerObserver?.disconnect()
  })

  return {
    activateUpdate,
    hasBlockingWork,
    isApplying,
    isUpdateAvailable,
  }
}
