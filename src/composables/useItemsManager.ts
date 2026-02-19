import { ref, computed, type Ref } from 'vue'

import { useCategoriesQuery } from 'src/queries/categories'
import type { BaseItemUI, BaseCategoryUI } from 'src/types'

export type CategoryGroup<T extends BaseItemUI = BaseItemUI> = BaseCategoryUI & {
  items: T[]
}

export interface ItemsConfig<T extends BaseItemUI> {
  itemsPropertyName: string
  createItemForSave: (item: T) => {
    name: string
    category_id: string
    amount: number
    is_fixed_payment: boolean
  }
}

export type ItemForSave = {
  id?: string
  name: string
  category_id: string
  amount: number
  is_fixed_payment: boolean
}

export function useItemsManager<T extends BaseItemUI>(config: ItemsConfig<T>) {
  const { getCategoryById } = useCategoriesQuery()

  const items: Ref<T[]> = ref([])

  const totalAmount = computed(() => items.value.reduce((total, item) => total + item.amount, 0))
  const hasItems = computed(() => items.value.length > 0)
  const hasValidItems = computed(
    () =>
      hasItems.value &&
      items.value.every((item) => item.name.trim() && item.categoryId && item.amount > 0),
  )

  const hasDuplicateItems = computed(() => {
    const seen = new Set<string>()
    return items.value.some((item) => {
      if (!item.name.trim() || !item.categoryId) return false

      const key = `${item.categoryId}-${item.name.trim().toLowerCase()}`
      if (seen.has(key)) return true

      seen.add(key)

      return false
    })
  })

  const isValidForSave = computed(() => hasValidItems.value && !hasDuplicateItems.value)
  const categoryGroups = computed((): CategoryGroup<T>[] => {
    const groups = new Map<string, CategoryGroup<T>>()

    items.value.forEach((item) => {
      if (!item.categoryId) return

      if (!groups.has(item.categoryId)) {
        groups.set(item.categoryId, {
          categoryId: item.categoryId,
          categoryName: '',
          categoryColor: item.color,
          categoryIcon: '',
          items: [],
          subtotal: 0,
        })
      }

      const group = groups.get(item.categoryId)!
      group.items.push(item)
      group.subtotal += item.amount
    })

    return [...groups.values()]
  })

  function addItem(categoryId: string, categoryColor: string): void {
    const newItem = {
      id: `temp_${crypto.randomUUID()}`,
      name: '',
      categoryId,
      amount: 0,
      color: categoryColor,
      isFixedPayment: true,
    } as T

    items.value.push(newItem)
  }

  function getUsedCategoryIds(): string[] {
    return [...new Set(items.value.map((item) => item.categoryId).filter(Boolean))]
  }

  function updateItem(itemId: string, updates: Partial<T> | T): void {
    const itemIndex = items.value.findIndex((item) => item.id === itemId)
    if (itemIndex === -1) return

    const currentItem = items.value[itemIndex]
    if (!currentItem) return

    items.value[itemIndex] = {
      id: currentItem.id,
      name: updates.name ?? currentItem.name,
      categoryId: updates.categoryId ?? currentItem.categoryId,
      amount: updates.amount ?? currentItem.amount,
      color: updates.color ?? currentItem.color,
      isFixedPayment: updates.isFixedPayment ?? currentItem.isFixedPayment,
    } as T
  }

  function removeItem(itemId: string): void {
    items.value = items.value.filter((item) => item.id !== itemId)
  }

  function loadItemsFromEntity<E extends Record<string, unknown>>(entity: E): void {
    const entityItems = entity[config.itemsPropertyName] as Array<{
      id: string
      name: string
      category_id: string
      amount: number
      is_fixed_payment?: boolean
    }>

    const loadedItems = entityItems.reduce((acc, item) => {
      const category = getCategoryById(item.category_id)

      if (category) {
        acc.push({
          id: item.id,
          name: item.name || '',
          categoryId: item.category_id,
          amount: item.amount,
          color: category.color || '',
          isFixedPayment: item.is_fixed_payment ?? true,
        } as T)
      }

      return acc
    }, [] as T[])

    items.value = [...loadedItems]
  }

  function loadItemsFromTemplate(
    templateItems: {
      id: string
      name: string
      category_id: string
      amount: number
      is_fixed_payment?: boolean
    }[],
  ): void {
    const loadedItems = templateItems.reduce((acc, item) => {
      const category = getCategoryById(item.category_id)

      if (category) {
        acc.push({
          id: `temp_${crypto.randomUUID()}`,
          name: item.name || '',
          categoryId: item.category_id,
          amount: item.amount,
          color: category.color || '',
          isFixedPayment: item.is_fixed_payment ?? true,
        } as T)
      }

      return acc
    }, [] as T[])

    items.value = [...loadedItems]
  }

  function getItemsForSave(): ItemForSave[] {
    return items.value
      .filter((item) => item.name.trim() && item.categoryId && item.amount > 0)
      .map((item) => {
        const baseItem = config.createItemForSave(item)
        const isExistingItem = !item.id.startsWith('temp_')
        return isExistingItem ? { id: item.id, ...baseItem } : baseItem
      })
  }

  function clearItems(): void {
    items.value = []
  }

  return {
    items,
    totalAmount,
    hasItems,
    hasValidItems,
    hasDuplicateItems,
    isValidForSave,
    categoryGroups,
    addItem,
    updateItem,
    removeItem,
    loadItemsFromEntity,
    loadItemsFromTemplate,
    getItemsForSave,
    getUsedCategoryIds,
    clearItems,
  }
}
