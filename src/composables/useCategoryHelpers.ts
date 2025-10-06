import { useCategoriesStore } from 'src/stores/categories'

export function useCategoryHelpers() {
  const categoriesStore = useCategoriesStore()

  function getCategoryName(categoryId: string): string {
    const category = categoriesStore.getCategoryById(categoryId)
    return category?.name || 'Unknown'
  }

  function getCategoryColor(categoryId: string): string {
    const category = categoriesStore.getCategoryById(categoryId)
    return category?.color || '#666'
  }

  function getCategoryIcon(categoryId: string): string {
    const category = categoriesStore.getCategoryById(categoryId)
    return category?.icon || 'eva-folder-outline'
  }

  return {
    getCategoryName,
    getCategoryColor,
    getCategoryIcon,
  }
}
