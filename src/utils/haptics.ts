/**
 * Light haptic tap for gesture thresholds (swipe-to-delete, sheet dismiss).
 * Only Android exposes the Vibration API in a PWA; everywhere else this is a no-op.
 */
export function hapticTap(pattern: number | number[] = 10): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return
  }
  try {
    navigator.vibrate(pattern)
  } catch {
    // ignore — vibration is best-effort feedback
  }
}
