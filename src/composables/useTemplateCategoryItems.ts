import { ref, computed } from 'vue'
import type { TemplateCategoryItem } from 'src/api'

export type CategoryGroup = {
  categoryId: string
  categoryName: string
  categoryColor: string
  items: TemplateCategoryItem[]
  subtotal: number
}

export function useTemplateCategoryItems() {
  const categoryItems = ref<TemplateCategoryItem[]>([])

  const totalAmount = computed(() =>
    categoryItems.value.reduce((total, item) => total + item.amount, 0),
  )

  const hasValidItems = computed(
    () =>
      categoryItems.value.length > 0 &&
      categoryItems.value.every((item) => item.name.trim() && item.categoryId && item.amount > 0),
  )

  // Check for duplicate name+category combinations
  const hasDuplicateItems = computed(() => {
    const seen = new Set<string>()
    return categoryItems.value.some((item) => {
      if (!item.name.trim() || !item.categoryId) return false
      const key = `${item.categoryId}-${item.name.trim().toLowerCase()}`
      if (seen.has(key)) return true
      seen.add(key)
      return false
    })
  })

  const isValidForSave = computed(() => hasValidItems.value && !hasDuplicateItems.value)

  // Group items by category for enhanced display
  const categoryGroups = computed((): CategoryGroup[] => {
    const groups = new Map<string, CategoryGroup>()

    categoryItems.value.forEach((item) => {
      if (!item.categoryId) return

      if (!groups.has(item.categoryId)) {
        groups.set(item.categoryId, {
          categoryId: item.categoryId,
          categoryName: '', // Will be filled by the component using categories store
          categoryColor: item.color,
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

  function addCategoryItem(): void {
    categoryItems.value.push({
      id: `temp_${crypto.randomUUID()}`,
      name: '',
      categoryId: '',
      amount: 0,
      color: '#6B7280',
    })
  }

  function addCategoryGroup(categoryId: string, categoryColor: string): void {
    categoryItems.value.push({
      id: `temp_${crypto.randomUUID()}`,
      name: '',
      categoryId,
      amount: 0,
      color: categoryColor,
    })
  }

  function addItemToGroup(categoryId: string): void {
    // Find the category color from existing items in the group
    const existingItem = categoryItems.value.find((item) => item.categoryId === categoryId)
    const categoryColor = existingItem?.color || '#6B7280'

    categoryItems.value.push({
      id: `temp_${crypto.randomUUID()}`,
      name: '',
      categoryId,
      amount: 0,
      color: categoryColor,
    })
  }

  function getUsedCategoryIds(): string[] {
    return [...new Set(categoryItems.value.map((item) => item.categoryId).filter(Boolean))]
  }

  function updateCategoryItem(
    itemId: string,
    updates: Partial<TemplateCategoryItem> | TemplateCategoryItem,
  ): void {
    const itemIndex = categoryItems.value.findIndex((item) => item.id === itemId)
    if (itemIndex === -1) return

    const currentItem = categoryItems.value[itemIndex]
    if (!currentItem) return

    categoryItems.value[itemIndex] = {
      id: currentItem.id,
      name: updates.name || currentItem.name,
      categoryId: updates.categoryId || currentItem.categoryId,
      amount: updates.amount || currentItem.amount,
      color: updates.color || currentItem.color,
    }
  }

  function removeCategoryItem(itemId: string): void {
    categoryItems.value = categoryItems.value.filter((item) => item.id !== itemId)
  }

  function resetCategoryItems(): void {
    categoryItems.value = []
  }

  function loadCategoryItems(items: TemplateCategoryItem[]): void {
    categoryItems.value = [...items]
  }

  function getCategoryItemsForSave() {
    return categoryItems.value
      .filter((item) => item.name.trim() && item.categoryId && item.amount > 0)
      .map((item) => ({
        name: item.name.trim(),
        category_id: item.categoryId,
        amount: item.amount,
      }))
  }

  function isDuplicateNameCategory(name: string, categoryId: string, excludeId?: string): boolean {
    if (!name.trim() || !categoryId) return false

    return categoryItems.value.some((item) => {
      if (excludeId && item.id === excludeId) return false
      return (
        item.categoryId === categoryId &&
        item.name.trim().toLowerCase() === name.trim().toLowerCase()
      )
    })
  }

  return {
    categoryItems,
    totalAmount,
    hasValidItems,
    hasDuplicateItems,
    isValidForSave,
    categoryGroups,
    addCategoryItem,
    addCategoryGroup,
    addItemToGroup,
    updateCategoryItem,
    removeCategoryItem,
    resetCategoryItems,
    loadCategoryItems,
    getCategoryItemsForSave,
    isDuplicateNameCategory,
    getUsedCategoryIds,
  }
}
