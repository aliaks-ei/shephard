import { ref, watch, onScopeDispose, toValue, type MaybeRefOrGetter } from 'vue'

/**
 * Animates a number toward its target value (hero metric count-up).
 * Renders the final value instantly when the user prefers reduced motion
 * or when `enabled` resolves to false (e.g. privacy mode).
 */
export function useCountUp(
  target: MaybeRefOrGetter<number>,
  options: { duration?: number; enabled?: MaybeRefOrGetter<boolean> } = {},
) {
  const duration = options.duration ?? 400
  const displayValue = ref(toValue(target))
  let rafId = 0

  function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : true
  }

  function stop() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  watch(
    () => toValue(target),
    (to) => {
      stop()

      const animationsEnabled = toValue(options.enabled ?? true)
      if (!animationsEnabled || prefersReducedMotion() || typeof window === 'undefined') {
        displayValue.value = to
        return
      }

      const from = displayValue.value
      if (from === to) return

      const start = performance.now()

      function step(now: number) {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        displayValue.value = from + (to - from) * eased

        if (progress < 1) {
          rafId = requestAnimationFrame(step)
        } else {
          displayValue.value = to
          rafId = 0
        }
      }

      rafId = requestAnimationFrame(step)
    },
  )

  onScopeDispose(stop)

  return { displayValue }
}
