import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Tracks whether the window has scrolled past a small threshold so headers can
 * switch from transparent to a glass surface, the way native large-title bars do.
 */
export function useScrolledHeader(threshold = 8) {
  const isScrolled = ref(false)

  function update() {
    if (typeof window === 'undefined') return
    isScrolled.value = window.scrollY > threshold
  }

  onMounted(() => {
    update()
    window.addEventListener('scroll', update, { passive: true })
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('scroll', update)
  })

  return { isScrolled }
}
