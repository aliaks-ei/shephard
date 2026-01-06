import { ref } from 'vue'

export type BannerVariant = 'success' | 'error' | 'warning' | 'info'

export interface BannerConfig {
  id: string
  variant: BannerVariant
  message: string
  dismissible?: boolean
  autoDismissMs?: number
  action?: {
    label: string
    handler: () => void
  }
}

const banners = ref<BannerConfig[]>([])

export function useBanner() {
  function showBanner(config: Omit<BannerConfig, 'id'>): string {
    // Check if banner with same message and variant already exists
    const existingBanner = banners.value.find(
      (b) => b.message === config.message && b.variant === config.variant,
    )
    if (existingBanner) {
      return existingBanner.id
    }

    const id = crypto.randomUUID()
    const banner: BannerConfig = {
      id,
      dismissible: true,
      ...config,
    }

    banners.value.push(banner)

    return id
  }

  function showSuccess(
    message: string,
    options?: Partial<Omit<BannerConfig, 'id' | 'variant' | 'message'>>,
  ): string {
    return showBanner({
      variant: 'success',
      message,
      autoDismissMs: 5000,
      ...options,
    })
  }

  function showError(
    message: string,
    options?: Partial<Omit<BannerConfig, 'id' | 'variant' | 'message'>>,
  ): string {
    return showBanner({
      variant: 'error',
      message,
      dismissible: true,
      autoDismissMs: 0,
      ...options,
    })
  }

  function showWarning(
    message: string,
    options?: Partial<Omit<BannerConfig, 'id' | 'variant' | 'message'>>,
  ): string {
    return showBanner({
      variant: 'warning',
      message,
      autoDismissMs: 5000,
      ...options,
    })
  }

  function showInfo(
    message: string,
    options?: Partial<Omit<BannerConfig, 'id' | 'variant' | 'message'>>,
  ): string {
    return showBanner({
      variant: 'info',
      message,
      autoDismissMs: 5000,
      ...options,
    })
  }

  function dismissBanner(id: string): void {
    const index = banners.value.findIndex((b) => b.id === id)
    if (index !== -1) {
      banners.value.splice(index, 1)
    }
  }

  function clearAllBanners(): void {
    banners.value = []
  }

  return {
    banners,
    showBanner,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissBanner,
    clearAllBanners,
  }
}
