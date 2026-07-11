import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { ActionResult } from 'src/types'
import { useNetworkStatus } from './useNetworkStatus'

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
  deleteFn: (item: T) => Promise<ActionResult>
}

type ListQueryState = {
  isError: () => boolean
  isFetching: () => boolean
  retry: () => Promise<unknown>
}

export function useListPage<T extends { id: string; name: string }>(
  config: ListPageConfig<T>,
  getAllItems: () => T[],
  isLoading: () => boolean,
  queryState?: ListQueryState,
) {
  const router = useRouter()
  const { isOffline } = useNetworkStatus()

  const searchQuery = ref('')
  const sortBy = ref(config.defaultSort)

  const areItemsLoading = computed(
    () => isLoading() && getAllItems().length === 0 && !isOffline.value,
  )
  const hasLoadError = computed(
    () => ((queryState?.isError() ?? false) || isOffline.value) && getAllItems().length === 0,
  )
  const isRetrying = computed(() => queryState?.isFetching() ?? false)

  const allFilteredAndSortedItems = computed(() => {
    return config.filterAndSortFn(getAllItems(), searchQuery.value, sortBy.value)
  })

  const hasItems = computed(() => allFilteredAndSortedItems.value.length > 0)

  function goToNew(): void {
    router.push({ name: config.newRouteNameSingular })
  }

  function viewItem(id: string): void {
    router.push({ name: config.viewRouteNameSingular, params: { id } })
  }

  async function deleteItem(item: T): Promise<void> {
    await config.deleteFn(item)
  }

  function clearSearch(): void {
    searchQuery.value = ''
  }

  async function retryItems(): Promise<void> {
    await queryState?.retry()
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
    hasLoadError,
    isRetrying,
    hasItems,
    allFilteredAndSortedItems,
    emptyStateConfig,
    goToNew,
    viewItem,
    deleteItem,
    clearSearch,
    retryItems,
    sortOptions: config.sortOptions,
  }
}
