import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { Category, PlanItem } from 'src/api'

export type TrackableCategoryGroup = {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  items: PlanItem[]
  nonFixedItems: PlanItem[]
  totalPlanned: number
  completedCount: number
}

function sortByCompletion(items: PlanItem[]): PlanItem[] {
  return [...items].sort((a, b) => {
    const aCompleted = a.is_completed
    const bCompleted = b.is_completed

    if (aCompleted === bCompleted) {
      return 0
    }

    return aCompleted ? 1 : -1
  })
}

export function useTrackablePlanItems(planItems: MaybeRefOrGetter<PlanItem[] | null | undefined>) {
  const normalizedPlanItems = computed(() => toValue(planItems) ?? [])

  const fixedPlanItems = computed(() =>
    sortByCompletion(normalizedPlanItems.value.filter((item) => item.is_fixed_payment)),
  )

  const nonFixedPlanItems = computed(() =>
    normalizedPlanItems.value.filter((item) => !item.is_fixed_payment),
  )

  const completedItemsCount = computed(
    () => fixedPlanItems.value.filter((item) => item.is_completed).length,
  )

  const totalItemsCount = computed(() => fixedPlanItems.value.length)
  const hasAnyPlanItems = computed(
    () => fixedPlanItems.value.length > 0 || nonFixedPlanItems.value.length > 0,
  )

  return {
    normalizedPlanItems,
    fixedPlanItems,
    nonFixedPlanItems,
    completedItemsCount,
    totalItemsCount,
    hasAnyPlanItems,
  }
}

export function groupTrackablePlanItemsByCategory(
  planItems: PlanItem[],
  getCategoryById: (categoryId: string) => Category | undefined,
): TrackableCategoryGroup[] {
  if (planItems.length === 0) {
    return []
  }

  const groups = new Map<string, TrackableCategoryGroup>()

  for (const item of planItems) {
    if (!groups.has(item.category_id)) {
      const category = getCategoryById(item.category_id)
      if (!category) {
        continue
      }

      groups.set(item.category_id, {
        categoryId: item.category_id,
        categoryName: category.name,
        categoryColor: category.color,
        categoryIcon: category.icon,
        items: [],
        nonFixedItems: [],
        totalPlanned: 0,
        completedCount: 0,
      })
    }

    const group = groups.get(item.category_id)
    if (!group) {
      continue
    }

    if (item.is_fixed_payment) {
      group.items.push(item)
      group.totalPlanned += item.amount
      if (item.is_completed) {
        group.completedCount++
      }
      continue
    }

    group.nonFixedItems.push(item)
  }

  for (const group of groups.values()) {
    group.items = sortByCompletion(group.items)
  }

  return Array.from(groups.values())
    .filter((group) => group.items.length > 0 || group.nonFixedItems.length > 0)
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName))
}
