import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  getAllExpensesByPlanForExport,
  getPlanExpenseSummary,
  getPlanOverviewSnapshots,
  getLastExpenseForPlan,
  getRecentExpensesForPlan,
  getExpensesByPlanPage,
  getExpensesByCategoryPage,
  getRecentExpensesPageForUser,
  getExpenseIdsForPlanItem,
  createExpense,
  createExpenses,
  deleteExpense,
  deleteExpenses,
  getExpensesByDateRange,
  type ExpenseWithCategory,
  type ExpenseWithCategoryAndPlan,
  type ExpenseInsert,
  type ExpenseSort,
  type PlanExpenseSummary,
  type PlanOverviewSnapshotRow,
} from 'src/api'
import { useUserStore } from 'src/stores/user'
import { useInstallPromptGate } from 'src/composables/useInstallPromptGate'
import { queryKeys } from './query-keys'
import {
  createSpecificErrorHandler,
  createMutationErrorHandler,
  type SpecificErrorMatcher,
} from './query-error-handler'

const EXPENSES_STALE_TIME_MS = 15_000
const EXPENSES_CACHE_TIME_MS = 5 * 60_000
export const EXPENSE_PAGE_SIZE = 40
const PLAN_RECENT_EXPENSE_LIMIT = 10

const EXPENSE_FK_ERROR_MATCHERS: SpecificErrorMatcher[] = [
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
]

export function useRecentPlanExpensesQuery(planId: MaybeRefOrGetter<string | null>) {
  const query = useQuery({
    queryKey: computed(() =>
      queryKeys.expenses.recentByPlan(toValue(planId) ?? '', PLAN_RECENT_EXPENSE_LIMIT),
    ),
    queryFn: () => getRecentExpensesForPlan(toValue(planId)!, PLAN_RECENT_EXPENSE_LIMIT),
    enabled: computed(() => !!toValue(planId)),
    staleTime: EXPENSES_STALE_TIME_MS,
    gcTime: EXPENSES_CACHE_TIME_MS,
    meta: { errorKey: 'EXPENSES.LOAD_FAILED' as const },
  })

  const expenses = computed((): ExpenseWithCategory[] => query.data.value ?? [])

  return {
    ...query,
    expenses,
  }
}

type RecentExpensesFilters = {
  search?: string
  categoryId?: string | null
  sortBy?: ExpenseSort
}

export function useRecentExpensesInfiniteQuery(
  userId: MaybeRefOrGetter<string | undefined>,
  filters: MaybeRefOrGetter<RecentExpensesFilters> = {},
) {
  const query = useInfiniteQuery({
    queryKey: computed(() => {
      const resolvedFilters = toValue(filters)
      return queryKeys.expenses.recent(
        toValue(userId) ?? '',
        resolvedFilters.search?.trim() ?? '',
        resolvedFilters.categoryId ?? '',
        resolvedFilters.sortBy ?? 'date-desc',
      )
    }),
    queryFn: ({ pageParam }) =>
      getRecentExpensesPageForUser(toValue(userId)!, {
        offset: pageParam,
        limit: EXPENSE_PAGE_SIZE,
        ...toValue(filters),
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === EXPENSE_PAGE_SIZE ? pages.length * EXPENSE_PAGE_SIZE : undefined,
    enabled: computed(() => !!toValue(userId)),
    staleTime: EXPENSES_STALE_TIME_MS,
    gcTime: EXPENSES_CACHE_TIME_MS,
    meta: { errorKey: 'EXPENSES.LOAD_FAILED' as const, handledInline: true },
  })

  const expenses = computed(
    (): ExpenseWithCategoryAndPlan[] => query.data.value?.pages.flat() ?? [],
  )

  return {
    ...query,
    expenses,
  }
}

export function usePlanExpensesInfiniteQuery(
  planId: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const query = useInfiniteQuery({
    queryKey: computed(() => queryKeys.expenses.byPlan(toValue(planId) ?? '')),
    queryFn: ({ pageParam }) =>
      getExpensesByPlanPage(toValue(planId)!, {
        offset: pageParam,
        limit: EXPENSE_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === EXPENSE_PAGE_SIZE ? pages.length * EXPENSE_PAGE_SIZE : undefined,
    enabled: computed(() => !!toValue(planId) && toValue(enabled)),
    staleTime: EXPENSES_STALE_TIME_MS,
    gcTime: EXPENSES_CACHE_TIME_MS,
    meta: { errorKey: 'EXPENSES.LOAD_FAILED' as const, handledInline: true },
  })

  const expenses = computed((): ExpenseWithCategory[] => query.data.value?.pages.flat() ?? [])

  return {
    ...query,
    expenses,
  }
}

export function useCategoryExpensesInfiniteQuery(
  planId: MaybeRefOrGetter<string | null>,
  categoryId: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const query = useInfiniteQuery({
    queryKey: computed(() =>
      queryKeys.expenses.byCategory(toValue(planId) ?? '', toValue(categoryId) ?? ''),
    ),
    queryFn: ({ pageParam }) =>
      getExpensesByCategoryPage(toValue(planId)!, toValue(categoryId)!, {
        offset: pageParam,
        limit: EXPENSE_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === EXPENSE_PAGE_SIZE ? pages.length * EXPENSE_PAGE_SIZE : undefined,
    enabled: computed(() => !!toValue(planId) && !!toValue(categoryId) && toValue(enabled)),
    staleTime: EXPENSES_STALE_TIME_MS,
    gcTime: EXPENSES_CACHE_TIME_MS,
    meta: { errorKey: 'EXPENSES.LOAD_CATEGORY_FAILED' as const, handledInline: true },
  })

  const expenses = computed((): ExpenseWithCategory[] => query.data.value?.pages.flat() ?? [])

  return {
    ...query,
    expenses,
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

export function usePlanOverviewSnapshotsQuery(planIds: MaybeRefOrGetter<string[]>) {
  const sortedPlanIds = computed(() => [...toValue(planIds)].sort())
  const query = useQuery({
    queryKey: computed(() => queryKeys.expenses.overviewSnapshots(sortedPlanIds.value)),
    queryFn: () => getPlanOverviewSnapshots(sortedPlanIds.value),
    enabled: computed(() => sortedPlanIds.value.length > 0),
    staleTime: EXPENSES_STALE_TIME_MS,
    gcTime: EXPENSES_CACHE_TIME_MS,
    meta: { errorKey: 'EXPENSES.LOAD_SUMMARY_FAILED' as const, handledInline: true },
  })

  const snapshots = computed((): PlanOverviewSnapshotRow[] => query.data.value ?? [])

  return {
    ...query,
    snapshots,
  }
}

export function usePlanItemExpenseIds() {
  const queryClient = useQueryClient()

  async function fetchExpenseIds(planId: string, planItemId: string): Promise<string[]> {
    return queryClient.fetchQuery({
      queryKey: queryKeys.expenses.byPlanItem(planId, planItemId),
      queryFn: () => getExpenseIdsForPlanItem(planId, planItemId),
      staleTime: EXPENSES_STALE_TIME_MS,
    })
  }

  return { fetchExpenseIds }
}

export function usePlanExpenseExport() {
  const queryClient = useQueryClient()

  async function fetchAllExpenses(planId: string): Promise<ExpenseWithCategory[]> {
    return queryClient.fetchQuery({
      queryKey: queryKeys.expenses.exportByPlan(planId),
      queryFn: () => getAllExpensesByPlanForExport(planId),
      staleTime: EXPENSES_STALE_TIME_MS,
      gcTime: 0,
    })
  }

  async function fetchSummary(planId: string): Promise<PlanExpenseSummary[]> {
    return queryClient.fetchQuery({
      queryKey: queryKeys.expenses.summary(planId),
      queryFn: () => getPlanExpenseSummary(planId),
      staleTime: EXPENSES_STALE_TIME_MS,
    })
  }

  return { fetchAllExpenses, fetchSummary }
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
  const userId = useUserStore().userProfile?.id

  queryClient.invalidateQueries({
    queryKey: queryKeys.expenses.byPlan(planId),
  })
  queryClient.invalidateQueries({
    queryKey: queryKeys.expenses.summary(planId),
  })
  queryClient.invalidateQueries({
    queryKey: queryKeys.expenses.overviewSnapshotsAll(),
  })
  queryClient.invalidateQueries({
    queryKey: queryKeys.expenses.lastForPlan(planId),
  })
  queryClient.invalidateQueries({
    queryKey: queryKeys.expenses.dateRanges(planId),
  })
  queryClient.invalidateQueries({
    queryKey: queryKeys.expenses.categories(planId),
  })
  queryClient.invalidateQueries({
    queryKey: queryKeys.plans.items(planId),
  })
  queryClient.invalidateQueries({
    queryKey: queryKeys.expenses.recentAll(),
  })
  if (userId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.plans.list(userId),
    })
    queryClient.invalidateQueries({
      queryKey: queryKeys.plans.detail(planId, userId),
    })
  }
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient()
  const userStore = useUserStore()
  const { markExpenseSaved } = useInstallPromptGate()

  return useMutation({
    mutationFn: (expense: ExpenseInput) => {
      const userId = expense.user_id || userStore.userProfile?.id
      if (!userId) throw new Error('User not authenticated')
      return createExpense({ ...expense, user_id: userId })
    },
    onSuccess: (_data, vars) => {
      markExpenseSaved()
      if (vars.plan_id) {
        invalidateExpenseQueries(queryClient, vars.plan_id)
      }
    },
    onError: createSpecificErrorHandler(EXPENSE_FK_ERROR_MATCHERS, 'EXPENSES.CREATE_FAILED'),
  })
}

export function useCreateExpensesBatchMutation() {
  const queryClient = useQueryClient()
  const userStore = useUserStore()
  const { markExpenseSaved } = useInstallPromptGate()

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
      markExpenseSaved()
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
    onError: createSpecificErrorHandler(EXPENSE_FK_ERROR_MATCHERS, 'EXPENSES.CREATE_FAILED'),
  })
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { expenseId: string; planId?: string }) => deleteExpense(vars.expenseId),
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
    mutationFn: (vars: { expenseIds: string[]; planId?: string }) =>
      deleteExpenses(vars.expenseIds),
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
