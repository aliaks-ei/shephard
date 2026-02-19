import { useCategoriesQuery } from 'src/queries/categories'

export function useCategoryHelpers() {
  const { getCategoryById } = useCategoriesQuery()

  function getCategoryName(categoryId: string): string {
    const category = getCategoryById(categoryId)
    return category?.name || 'Unknown'
  }

  function getCategoryColor(categoryId: string): string {
    const category = getCategoryById(categoryId)
    return category?.color || '#666'
  }

  function getCategoryIcon(categoryId: string): string {
    const category = getCategoryById(categoryId)
    return category?.icon || 'eva-folder-outline'
  }

  return {
    getCategoryName,
    getCategoryColor,
    getCategoryIcon,
  }
}
