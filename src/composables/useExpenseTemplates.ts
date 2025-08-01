import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

import { useTemplatesStore } from 'src/stores/templates'
import { useNotificationStore } from 'src/stores/notification'
import { filterAndSortTemplates } from 'src/utils/expense-templates'
import type { ExpenseTemplateWithPermission } from 'src/api'

export function useExpenseTemplates() {
  const router = useRouter()
  const $q = useQuasar()

  const notificationsStore = useNotificationStore()
  const templatesStore = useTemplatesStore()

  const searchQuery = ref('')
  const sortBy = ref('name')

  const areTemplatesLoading = computed(
    () => templatesStore.isLoading && templatesStore.templates.length === 0,
  )
  const filteredAndSortedOwnedTemplates = computed(() => {
    return filterAndSortTemplates(templatesStore.ownedTemplates, searchQuery.value, sortBy.value)
  })
  const filteredAndSortedSharedTemplates = computed(() => {
    return filterAndSortTemplates(templatesStore.sharedTemplates, searchQuery.value, sortBy.value)
  })
  const hasTemplates = computed(
    () =>
      filteredAndSortedOwnedTemplates.value.length > 0 ||
      filteredAndSortedSharedTemplates.value.length > 0,
  )

  function goToNewTemplate(): void {
    router.push({ name: 'new-template' })
  }

  function viewTemplate(id: string): void {
    router.push({ name: 'template', params: { id } })
  }

  function deleteTemplate(template: ExpenseTemplateWithPermission): void {
    $q.dialog({
      title: 'Delete Template',
      message: `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
      persistent: true,
      ok: {
        label: 'Delete',
        color: 'negative',
        unelevated: true,
      },
      cancel: {
        label: 'Cancel',
        flat: true,
      },
    }).onOk(() => {
      templatesStore.removeTemplate(template.id)
      notificationsStore.showSuccess('Template deleted successfully')
    })
  }

  return {
    searchQuery,
    sortBy,
    areTemplatesLoading,
    filteredAndSortedOwnedTemplates,
    filteredAndSortedSharedTemplates,
    hasTemplates,
    goToNewTemplate,
    viewTemplate,
    deleteTemplate,
  }
}
