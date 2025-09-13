import { useTemplatesStore } from 'src/stores/templates'
import { useListPage } from './useListPage'
import { filterAndSortTemplates } from 'src/utils/list-filters'
import type { TemplateWithPermission } from 'src/api'

export function useTemplates() {
  const templatesStore = useTemplatesStore()

  const sortOptions = [
    { label: 'Name', value: 'name' },
    { label: 'Total Amount', value: 'total' },
    { label: 'Duration', value: 'duration' },
    { label: 'Created Date', value: 'created_at' },
  ]

  return useListPage<TemplateWithPermission>(
    {
      entityName: 'Template',
      entityNamePlural: 'Templates',
      newRouteNameSingular: 'new-template',
      viewRouteNameSingular: 'template',
      sortOptions,
      defaultSort: 'name',
      filterAndSortFn: filterAndSortTemplates,
      deleteFn: async (id: string) => {
        await templatesStore.removeTemplate(id)
      },
    },
    () => templatesStore.templates,
    () => templatesStore.ownedTemplates,
    () => templatesStore.sharedTemplates,
    () => templatesStore.isLoading && templatesStore.templates.length === 0,
  )
}
