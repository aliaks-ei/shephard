import { computed, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useSortedRecentItems } from './useSortedRecentItems'

describe('useSortedRecentItems', () => {
  it('returns items sorted by most recent first', () => {
    const items = computed(() => [
      { id: 'item-1', updated_at: '2024-01-01T10:00:00Z' },
      { id: 'item-2', updated_at: '2024-01-03T10:00:00Z' },
      { id: 'item-3', updated_at: '2024-01-02T10:00:00Z' },
    ])

    const sortedItems = useSortedRecentItems(items, 10)

    expect(sortedItems.value).toHaveLength(3)
    expect(sortedItems.value[0]?.id).toBe('item-2')
    expect(sortedItems.value[1]?.id).toBe('item-3')
    expect(sortedItems.value[2]?.id).toBe('item-1')
  })

  it('limits results to maxItems', () => {
    const items = computed(() => [
      { id: 'item-1', updated_at: '2024-01-01T10:00:00Z' },
      { id: 'item-2', updated_at: '2024-01-03T10:00:00Z' },
      { id: 'item-3', updated_at: '2024-01-02T10:00:00Z' },
      { id: 'item-4', updated_at: '2024-01-04T10:00:00Z' },
    ])

    const sortedItems = useSortedRecentItems(items, 2)

    expect(sortedItems.value).toHaveLength(2)
    expect(sortedItems.value[0]?.id).toBe('item-4')
    expect(sortedItems.value[1]?.id).toBe('item-2')
  })

  it('filters out items without updated_at', () => {
    const items = computed(() => [
      { id: 'item-1', updated_at: '2024-01-01T10:00:00Z' },
      { id: 'item-2', updated_at: null },
      { id: 'item-3', updated_at: '2024-01-02T10:00:00Z' },
      { id: 'item-4' },
    ])

    const sortedItems = useSortedRecentItems(items, 10)

    expect(sortedItems.value).toHaveLength(2)
    expect(sortedItems.value[0]?.id).toBe('item-3')
    expect(sortedItems.value[1]?.id).toBe('item-1')
  })

  it('returns empty array when no items have updated_at', () => {
    const items = computed(() => [{ id: 'item-1' }, { id: 'item-2', updated_at: null }])

    const sortedItems = useSortedRecentItems(items, 10)

    expect(sortedItems.value).toEqual([])
  })

  it('returns empty array when items list is empty', () => {
    const items = computed(() => [])

    const sortedItems = useSortedRecentItems(items, 10)

    expect(sortedItems.value).toEqual([])
  })

  it('reacts to changes in items', () => {
    const itemsRef = ref([{ id: 'item-1', updated_at: '2024-01-01T10:00:00Z' }])
    const items = computed(() => itemsRef.value)

    const sortedItems = useSortedRecentItems(items, 10)

    expect(sortedItems.value).toHaveLength(1)
    expect(sortedItems.value[0]?.id).toBe('item-1')

    itemsRef.value = [
      { id: 'item-1', updated_at: '2024-01-01T10:00:00Z' },
      { id: 'item-2', updated_at: '2024-01-02T10:00:00Z' },
    ]

    expect(sortedItems.value).toHaveLength(2)
    expect(sortedItems.value[0]?.id).toBe('item-2')
    expect(sortedItems.value[1]?.id).toBe('item-1')
  })

  it('handles items with same updated_at timestamp', () => {
    const items = computed(() => [
      { id: 'item-1', updated_at: '2024-01-01T10:00:00Z' },
      { id: 'item-2', updated_at: '2024-01-01T10:00:00Z' },
      { id: 'item-3', updated_at: '2024-01-02T10:00:00Z' },
    ])

    const sortedItems = useSortedRecentItems(items, 10)

    expect(sortedItems.value).toHaveLength(3)
    expect(sortedItems.value[0]?.id).toBe('item-3')
  })
})
