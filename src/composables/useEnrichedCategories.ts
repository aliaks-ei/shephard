import { computed, type ComputedRef } from 'vue'
import type { Category } from 'src/api'
import type { CategoryGroup } from './useItemsManager'
import type { BaseItemUI, BaseCategoryUI } from 'src/types'

export function useEnrichedCategories<T extends BaseItemUI = BaseItemUI>(
  categoryGroups: ComputedRef<CategoryGroup<T>[]>,
  categories: ComputedRef<Category[]> | Category[],
) {
  const enrichedCategories = computed((): (BaseCategoryUI & { items: T[] })[] => {
    const categoryArray = Array.isArray(categories) ? categories : categories.value
    const categoryMap = new Map(categoryArray.map((cat) => [cat.id, cat]))

    return categoryGroups.value.reduce(
      (acc, group) => {
        const category = categoryMap.get(group.categoryId)
        if (category) {
          acc.push({
            ...group,
            categoryName: category.name,
            categoryIcon: category.icon,
          })
        }
        return acc
      },
      [] as (BaseCategoryUI & { items: T[] })[],
    )
  })

  return {
    enrichedCategories,
  }
}
