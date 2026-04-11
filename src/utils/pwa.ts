function getNavigatorPlatform(): string {
  return typeof navigator !== 'undefined' ? navigator.platform || '' : ''
}

function getNavigatorUserAgent(): string {
  return typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
}

function getNavigatorMaxTouchPoints(): number {
  return typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia('(display-mode: standalone)').matches
}

export function isNavigatorStandalone(): boolean {
  if (typeof navigator === 'undefined' || !('standalone' in navigator)) {
    return false
  }

  return Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
}

export function isRunningStandaloneApp(): boolean {
  return isStandaloneDisplayMode() || isNavigatorStandalone()
}

export function isAppleMobileDevice(): boolean {
  const platform = getNavigatorPlatform()
  const userAgent = getNavigatorUserAgent()
  const maxTouchPoints = getNavigatorMaxTouchPoints()

  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}
