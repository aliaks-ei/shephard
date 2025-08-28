import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { getExpenseCategoriesWithStats, type ExpenseCategoryWithStats } from 'src/api'
import { useError } from 'src/composables/useError'
import { useUserStore } from 'src/stores/user'

export const useCategoriesStore = defineStore('categories', () => {
  const { handleError } = useError()
  const userStore = useUserStore()

  const categories = ref<ExpenseCategoryWithStats[]>([])
  const isLoading = ref(false)

  const userId = computed(() => userStore.userProfile?.id)
  const categoryCount = computed(() => categories.value.length)
  const categoriesMap = computed(() =>
    categories.value.reduce((acc, category) => {
      acc.set(category.id, category)
      return acc
    }, new Map<string, ExpenseCategoryWithStats>()),
  )

  const sortedCategories = computed(() => {
    return categories.value.sort((a, b) => a.name.localeCompare(b.name))
  })

  async function loadCategories() {
    if (!userId.value) return

    isLoading.value = true

    try {
      const data = await getExpenseCategoriesWithStats(userId.value)
      categories.value = data
    } catch (error) {
      handleError('CATEGORIES.LOAD_FAILED', error)
    } finally {
      isLoading.value = false
    }
  }

  function getCategoryById(categoryId: string): ExpenseCategoryWithStats | undefined {
    return categoriesMap.value.get(categoryId)
  }

  function reset() {
    categories.value = []
    isLoading.value = false
  }

  return {
    categories,
    isLoading,
    categoryCount,
    categoriesMap,
    sortedCategories,
    loadCategories,
    getCategoryById,
    reset,
  }
})
