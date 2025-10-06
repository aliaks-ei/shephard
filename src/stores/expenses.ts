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
import { getPlanItems, updatePlanItemCompletion, type PlanItem } from 'src/api/plans'
import { useError } from 'src/composables/useError'
import { useUserStore } from 'src/stores/user'
import type { ActionResult } from 'src/types'

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

  const sortedExpenses = computed(() => {
    return [...expenses.value].sort((a, b) => {
      const dateA = new Date(a.expense_date).getTime()
      const dateB = new Date(b.expense_date).getTime()

      if (dateA !== dateB) {
        return dateB - dateA
      }

      const createdA = new Date(a.created_at).getTime()
      const createdB = new Date(b.created_at).getTime()
      return createdB - createdA
    })
  })

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

  async function addExpense(
    expenseData: Omit<ExpenseInsert, 'user_id'>,
  ): Promise<ActionResult<ExpenseWithCategory>> {
    if (!userId.value) return { success: false }

    isLoading.value = true

    try {
      const newExpense = await createExpense({
        ...expenseData,
        user_id: userId.value,
      })

      if (currentPlanId.value) {
        await Promise.all([
          loadExpensesForPlan(currentPlanId.value),
          loadExpenseSummaryForPlan(currentPlanId.value),
        ])
      }

      return { success: true, data: newExpense as ExpenseWithCategory }
    } catch (error) {
      if (error instanceof Error && error.message.includes('violates foreign key constraint')) {
        if (error.message.includes('expenses_plan_id_fkey')) {
          handleError('EXPENSES.PLAN_NOT_FOUND', error, { planId: expenseData.plan_id })
        } else if (error.message.includes('expenses_plan_item_id_fkey')) {
          handleError('EXPENSES.PLAN_ITEM_NOT_FOUND', error, {
            planItemId: expenseData.plan_item_id || undefined,
          })
        } else {
          handleError('EXPENSES.CREATE_FAILED', error)
        }
      } else {
        handleError('EXPENSES.CREATE_FAILED', error)
      }
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  async function editExpense(
    expenseId: string,
    updates: ExpenseUpdate,
  ): Promise<ActionResult<ExpenseWithCategory>> {
    if (!userId.value) return { success: false }

    isLoading.value = true

    try {
      const updatedExpense = await updateExpense(expenseId, updates)

      const index = expenses.value.findIndex((e) => e.id === expenseId)
      if (index !== -1 && updatedExpense) {
        const existingCategory = expenses.value[index]?.categories
        expenses.value[index] = {
          ...updatedExpense,
          categories: existingCategory,
        } as ExpenseWithCategory
      }

      if (currentPlanId.value) {
        await loadExpenseSummaryForPlan(currentPlanId.value)
      }

      return { success: true, data: updatedExpense as ExpenseWithCategory }
    } catch (error) {
      handleError('EXPENSES.UPDATE_FAILED', error, { expenseId })
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  async function removeExpense(expenseId: string): Promise<ActionResult> {
    if (!userId.value) return { success: false }

    isLoading.value = true

    try {
      const expenseToDelete = expenses.value.find((e) => e.id === expenseId)
      const planItemId = expenseToDelete?.plan_item_id

      await deleteExpense(expenseId)

      expenses.value = expenses.value.filter((e) => e.id !== expenseId)

      if (planItemId) {
        const remainingExpenses = expenses.value.filter((e) => e.plan_item_id === planItemId)

        if (remainingExpenses.length === 0) {
          await updatePlanItemCompletion(planItemId, false)
        }
      }

      if (currentPlanId.value) {
        await loadExpenseSummaryForPlan(currentPlanId.value)
      }

      return { success: true }
    } catch (error) {
      handleError('EXPENSES.DELETE_FAILED', error, { expenseId })
      return { success: false }
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

  function getExpensesForPlanItem(planItemId: string): ExpenseWithCategory[] {
    return expenses.value.filter((expense) => expense.plan_item_id === planItemId)
  }

  async function getPlanItemTrackingData(planId: string): Promise<PlanItem[]> {
    try {
      return await getPlanItems(planId)
    } catch (error) {
      handleError('EXPENSES.LOAD_PLAN_ITEMS_FAILED', error, { planId })
      return []
    }
  }

  function getItemCompletionStatus(planItem: PlanItem): {
    isCompleted: boolean
    remainingAmount: number
    progress: number
  } {
    const isCompleted = planItem.is_completed
    const remainingAmount = planItem.is_completed ? 0 : planItem.amount
    const progress = planItem.is_completed ? 1 : 0

    return {
      isCompleted,
      remainingAmount,
      progress,
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
    sortedExpenses,
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
    getExpensesForPlanItem,
    getPlanItemTrackingData,
    getItemCompletionStatus,
    reset,
  }
})
