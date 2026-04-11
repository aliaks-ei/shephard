;(() => {
  const { navigator } = window
  const platform = navigator.platform || ''
  const userAgent = navigator.userAgent || ''
  const maxTouchPoints = navigator.maxTouchPoints || 0
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
  const isStandalone = navigator.standalone === true
  const root = document.documentElement

  if (isIOS && isStandalone) {
    const prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

    root.dataset.iosStandaloneBoot = 'true'
    root.dataset.bootTheme = prefersDark ? 'dark' : 'light'
    root.dataset.bootStartedAt = String(Date.now())
    return
  }

  root.dataset.iosStandaloneBoot = 'false'
  window.addEventListener(
    'DOMContentLoaded',
    () => {
      document.getElementById('app-boot')?.remove()
    },
    { once: true },
  )
})()
