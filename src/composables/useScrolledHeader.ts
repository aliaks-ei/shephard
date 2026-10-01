import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Tracks whether the window has scrolled past a small threshold so headers can
 * switch from transparent to a glass surface, the way native large-title bars do.
 * `isCollapsed` turns on while the user scrolls down, so the tab bar can minimise,
 * and turns off on any scroll up.
 */
export function useScrolledHeader(threshold = 8, collapseAfter = 120) {
  const isScrolled = ref(false)
  const isCollapsed = ref(false)
  let lastY = 0

  function update() {
    if (typeof window === 'undefined') return
    const y = Math.max(0, window.scrollY)
    isScrolled.value = y > threshold
    // Ignore tiny deltas so iOS rubber-band bounce does not toggle the bar.
    if (Math.abs(y - lastY) < 6) return
    isCollapsed.value = y > lastY && y > collapseAfter
    lastY = y
  }

  onMounted(() => {
    update()
    window.addEventListener('scroll', update, { passive: true })
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('scroll', update)
  })

  return { isScrolled, isCollapsed }
}
