import { computed, type ComputedRef } from 'vue'

interface ItemWithTimestamp {
  id: string
  created_at?: string | null
  updated_at?: string | null
  [key: string]: unknown
}

export function useSortedRecentItems<T extends ItemWithTimestamp>(
  items: ComputedRef<T[]>,
  maxItems: number,
): ComputedRef<T[]> {
  return computed(() => {
    return [...items.value]
      .filter((item) => item.updated_at || item.created_at)
      .sort((a, b) => {
        const dateA = new Date((a.updated_at || a.created_at) ?? 0).getTime()
        const dateB = new Date((b.updated_at || b.created_at) ?? 0).getTime()
        return dateB - dateA
      })
      .slice(0, maxItems)
  })
}
