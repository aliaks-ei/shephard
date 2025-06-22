import { ref, computed } from 'vue'
import { useCategoriesStore } from 'src/stores/categories'
import type { TemplateCategoryItem, Category } from 'src/api'

export function useTemplateCategoryItems() {
  const categoriesStore = useCategoriesStore()
  const categoryItems = ref<TemplateCategoryItem[]>([])

  const totalAmount = computed(() =>
    categoryItems.value.reduce((total, item) => total + item.amount, 0),
  )

  const hasValidItems = computed(
    () =>
      categoryItems.value.length > 0 &&
      categoryItems.value.every((item) => item.categoryId && item.amount > 0),
  )

  function addCategoryItem(): void {
    categoryItems.value.push({
      id: `temp_${crypto.randomUUID()}`,
      categoryId: '',
      amount: 0,
      color: '#6B7280',
    })
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
      categoryId: updates.categoryId || currentItem.categoryId,
      amount: updates.amount || currentItem.amount,
      color: updates.color || currentItem.color,
    }
  }

  function removeCategoryItem(itemId: string): void {
    categoryItems.value = categoryItems.value.filter((item) => item.id !== itemId)
  }

  function getAvailableCategoriesForItem(itemId: string): Category[] {
    const currentItemCategoryId = categoryItems.value.find((item) => item.id === itemId)?.categoryId
    const otherUsedCategoryIds = categoryItems.value
      .filter((item) => item.id !== itemId)
      .map((item) => item.categoryId)

    return categoriesStore.categories.filter(
      (category) =>
        !otherUsedCategoryIds.includes(category.id) || category.id === currentItemCategoryId,
    )
  }

  function validateCategoryItems(): boolean {
    return hasValidItems.value
  }

  function resetCategoryItems(): void {
    categoryItems.value = []
  }

  function loadCategoryItems(items: TemplateCategoryItem[]): void {
    categoryItems.value = [...items]
  }

  function getCategoryItemsForSave() {
    return categoryItems.value
      .filter((item) => item.categoryId && item.amount > 0)
      .map((item) => ({
        category_id: item.categoryId,
        amount: item.amount,
      }))
  }

  return {
    categoryItems,
    totalAmount,
    hasValidItems,
    addCategoryItem,
    updateCategoryItem,
    removeCategoryItem,
    getAvailableCategoriesForItem,
    validateCategoryItems,
    resetCategoryItems,
    loadCategoryItems,
    getCategoryItemsForSave,
  }
}
