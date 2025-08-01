import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  type ExpenseCategory,
  type ExpenseCategoryUpdate,
} from 'src/api'
import { useError } from 'src/composables/useError'
import { useUserStore } from 'src/stores/user'

export const useCategoriesStore = defineStore('categories', () => {
  const { handleError } = useError()
  const userStore = useUserStore()

  const categories = ref<ExpenseCategory[]>([])
  const isLoading = ref(false)

  const userId = computed(() => userStore.userProfile?.id)
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
    if (!userId.value) return

    isLoading.value = true

    try {
      const data = await getExpenseCategories(userId.value)
      categories.value = data
    } catch (error) {
      handleError('CATEGORIES.LOAD_FAILED', error)
    } finally {
      isLoading.value = false
    }
  }

  async function addCategory(payload: { name: string; color: string }): Promise<boolean> {
    if (!userId.value) return false

    isLoading.value = true

    try {
      const newCategory = await createExpenseCategory({
        name: payload.name,
        color: payload.color,
        owner_id: userId.value,
      })

      categories.value.push(newCategory)
      return true
    } catch (error) {
      // Handle specific duplicate name error
      if (error instanceof Error && error.name === 'DUPLICATE_CATEGORY_NAME') {
        handleError('CATEGORIES.DUPLICATE_NAME', error)
      } else {
        handleError('CATEGORIES.CREATE_FAILED', error)
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function editCategory(
    categoryId: string,
    updates: ExpenseCategoryUpdate,
  ): Promise<boolean> {
    isLoading.value = true

    try {
      const updatedCategory = await updateExpenseCategory(categoryId, updates)

      const index = categories.value.findIndex((c) => c.id === categoryId)
      if (index !== -1) {
        categories.value[index] = updatedCategory
      }

      return true
    } catch (error) {
      // Handle specific duplicate name error
      if (error instanceof Error && error.name === 'DUPLICATE_CATEGORY_NAME') {
        handleError('CATEGORIES.DUPLICATE_NAME', error, { categoryId })
      } else {
        handleError('CATEGORIES.UPDATE_FAILED', error, { categoryId })
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function removeCategory(categoryId: string) {
    isLoading.value = true

    try {
      await deleteExpenseCategory(categoryId)

      categories.value = categories.value.filter((c) => c.id !== categoryId)
    } catch (error) {
      handleError('CATEGORIES.DELETE_FAILED', error, { categoryId })
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
    addCategory,
    editCategory,
    removeCategory,
    getCategoryById,
    reset,
  }
})
