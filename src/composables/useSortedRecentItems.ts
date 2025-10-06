import { computed, type ComputedRef } from 'vue'

interface ItemWithTimestamp {
  id: string
  updated_at?: string | null
  [key: string]: unknown
}

/**
 * Composable that sorts items by updated_at timestamp and returns the most recent ones
 * @param items - Array of items with updated_at timestamp
 * @param maxItems - Maximum number of items to return
 * @returns Computed array of sorted recent items
 */
export function useSortedRecentItems<T extends ItemWithTimestamp>(
  items: ComputedRef<T[]>,
  maxItems: number,
): ComputedRef<T[]> {
  return computed(() => {
    return [...items.value]
      .filter((item) => item.updated_at)
      .sort((a, b) => {
        const dateA = new Date(a.updated_at || 0).getTime()
        const dateB = new Date(b.updated_at || 0).getTime()
        return dateB - dateA
      })
      .slice(0, maxItems)
  })
}
