import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useNotificationStore } from 'src/stores/notification'

type SortOption = {
  label: string
  value: string
}

type ListPageConfig<T> = {
  entityName: string
  entityNamePlural: string
  newRouteNameSingular: string
  viewRouteNameSingular: string
  sortOptions: SortOption[]
  defaultSort: string
  filterAndSortFn: (items: T[], searchQuery: string, sortBy: string) => T[]
  deleteFn: (id: string) => Promise<void>
}

export function useListPage<T extends { id: string; name: string }>(
  config: ListPageConfig<T>,
  getAllItems: () => T[],
  getOwnedItems: () => T[],
  getSharedItems: () => T[],
  isLoading: () => boolean,
) {
  const router = useRouter()
  const $q = useQuasar()
  const notificationsStore = useNotificationStore()

  const searchQuery = ref('')
  const sortBy = ref(config.defaultSort)

  const areItemsLoading = computed(() => isLoading() && getAllItems().length === 0)

  const filteredAndSortedOwnedItems = computed(() => {
    return config.filterAndSortFn(getOwnedItems(), searchQuery.value, sortBy.value)
  })

  const filteredAndSortedSharedItems = computed(() => {
    return config.filterAndSortFn(getSharedItems(), searchQuery.value, sortBy.value)
  })

  const hasItems = computed(
    () =>
      filteredAndSortedOwnedItems.value.length > 0 || filteredAndSortedSharedItems.value.length > 0,
  )

  const allFilteredAndSortedItems = computed(() => {
    return config.filterAndSortFn(getAllItems(), searchQuery.value, sortBy.value)
  })

  function goToNew(): void {
    router.push({ name: config.newRouteNameSingular })
  }

  function viewItem(id: string): void {
    router.push({ name: config.viewRouteNameSingular, params: { id } })
  }

  async function onDeleteConfirm(item: T): Promise<void> {
    await config.deleteFn(item.id)
    notificationsStore.showSuccess(`${config.entityName} deleted successfully`)
  }

  function deleteItem(item: T): void {
    $q.dialog({
      title: `Delete ${config.entityName}`,
      message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
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
    }).onOk(() => void onDeleteConfirm(item))
  }

  function clearSearch(): void {
    searchQuery.value = ''
  }

  const emptyStateConfig = computed(() => ({
    searchIcon: 'eva-search-outline',
    emptyIcon:
      config.entityName.toLowerCase() === 'template'
        ? 'eva-file-text-outline'
        : 'eva-calendar-outline',
    searchTitle: `No ${config.entityNamePlural.toLowerCase()} found`,
    emptyTitle: `No ${config.entityNamePlural.toLowerCase()} yet`,
    searchDescription:
      'Try adjusting your search terms or create a new ' + config.entityName.toLowerCase(),
    emptyDescription: `Create your first ${config.entityName.toLowerCase()} to start ${
      config.entityName.toLowerCase() === 'template'
        ? 'managing your expenses efficiently'
        : 'tracking your financial goals'
    }`,
    createLabel: `Create Your First ${config.entityName}`,
  }))

  return {
    searchQuery,
    sortBy,
    areItemsLoading,
    filteredAndSortedOwnedItems,
    filteredAndSortedSharedItems,
    hasItems,
    allFilteredAndSortedItems,
    emptyStateConfig,
    goToNew,
    viewItem,
    deleteItem,
    clearSearch,
    sortOptions: config.sortOptions,
  }
}
