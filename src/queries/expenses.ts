import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  getExpensesByPlan,
  getPlanExpenseSummary,
  getLastExpenseForPlan,
  createExpense,
  createExpenses,
  updateExpense,
  deleteExpense,
  deleteExpenses,
  getExpensesByDateRange,
  getExpensesByCategory,
  type ExpenseWithCategory,
  type ExpenseInsert,
  type ExpenseUpdate,
  type PlanExpenseSummary,
} from 'src/api'
import { updatePlanItemCompletion } from 'src/api/plans'
import { useUserStore } from 'src/stores/user'
import { queryKeys } from './query-keys'
import { createSpecificErrorHandler, createMutationErrorHandler } from './query-error-handler'

const EXPENSES_STALE_TIME_MS = 15_000
const EXPENSES_CACHE_TIME_MS = 5 * 60_000

export function useExpensesByPlanQuery(planId: MaybeRefOrGetter<string | null>) {
  const query = useQuery({
    queryKey: computed(() => queryKeys.expenses.byPlan(toValue(planId) ?? '')),
    queryFn: () => getExpensesByPlan(toValue(planId)!),
    enabled: computed(() => !!toValue(planId)),
    staleTime: EXPENSES_STALE_TIME_MS,
    gcTime: EXPENSES_CACHE_TIME_MS,
    meta: { errorKey: 'EXPENSES.LOAD_FAILED' as const },
  })

  const expenses = computed((): ExpenseWithCategory[] => query.data.value ?? [])

  const totalExpensesAmount = computed(() =>
    expenses.value.reduce((total, expense) => total + expense.amount, 0),
  )

  const sortedExpenses = computed(() => expenses.value)

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

  function getExpensesForPlanItem(planItemId: string): ExpenseWithCategory[] {
    return expenses.value.filter((expense) => expense.plan_item_id === planItemId)
  }

  return {
    ...query,
    expenses,
    totalExpensesAmount,
    sortedExpenses,
    expensesByCategory,
    getExpensesForPlanItem,
  }
}

export function useExpenseSummaryQuery(planId: MaybeRefOrGetter<string | null>) {
  const query = useQuery({
    queryKey: computed(() => queryKeys.expenses.summary(toValue(planId) ?? '')),
    queryFn: () => getPlanExpenseSummary(toValue(planId)!),
    enabled: computed(() => !!toValue(planId)),
    staleTime: EXPENSES_STALE_TIME_MS,
    gcTime: EXPENSES_CACHE_TIME_MS,
    meta: { errorKey: 'EXPENSES.LOAD_SUMMARY_FAILED' as const },
  })

  const expenseSummary = computed((): PlanExpenseSummary[] => query.data.value ?? [])

  return {
    ...query,
    expenseSummary,
  }
}

export function useLastExpenseForPlanQuery(planId: MaybeRefOrGetter<string | null>) {
  return useQuery({
    queryKey: computed(() => queryKeys.expenses.lastForPlan(toValue(planId) ?? '')),
    queryFn: () => getLastExpenseForPlan(toValue(planId)!),
    enabled: computed(() => !!toValue(planId)),
    staleTime: EXPENSES_STALE_TIME_MS,
    gcTime: EXPENSES_CACHE_TIME_MS,
  })
}

type ExpenseInput = Omit<ExpenseInsert, 'user_id'> & { user_id?: string }

function invalidateExpenseQueries(queryClient: ReturnType<typeof useQueryClient>, planId: string) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.expenses.byPlan(planId),
  })
  queryClient.invalidateQueries({
    queryKey: queryKeys.expenses.summary(planId),
  })
  queryClient.invalidateQueries({
    queryKey: queryKeys.expenses.lastForPlan(planId),
  })
  queryClient.invalidateQueries({
    queryKey: queryKeys.plans.items(planId),
  })
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient()
  const userStore = useUserStore()

  return useMutation({
    mutationFn: (expense: ExpenseInput) => {
      const userId = expense.user_id || userStore.userProfile?.id
      if (!userId) throw new Error('User not authenticated')
      return createExpense({ ...expense, user_id: userId })
    },
    onSuccess: (_data, vars) => {
      if (vars.plan_id) {
        invalidateExpenseQueries(queryClient, vars.plan_id)
      }
    },
    onError: createSpecificErrorHandler(
      [
        {
          check: (e) =>
            e.message.includes('violates foreign key constraint') &&
            e.message.includes('expenses_plan_id_fkey'),
          key: 'EXPENSES.PLAN_NOT_FOUND',
        },
        {
          check: (e) =>
            e.message.includes('violates foreign key constraint') &&
            e.message.includes('expenses_plan_item_id_fkey'),
          key: 'EXPENSES.PLAN_ITEM_NOT_FOUND',
        },
      ],
      'EXPENSES.CREATE_FAILED',
    ),
  })
}

export function useCreateExpensesBatchMutation() {
  const queryClient = useQueryClient()
  const userStore = useUserStore()

  return useMutation({
    mutationFn: (expenses: ExpenseInput[]) => {
      const defaultUserId = userStore.userProfile?.id
      if (!defaultUserId && expenses.some((expense) => !expense.user_id)) {
        throw new Error('User not authenticated')
      }

      return createExpenses(
        expenses.map((expense) => ({
          ...expense,
          user_id: expense.user_id || defaultUserId!,
        })),
      )
    },
    onSuccess: (_data, vars) => {
      const planIds = Array.from(
        new Set(
          vars
            .map((expense) => expense.plan_id)
            .filter((planId): planId is string => typeof planId === 'string'),
        ),
      )

      for (const planId of planIds) {
        invalidateExpenseQueries(queryClient, planId)
      }
    },
    onError: createSpecificErrorHandler(
      [
        {
          check: (e) =>
            e.message.includes('violates foreign key constraint') &&
            e.message.includes('expenses_plan_id_fkey'),
          key: 'EXPENSES.PLAN_NOT_FOUND',
        },
        {
          check: (e) =>
            e.message.includes('violates foreign key constraint') &&
            e.message.includes('expenses_plan_item_id_fkey'),
          key: 'EXPENSES.PLAN_ITEM_NOT_FOUND',
        },
      ],
      'EXPENSES.CREATE_FAILED',
    ),
  })
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { id: string; updates: ExpenseUpdate; planId?: string }) =>
      updateExpense(vars.id, vars.updates),
    onSuccess: (_data, vars) => {
      if (vars.planId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.byPlan(vars.planId),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.summary(vars.planId),
        })
      }
    },
    onError: createMutationErrorHandler('EXPENSES.UPDATE_FAILED'),
  })
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: {
      expenseId: string
      planId?: string
      planItemId?: string | null
      hasRemainingExpensesForItem?: boolean
    }) => {
      await deleteExpense(vars.expenseId)

      if (vars.planItemId && !vars.hasRemainingExpensesForItem) {
        await updatePlanItemCompletion(vars.planItemId, false)
      }
    },
    onSuccess: (_data, vars) => {
      if (vars.planId) {
        invalidateExpenseQueries(queryClient, vars.planId)
      }
    },
    onError: createMutationErrorHandler('EXPENSES.DELETE_FAILED'),
  })
}

export function useDeleteExpensesBatchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: {
      expenseIds: string[]
      planId?: string
      planItemId?: string | null
      hasRemainingExpensesForItem?: boolean
    }) => {
      await deleteExpenses(vars.expenseIds)

      if (vars.planItemId && !vars.hasRemainingExpensesForItem) {
        await updatePlanItemCompletion(vars.planItemId, false)
      }
    },
    onSuccess: (_data, vars) => {
      if (vars.planId) {
        invalidateExpenseQueries(queryClient, vars.planId)
      }
    },
    onError: createMutationErrorHandler('EXPENSES.DELETE_FAILED'),
  })
}

export function useExpensesByDateRangeQuery(
  planId: MaybeRefOrGetter<string | null>,
  startDate: MaybeRefOrGetter<string>,
  endDate: MaybeRefOrGetter<string>,
) {
  return useQuery({
    queryKey: computed(() =>
      queryKeys.expenses.byDateRange(toValue(planId) ?? '', toValue(startDate), toValue(endDate)),
    ),
    queryFn: () => getExpensesByDateRange(toValue(planId)!, toValue(startDate), toValue(endDate)),
    enabled: computed(() => !!toValue(planId) && !!toValue(startDate) && !!toValue(endDate)),
    staleTime: EXPENSES_STALE_TIME_MS,
    gcTime: EXPENSES_CACHE_TIME_MS,
    meta: { errorKey: 'EXPENSES.LOAD_DATE_RANGE_FAILED' as const },
  })
}

export function useExpensesByCategoryQuery(
  planId: MaybeRefOrGetter<string | null>,
  categoryId: MaybeRefOrGetter<string>,
) {
  return useQuery({
    queryKey: computed(() =>
      queryKeys.expenses.byCategory(toValue(planId) ?? '', toValue(categoryId)),
    ),
    queryFn: () => getExpensesByCategory(toValue(planId)!, toValue(categoryId)),
    enabled: computed(() => !!toValue(planId) && !!toValue(categoryId)),
    staleTime: EXPENSES_STALE_TIME_MS,
    gcTime: EXPENSES_CACHE_TIME_MS,
    meta: { errorKey: 'EXPENSES.LOAD_CATEGORY_FAILED' as const },
  })
}
