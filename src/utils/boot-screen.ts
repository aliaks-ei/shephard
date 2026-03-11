const BOOT_OVERLAY_ID = 'app-boot'
const BOOT_CLOSING_CLASS = 'app-boot--closing'
const MIN_VISIBLE_MS = 180
const FADE_DURATION_MS = 220
const FORCE_CLEANUP_MS = 1500

function getBootOverlay() {
  return document.getElementById(BOOT_OVERLAY_ID)
}

function removeBootOverlay() {
  const overlay = getBootOverlay()
  if (!overlay) return

  overlay.remove()
  delete document.documentElement.dataset.bootStartedAt
  delete document.documentElement.dataset.iosStandaloneBoot
}

export function dismissBootScreen() {
  const overlay = getBootOverlay()

  if (!overlay || overlay.dataset.dismissing === 'true') {
    return
  }

  overlay.dataset.dismissing = 'true'

  const startedAt = Number.parseInt(document.documentElement.dataset.bootStartedAt || '', 10)
  const elapsed = Number.isFinite(startedAt) ? Date.now() - startedAt : MIN_VISIBLE_MS
  const remainingDelay = Math.max(0, MIN_VISIBLE_MS - elapsed)

  window.setTimeout(() => {
    overlay.classList.add(BOOT_CLOSING_CLASS)

    window.setTimeout(() => {
      removeBootOverlay()
    }, FADE_DURATION_MS)
  }, remainingDelay)

  window.setTimeout(() => {
    removeBootOverlay()
  }, FORCE_CLEANUP_MS)
}
