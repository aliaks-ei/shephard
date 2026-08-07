import { computed, ref } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useQueryClient } from '@tanstack/vue-query'
import type { RouteLocationRaw } from 'vue-router'
import { useRecentExpensesInfiniteQuery } from 'src/queries/expenses'
import { usePlansQuery } from 'src/queries/plans'
import { useCategoriesQuery } from 'src/queries/categories'
import { queryKeys } from 'src/queries/query-keys'
import { useUserStore } from 'src/stores/user'
import { usePreferencesStore } from 'src/stores/preferences'
import { useNetworkStatus } from './useNetworkStatus'
import { formatCurrency, formatCurrencyPrivate, type CurrencyCode } from 'src/utils/currency'
import { formatDateRelative } from 'src/utils/date'
import type { ExpenseSort, ExpenseWithCategoryAndPlan } from 'src/api'

export function useExpensesPage() {
  const userStore = useUserStore()
  const preferencesStore = usePreferencesStore()
  const userId = computed(() => userStore.userProfile?.id)
  const searchQuery = ref('')
  const debouncedSearchQuery = refDebounced(searchQuery, 300)
  const sortBy = ref('date-desc')
  const expenseSort = computed<ExpenseSort>(() =>
    ['date-desc', 'date-asc', 'amount-desc', 'amount-asc'].includes(sortBy.value)
      ? (sortBy.value as ExpenseSort)
      : 'date-desc',
  )
  const selectedCategoryId = ref<string | null>(null)
  const expenseFilters = computed(() => ({
    search: debouncedSearchQuery.value,
    categoryId: selectedCategoryId.value,
    sortBy: expenseSort.value,
  }))
  const expensesQuery = useRecentExpensesInfiniteQuery(userId, expenseFilters)
  const { expenses, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = expensesQuery
  const { plansForExpenses } = usePlansQuery(userId)
  const { categories } = useCategoriesQuery()
  const { isOnline, isOffline } = useNetworkStatus()
  const queryClient = useQueryClient()
  const hasExpensePlan = computed(() => plansForExpenses.value.length > 0)
  const canAddExpense = computed(() => isOnline.value && hasExpensePlan.value)
  const hasLoadError = computed(
    () => ((expensesQuery.isError?.value ?? false) || isOffline.value) && expenses.value.length === 0,
  )
  const isRetrying = computed(() => expensesQuery.isFetching?.value ?? false)
  const sortOptions = [
    { label: 'Newest first', value: 'date-desc' },
    { label: 'Oldest first', value: 'date-asc' },
    { label: 'Highest amount', value: 'amount-desc' },
    { label: 'Lowest amount', value: 'amount-asc' },
  ]
  const hasOpenedExpenseDialog = ref(false)
  const showExpenseDialog = ref(false)
  const availableCategories = computed(() =>
    [...categories.value].sort((a, b) => a.name.localeCompare(b.name)),
  )
  const hasActiveFilter = computed(() => !!searchQuery.value || !!selectedCategoryId.value)

  async function retryActivity() {
    await expensesQuery.refetch?.()
  }

  async function onRefresh(done: () => void) {
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.expenses.recentAll() })
    } finally {
      done()
    }
  }

  function openExpenseDialog() {
    if (!canAddExpense.value) return
    hasOpenedExpenseDialog.value = true
    showExpenseDialog.value = true
  }

  function toggleCategory(categoryId: string) {
    selectedCategoryId.value = selectedCategoryId.value === categoryId ? null : categoryId
  }

  function clearFilters() {
    searchQuery.value = ''
    selectedCategoryId.value = null
  }

  function expenseCurrency(expense: ExpenseWithCategoryAndPlan): CurrencyCode {
    return (expense.plans?.currency ?? preferencesStore.currency) as CurrencyCode
  }

  function groupTotalLabel(groupExpenses: ExpenseWithCategoryAndPlan[]): string {
    const first = groupExpenses[0]
    if (!first) return ''
    const currency = expenseCurrency(first)
    if (preferencesStore.isPrivacyModeEnabled) return formatCurrencyPrivate(currency)
    if (groupExpenses.some((expense) => expenseCurrency(expense) !== currency)) return ''
    return formatCurrency(
      groupExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      currency,
    )
  }

  const dayGroups = computed(() => {
    if (expenses.value.length === 0) return []
    if (sortBy.value !== 'date-desc' && sortBy.value !== 'date-asc') {
      return [{ date: 'all', label: 'All expenses', totalLabel: groupTotalLabel(expenses.value), expenses: expenses.value }]
    }
    const groups = new Map<string, ExpenseWithCategoryAndPlan[]>()
    for (const expense of expenses.value) {
      const day = expense.expense_date.slice(0, 10)
      groups.set(day, [...(groups.get(day) ?? []), expense])
    }
    return Array.from(groups.entries()).map(([date, dayExpenses]) => ({
      date,
      label: formatDateRelative(date),
      totalLabel: groupTotalLabel(dayExpenses),
      expenses: dayExpenses,
    }))
  })

  function sourcePlanRoute(expense: ExpenseWithCategoryAndPlan): RouteLocationRaw {
    return { name: 'plan', params: { id: expense.plans?.id ?? expense.plan_id } }
  }

  return {
    searchQuery, sortBy, selectedCategoryId, expenses, isPending, hasNextPage,
    isFetchingNextPage, fetchNextPage, isOffline, hasExpensePlan, canAddExpense,
    hasLoadError, isRetrying, sortOptions, hasOpenedExpenseDialog, showExpenseDialog,
    availableCategories, hasActiveFilter, dayGroups, retryActivity, onRefresh,
    openExpenseDialog, toggleCategory, clearFilters, expenseCurrency, sourcePlanRoute,
  }
}
