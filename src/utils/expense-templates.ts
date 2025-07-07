import type { ExpenseTemplateWithPermission } from 'src/api'

export const getPermissionText = (permission: string): string => {
  switch (permission) {
    case 'view':
      return 'view only'
    case 'edit':
      return 'can edit'
    default:
      return 'unknown'
  }
}

export const getPermissionColor = (permission: string): string => {
  switch (permission) {
    case 'view':
      return 'warning'
    case 'edit':
      return 'positive'
    default:
      return 'grey'
  }
}

export const getPermissionIcon = (permission: string): string => {
  switch (permission) {
    case 'view':
      return 'eva-eye-outline'
    case 'edit':
      return 'eva-edit-outline'
    default:
      return 'eva-question-mark-outline'
  }
}

/**
 * Filter and sort templates based on the search query and sort by field
 * @param templates - The templates to filter and sort
 * @param searchQuery - The search query to filter the templates
 * @param sortBy - The field to sort the templates by
 * @returns The filtered and sorted templates
 */
export const filterAndSortTemplates = (
  templates: ExpenseTemplateWithPermission[],
  searchQuery: string,
  sortBy: string,
): ExpenseTemplateWithPermission[] => {
  let filtered = templates

  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        template.duration?.toLowerCase().includes(query),
    )
  }

  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'total':
        return (b.total || 0) - (a.total || 0)
      case 'duration':
        return (a.duration || '').localeCompare(b.duration || '')
      case 'created_at':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      default:
        return (a.name ?? '').localeCompare(b.name ?? '')
    }
  })
}
