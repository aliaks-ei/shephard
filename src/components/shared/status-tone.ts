export type StatusTone = 'success' | 'warning' | 'destructive' | 'info' | 'muted'

/**
 * Maps the Quasar color names returned by `getStatusColor` (src/utils/plans.ts)
 * to a semantic `StatusPill` tone.
 */
export function statusColorToTone(color: string): StatusTone {
  switch (color) {
    case 'green':
    case 'positive':
      return 'success'
    case 'orange':
    case 'warning':
      return 'warning'
    case 'red':
    case 'negative':
      return 'destructive'
    case 'grey':
      return 'muted'
    default:
      return 'info'
  }
}
