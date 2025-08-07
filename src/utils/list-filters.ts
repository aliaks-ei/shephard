type BaseItem = {
  id: string
  name: string
  total?: number | null
  created_at?: string | null
}

type TemplateItem = BaseItem & {
  duration?: string
}

type PlanItem = BaseItem & {
  start_date: string
}

export function filterAndSortItems<T extends BaseItem>(
  items: T[],
  searchQuery: string,
  sortBy: string,
  searchableFields: (keyof T)[] = ['name'],
): T[] {
  let filtered = items

  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter((item) =>
      searchableFields.some((field) => {
        const value = item[field]
        return typeof value === 'string' && value.toLowerCase().includes(query)
      }),
    )
  }

  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name ?? '').localeCompare(b.name ?? '')
      case 'total':
        return (b.total || 0) - (a.total || 0)
      case 'created_at':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      case 'duration':
        // For templates
        return ((a as unknown as TemplateItem).duration || '').localeCompare(
          (b as unknown as TemplateItem).duration || '',
        )
      case 'start_date':
        // For plans
        return (
          new Date((b as unknown as PlanItem).start_date).getTime() -
          new Date((a as unknown as PlanItem).start_date).getTime()
        )
      default:
        return (a.name ?? '').localeCompare(b.name ?? '')
    }
  })
}

export function filterAndSortTemplates<T extends TemplateItem>(
  templates: T[],
  searchQuery: string,
  sortBy: string,
): T[] {
  return filterAndSortItems(templates, searchQuery, sortBy, ['name', 'duration'])
}

export function filterAndSortPlans<T extends PlanItem>(
  plans: T[],
  searchQuery: string,
  sortBy: string,
): T[] {
  return filterAndSortItems(plans, searchQuery, sortBy, ['name'])
}
