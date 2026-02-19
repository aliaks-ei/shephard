import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getCategories, getCategoriesWithStats, type CategoryWithStats } from 'src/api'
import { queryKeys } from './query-keys'

export function useCategoriesQuery() {
  const query = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
    meta: { errorKey: 'CATEGORIES.LOAD_FAILED' as const },
  })

  const categories = computed((): CategoryWithStats[] => {
    if (!query.data.value) return []
    return query.data.value.map((c) => ({ ...c, templates: [] }))
  })

  const categoryCount = computed(() => categories.value.length)

  const categoriesMap = computed(() =>
    categories.value.reduce((acc, category) => {
      acc.set(category.id, category)
      return acc
    }, new Map<string, CategoryWithStats>()),
  )

  const sortedCategories = computed(() => {
    return [...categories.value].sort((a, b) => a.name.localeCompare(b.name))
  })

  function getCategoryById(categoryId: string): CategoryWithStats | undefined {
    return categoriesMap.value.get(categoryId)
  }

  return {
    ...query,
    categories,
    categoryCount,
    categoriesMap,
    sortedCategories,
    getCategoryById,
  }
}

export function useCategoriesWithStatsQuery(userId: MaybeRefOrGetter<string | undefined>) {
  const query = useQuery({
    queryKey: computed(() => queryKeys.categories.withStats(toValue(userId) ?? '')),
    queryFn: () => getCategoriesWithStats(toValue(userId)!),
    enabled: computed(() => !!toValue(userId)),
    staleTime: 5 * 60 * 1000,
    meta: { errorKey: 'CATEGORIES.LOAD_FAILED' as const },
  })

  const categories = computed((): CategoryWithStats[] => query.data.value ?? [])

  return {
    ...query,
    categories,
  }
}
