import { computed } from 'vue'
import { useTemplatesQuery, useDeleteTemplateMutation } from 'src/queries/templates'
import { useUserStore } from 'src/stores/user'
import { useListPage } from './useListPage'
import { filterAndSortTemplates } from 'src/utils/list-filters'
import type { TemplateWithPermission } from 'src/api'

export function useTemplates() {
  const userStore = useUserStore()
  const userId = computed(() => userStore.userProfile?.id)
  const { templates, ownedTemplates, sharedTemplates, isPending } = useTemplatesQuery(userId)
  const deleteTemplateMutation = useDeleteTemplateMutation()

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
        try {
          await deleteTemplateMutation.mutateAsync(id)
          return { success: true }
        } catch {
          return { success: false }
        }
      },
    },
    () => templates.value,
    () => ownedTemplates.value,
    () => sharedTemplates.value,
    () => isPending.value && templates.value.length === 0,
  )
}
