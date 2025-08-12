import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { getExpenseCategories, type ExpenseCategory } from 'src/api'
import { useError } from 'src/composables/useError'

export const useCategoriesStore = defineStore('categories', () => {
  const { handleError } = useError()

  const categories = ref<ExpenseCategory[]>([])
  const isLoading = ref(false)

  const categoryCount = computed(() => categories.value.length)
  const categoriesMap = computed(() =>
    categories.value.reduce((acc, category) => {
      acc.set(category.id, category)
      return acc
    }, new Map<string, ExpenseCategory>()),
  )

  const sortedCategories = computed(() => {
    return categories.value.sort((a, b) => a.name.localeCompare(b.name))
  })

  async function loadCategories() {
    isLoading.value = true

    try {
      const data = await getExpenseCategories()
      categories.value = data
    } catch (error) {
      handleError('CATEGORIES.LOAD_FAILED', error)
    } finally {
      isLoading.value = false
    }
  }

  function getCategoryById(categoryId: string): ExpenseCategory | undefined {
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
