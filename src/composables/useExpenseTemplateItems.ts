import { ref, computed } from 'vue'
import type { ExpenseTemplateItemUI } from 'src/api'

export type ExpenseCategoryGroup = {
  categoryId: string
  categoryName: string
  categoryColor: string
  items: ExpenseTemplateItemUI[]
  subtotal: number
}

export function useExpenseTemplateItems() {
  const expenseTemplateItems = ref<ExpenseTemplateItemUI[]>([])

  const totalAmount = computed(() =>
    expenseTemplateItems.value.reduce((total, item) => total + item.amount, 0),
  )

  const hasValidItems = computed(
    () =>
      expenseTemplateItems.value.length > 0 &&
      expenseTemplateItems.value.every(
        (item) => item.name.trim() && item.categoryId && item.amount > 0,
      ),
  )

  // Check for duplicate name+category combinations
  const hasDuplicateItems = computed(() => {
    const seen = new Set<string>()
    return expenseTemplateItems.value.some((item) => {
      if (!item.name.trim() || !item.categoryId) return false
      const key = `${item.categoryId}-${item.name.trim().toLowerCase()}`
      if (seen.has(key)) return true
      seen.add(key)
      return false
    })
  })

  const isValidForSave = computed(() => hasValidItems.value && !hasDuplicateItems.value)

  // Group items by category for enhanced display
  const expenseCategoryGroups = computed((): ExpenseCategoryGroup[] => {
    const groups = new Map<string, ExpenseCategoryGroup>()

    expenseTemplateItems.value.forEach((item) => {
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

  function addExpenseTemplateItem(categoryId: string, categoryColor: string): void {
    expenseTemplateItems.value.push({
      id: `temp_${crypto.randomUUID()}`,
      name: '',
      categoryId,
      amount: 0,
      color: categoryColor,
    })
  }

  function getUsedCategoryIds(): string[] {
    return [...new Set(expenseTemplateItems.value.map((item) => item.categoryId).filter(Boolean))]
  }

  function updateExpenseTemplateItem(
    itemId: string,
    updates: Partial<ExpenseTemplateItemUI> | ExpenseTemplateItemUI,
  ): void {
    const itemIndex = expenseTemplateItems.value.findIndex((item) => item.id === itemId)
    if (itemIndex === -1) return

    const currentItem = expenseTemplateItems.value[itemIndex]
    if (!currentItem) return

    expenseTemplateItems.value[itemIndex] = {
      id: currentItem.id,
      name: updates.name || currentItem.name,
      categoryId: updates.categoryId || currentItem.categoryId,
      amount: updates.amount || currentItem.amount,
      color: updates.color || currentItem.color,
    }
  }

  function removeExpenseTemplateItem(itemId: string): void {
    expenseTemplateItems.value = expenseTemplateItems.value.filter((item) => item.id !== itemId)
  }

  function resetExpenseTemplateItems(): void {
    expenseTemplateItems.value = []
  }

  function loadExpenseTemplateItems(items: ExpenseTemplateItemUI[]): void {
    expenseTemplateItems.value = [...items]
  }

  function getExpenseTemplateItemsForSave() {
    return expenseTemplateItems.value
      .filter((item) => item.name.trim() && item.categoryId && item.amount > 0)
      .map((item) => ({
        name: item.name.trim(),
        category_id: item.categoryId,
        amount: item.amount,
      }))
  }

  function isDuplicateNameCategory(name: string, categoryId: string, excludeId?: string): boolean {
    if (!name.trim() || !categoryId) return false

    return expenseTemplateItems.value.some((item) => {
      if (excludeId && item.id === excludeId) return false
      return (
        item.categoryId === categoryId &&
        item.name.trim().toLowerCase() === name.trim().toLowerCase()
      )
    })
  }

  return {
    expenseTemplateItems,
    totalAmount,
    hasValidItems,
    hasDuplicateItems,
    isValidForSave,
    expenseCategoryGroups,
    addExpenseTemplateItem,
    updateExpenseTemplateItem,
    removeExpenseTemplateItem,
    resetExpenseTemplateItems,
    loadExpenseTemplateItems,
    getExpenseTemplateItemsForSave,
    isDuplicateNameCategory,
    getUsedCategoryIds,
  }
}
