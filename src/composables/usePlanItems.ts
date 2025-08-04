import { ref, computed } from 'vue'

import { useCategoriesStore } from 'src/stores/categories'
import type { PlanWithItems } from 'src/api'
import type { PlanItemUI } from 'src/types'

export type PlanCategoryGroup = {
  categoryId: string
  categoryName: string
  categoryColor: string
  items: PlanItemUI[]
  subtotal: number
}

export function usePlanItems() {
  const categoriesStore = useCategoriesStore()

  const planItems = ref<PlanItemUI[]>([])

  const totalAmount = computed(() =>
    planItems.value.reduce((total, item) => total + item.amount, 0),
  )

  const hasValidItems = computed(
    () =>
      planItems.value.length > 0 &&
      planItems.value.every((item) => item.name.trim() && item.categoryId && item.amount > 0),
  )

  // Check for duplicate name+category combinations
  const hasDuplicateItems = computed(() => {
    const seen = new Set<string>()
    return planItems.value.some((item) => {
      if (!item.name.trim() || !item.categoryId) return false

      const key = `${item.categoryId}-${item.name.trim().toLowerCase()}`
      if (seen.has(key)) return true

      seen.add(key)

      return false
    })
  })

  const isValidForSave = computed(() => hasValidItems.value && !hasDuplicateItems.value)

  // Group items by category for enhanced display
  const planCategoryGroups = computed((): PlanCategoryGroup[] => {
    const groups = new Map<string, PlanCategoryGroup>()

    planItems.value.forEach((item) => {
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

  function addPlanItem(categoryId: string, categoryColor: string): void {
    planItems.value.push({
      id: `temp_${crypto.randomUUID()}`,
      name: '',
      categoryId,
      amount: 0,
      color: categoryColor,
    })
  }

  function getUsedCategoryIds(): string[] {
    return [...new Set(planItems.value.map((item) => item.categoryId).filter(Boolean))]
  }

  function updatePlanItem(itemId: string, updates: Partial<PlanItemUI> | PlanItemUI): void {
    const itemIndex = planItems.value.findIndex((item) => item.id === itemId)
    if (itemIndex === -1) return

    const currentItem = planItems.value[itemIndex]
    if (!currentItem) return

    planItems.value[itemIndex] = {
      id: currentItem.id,
      name: updates.name ?? currentItem.name,
      categoryId: updates.categoryId ?? currentItem.categoryId,
      amount: updates.amount ?? currentItem.amount,
      color: updates.color ?? currentItem.color,
    }
  }

  function removePlanItem(itemId: string): void {
    planItems.value = planItems.value.filter((item) => item.id !== itemId)
  }

  function loadPlanItems(plan: PlanWithItems): void {
    const items = plan.plan_items.reduce((acc, item) => {
      const category = categoriesStore.getCategoryById(item.category_id)

      if (category) {
        acc.push({
          id: item.id,
          name: item.name || '',
          categoryId: item.category_id,
          amount: item.amount,
          color: category.color || '',
        })
      }

      return acc
    }, [] as PlanItemUI[])

    planItems.value = [...items]
  }

  function loadPlanItemsFromTemplate(
    templateItems: { id: string; name: string; category_id: string; amount: number }[],
  ): void {
    const items = templateItems.reduce((acc, item) => {
      const category = categoriesStore.getCategoryById(item.category_id)

      if (category) {
        acc.push({
          id: `temp_${crypto.randomUUID()}`, // Generate new temp IDs for plan items
          name: item.name || '',
          categoryId: item.category_id,
          amount: item.amount,
          color: category.color || '',
        })
      }

      return acc
    }, [] as PlanItemUI[])

    planItems.value = [...items]
  }

  function getPlanItemsForSave() {
    return planItems.value
      .filter((item) => item.name.trim() && item.categoryId && item.amount > 0)
      .map((item) => ({
        name: item.name.trim(),
        category_id: item.categoryId,
        amount: item.amount,
      }))
  }

  function clearPlanItems(): void {
    planItems.value = []
  }

  return {
    planItems,
    totalAmount,
    hasValidItems,
    hasDuplicateItems,
    isValidForSave,
    planCategoryGroups,
    addPlanItem,
    updatePlanItem,
    removePlanItem,
    loadPlanItems,
    loadPlanItemsFromTemplate,
    getPlanItemsForSave,
    getUsedCategoryIds,
    clearPlanItems,
  }
}
