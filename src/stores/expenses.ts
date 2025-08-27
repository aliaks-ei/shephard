import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  getExpensesByPlan,
  getPlanExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByDateRange,
  getExpensesByCategory,
  type ExpenseWithCategory,
  type ExpenseInsert,
  type ExpenseUpdate,
  type PlanExpenseSummary,
} from 'src/api'
import { useError } from 'src/composables/useError'
import { useUserStore } from 'src/stores/user'

export const useExpensesStore = defineStore('expenses', () => {
  const { handleError } = useError()
  const userStore = useUserStore()

  const expenses = ref<ExpenseWithCategory[]>([])
  const expenseSummary = ref<PlanExpenseSummary[]>([])
  const isLoading = ref(false)
  const currentPlanId = ref<string | null>(null)

  const userId = computed(() => userStore.userProfile?.id)

  const totalExpensesAmount = computed(() =>
    expenses.value.reduce((total, expense) => total + expense.amount, 0),
  )

  const expensesByCategory = computed(() => {
    const grouped: Record<string, ExpenseWithCategory[]> = {}
    expenses.value.forEach((expense) => {
      if (!grouped[expense.category_id]) {
        grouped[expense.category_id] = []
      }
      grouped[expense.category_id]?.push(expense)
    })
    return grouped
  })

  async function loadExpensesForPlan(planId: string) {
    if (!userId.value) return

    isLoading.value = true
    currentPlanId.value = planId

    try {
      const data = await getExpensesByPlan(planId)
      expenses.value = data
      return data
    } catch (error) {
      handleError('EXPENSES.LOAD_FAILED', error, { planId })
    } finally {
      isLoading.value = false
    }
  }

  async function loadExpenseSummaryForPlan(planId: string) {
    if (!userId.value) return

    try {
      const data = await getPlanExpenseSummary(planId)
      expenseSummary.value = data
      return data
    } catch (error) {
      handleError('EXPENSES.LOAD_SUMMARY_FAILED', error, { planId })
    }
  }

  async function addExpense(expenseData: Omit<ExpenseInsert, 'user_id'>) {
    if (!userId.value) return

    isLoading.value = true

    try {
      const newExpense = await createExpense({
        ...expenseData,
        user_id: userId.value,
      })

      // Refresh expenses and summary for the plan
      if (currentPlanId.value) {
        await Promise.all([
          loadExpensesForPlan(currentPlanId.value),
          loadExpenseSummaryForPlan(currentPlanId.value),
        ])
      }

      return newExpense
    } catch (error) {
      if (error instanceof Error && error.name === 'DUPLICATE_EXPENSE_NAME') {
        handleError('EXPENSES.DUPLICATE_NAME', error)
      } else {
        handleError('EXPENSES.CREATE_FAILED', error)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function editExpense(expenseId: string, updates: ExpenseUpdate) {
    if (!userId.value) return

    isLoading.value = true

    try {
      const updatedExpense = await updateExpense(expenseId, updates)

      // Update the expense in the local state
      const index = expenses.value.findIndex((e) => e.id === expenseId)
      if (index !== -1 && updatedExpense) {
        // Preserve the category data
        const existingCategory = expenses.value[index]?.expense_categories
        expenses.value[index] = {
          ...updatedExpense,
          expense_categories: existingCategory,
        } as ExpenseWithCategory
      }

      // Refresh summary if the plan is current
      if (currentPlanId.value) {
        await loadExpenseSummaryForPlan(currentPlanId.value)
      }

      return updatedExpense
    } catch (error) {
      if (error instanceof Error && error.name === 'DUPLICATE_EXPENSE_NAME') {
        handleError('EXPENSES.DUPLICATE_NAME', error)
      } else {
        handleError('EXPENSES.UPDATE_FAILED', error, { expenseId })
      }
    } finally {
      isLoading.value = false
    }
  }

  async function removeExpense(expenseId: string) {
    if (!userId.value) return

    isLoading.value = true

    try {
      await deleteExpense(expenseId)

      expenses.value = expenses.value.filter((e) => e.id !== expenseId)

      if (currentPlanId.value) {
        await loadExpenseSummaryForPlan(currentPlanId.value)
      }
    } catch (error) {
      handleError('EXPENSES.DELETE_FAILED', error, { expenseId })
    } finally {
      isLoading.value = false
    }
  }

  async function loadExpensesByDateRange(planId: string, startDate: string, endDate: string) {
    if (!userId.value) return

    isLoading.value = true

    try {
      const data = await getExpensesByDateRange(planId, startDate, endDate)
      return data
    } catch (error) {
      handleError('EXPENSES.LOAD_DATE_RANGE_FAILED', error, { planId, startDate, endDate })
    } finally {
      isLoading.value = false
    }
  }

  async function loadExpensesByCategory(planId: string, categoryId: string) {
    if (!userId.value) return

    isLoading.value = true

    try {
      const data = await getExpensesByCategory(planId, categoryId)
      return data
    } catch (error) {
      handleError('EXPENSES.LOAD_CATEGORY_FAILED', error, { planId, categoryId })
    } finally {
      isLoading.value = false
    }
  }

  function reset() {
    expenses.value = []
    expenseSummary.value = []
    currentPlanId.value = null
    isLoading.value = false
  }

  return {
    expenses,
    expenseSummary,
    isLoading,
    currentPlanId,
    userId,
    totalExpensesAmount,
    expensesByCategory,
    loadExpensesForPlan,
    loadExpenseSummaryForPlan,
    addExpense,
    editExpense,
    removeExpense,
    loadExpensesByDateRange,
    loadExpensesByCategory,
    reset,
  }
})
