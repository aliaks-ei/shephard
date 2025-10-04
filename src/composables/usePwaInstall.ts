import { ref, onMounted, onUnmounted } from 'vue'
import { useStorage } from '@vueuse/core'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const PWA_INSTALL_DISMISSED_KEY = 'pwa-install-dismissed'
const DISMISS_DURATION_DAYS = 30

export function usePwaInstall() {
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
  const isInstallable = ref(false)
  const isInstalled = ref(false)
  const dismissedTimestamp = useStorage<number | null>(PWA_INSTALL_DISMISSED_KEY, null)

  function isDismissed(): boolean {
    if (!dismissedTimestamp.value) return false

    const now = Date.now()
    const daysInMs = DISMISS_DURATION_DAYS * 24 * 60 * 60 * 1000

    // Check if dismissal has expired
    if (now - dismissedTimestamp.value > daysInMs) {
      dismissedTimestamp.value = null
      return false
    }

    return true
  }

  function checkIfInstalled(): boolean {
    // Check if running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true
    }

    // Check for iOS standalone mode
    if (
      'standalone' in window.navigator &&
      (window.navigator as unknown as { standalone?: boolean }).standalone
    ) {
      return true
    }

    return false
  }

  function handleBeforeInstallPrompt(event: Event) {
    // Prevent the default mini-infobar from appearing on mobile
    event.preventDefault()

    // Check if already installed or user dismissed recently
    if (checkIfInstalled() || isDismissed()) {
      return
    }

    // Store the event for later use
    deferredPrompt.value = event as BeforeInstallPromptEvent
    isInstallable.value = true
  }

  async function promptInstall(): Promise<'accepted' | 'dismissed' | 'error'> {
    if (!deferredPrompt.value) {
      return 'error'
    }

    try {
      // Show the install prompt
      await deferredPrompt.value.prompt()

      // Wait for the user's response
      const choiceResult = await deferredPrompt.value.userChoice

      // Clear the deferred prompt
      deferredPrompt.value = null
      isInstallable.value = false

      return choiceResult.outcome
    } catch (error) {
      console.error('Error showing install prompt:', error)
      return 'error'
    }
  }

  function dismissInstall() {
    dismissedTimestamp.value = Date.now()
    isInstallable.value = false
    deferredPrompt.value = null
  }

  function handleAppInstalled() {
    isInstalled.value = true
    isInstallable.value = false
    deferredPrompt.value = null
  }

  onMounted(() => {
    isInstalled.value = checkIfInstalled()

    if (isInstalled.value) return

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.removeEventListener('appinstalled', handleAppInstalled)
  })

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissInstall,
  }
}
