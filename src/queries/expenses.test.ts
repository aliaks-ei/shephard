import { beforeEach, describe, expect, it, vi } from 'vitest'

import { queryKeys } from './query-keys'
import {
  EXPENSE_PAGE_SIZE,
  useCreateExpensesBatchMutation,
  useRecentExpensesInfiniteQuery,
} from './expenses'

const mocks = vi.hoisted(() => ({
  useInfiniteQuery: vi.fn(),
  useMutation: vi.fn(),
  invalidateQueries: vi.fn(),
  getRecentExpensesPageForUser: vi.fn(),
  createExpenses: vi.fn(),
  markExpenseSaved: vi.fn(),
}))

vi.mock('@tanstack/vue-query', () => ({
  useInfiniteQuery: mocks.useInfiniteQuery,
  useQuery: vi.fn(),
  useMutation: mocks.useMutation,
  useQueryClient: () => ({
    invalidateQueries: mocks.invalidateQueries,
  }),
}))

vi.mock('src/api', () => ({
  getAllExpensesByPlanForExport: vi.fn(),
  getPlanExpenseSummary: vi.fn(),
  getPlanOverviewSnapshots: vi.fn(),
  getLastExpenseForPlan: vi.fn(),
  getRecentExpensesForPlan: vi.fn(),
  getExpensesByPlanPage: vi.fn(),
  getExpensesByCategoryPage: vi.fn(),
  getRecentExpensesPageForUser: mocks.getRecentExpensesPageForUser,
  getExpenseIdsForPlanItem: vi.fn(),
  createExpense: vi.fn(),
  createExpenses: mocks.createExpenses,
  deleteExpense: vi.fn(),
  deleteExpenses: vi.fn(),
  getExpensesByDateRange: vi.fn(),
}))

vi.mock('src/stores/user', () => ({
  useUserStore: () => ({
    userProfile: { id: 'user-1' },
  }),
}))

vi.mock('src/composables/useInstallPromptGate', () => ({
  useInstallPromptGate: () => ({
    markExpenseSaved: mocks.markExpenseSaved,
  }),
}))

vi.mock('./query-error-handler', () => ({
  createSpecificErrorHandler: vi.fn(() => vi.fn()),
  createMutationErrorHandler: vi.fn(() => vi.fn()),
}))

type InfiniteQueryOptions = {
  queryKey: { value: readonly unknown[] }
  queryFn: (context: { pageParam: number }) => Promise<unknown[]>
  getNextPageParam: (lastPage: unknown[], pages: unknown[][]) => number | undefined
  enabled: { value: boolean }
}

type ExpenseInput = {
  plan_id: string
  category_id: string
  name: string
  amount: number
  expense_date: string
}

type MutationOptions = {
  mutationFn: (variables: ExpenseInput[]) => Promise<Array<{ id: string }>>
  onSuccess: (data: Array<{ id: string }>, variables: ExpenseInput[]) => void
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.useInfiniteQuery.mockImplementation((options) => options)
  mocks.useMutation.mockImplementation((options) => options)
})

describe('expense query contracts', () => {
  it('uses stable filtered keys and stops pagination after a short page', async () => {
    mocks.getRecentExpensesPageForUser.mockResolvedValue([])

    useRecentExpensesInfiniteQuery('user-1', {
      search: ' groceries ',
      categoryId: 'category-1',
      sortBy: 'amount-desc',
    })
    const options = mocks.useInfiniteQuery.mock.calls[0]?.[0] as InfiniteQueryOptions

    expect(options.queryKey.value).toEqual(
      queryKeys.expenses.recent('user-1', 'groceries', 'category-1', 'amount-desc'),
    )
    expect(options.enabled.value).toBe(true)

    await options.queryFn({ pageParam: EXPENSE_PAGE_SIZE })
    expect(mocks.getRecentExpensesPageForUser).toHaveBeenCalledWith('user-1', {
      offset: EXPENSE_PAGE_SIZE,
      limit: EXPENSE_PAGE_SIZE,
      search: ' groceries ',
      categoryId: 'category-1',
      sortBy: 'amount-desc',
    })

    const fullPage = Array.from({ length: EXPENSE_PAGE_SIZE }, (_, index) => ({ id: index }))
    expect(options.getNextPageParam(fullPage, [fullPage, fullPage])).toBe(EXPENSE_PAGE_SIZE * 2)
    expect(options.getNextPageParam(fullPage.slice(0, -1), [fullPage])).toBeUndefined()
  })

  it('deduplicates plan invalidation and marks a successful batch once', async () => {
    const variables: ExpenseInput[] = [
      {
        plan_id: 'plan-1',
        category_id: 'category-1',
        name: 'Lunch',
        amount: 20,
        expense_date: '2026-07-11',
      },
      {
        plan_id: 'plan-1',
        category_id: 'category-2',
        name: 'Train',
        amount: 15,
        expense_date: '2026-07-11',
      },
    ]
    mocks.createExpenses.mockResolvedValue([{ id: 'expense-1' }, { id: 'expense-2' }])

    useCreateExpensesBatchMutation()
    const options = mocks.useMutation.mock.calls[0]?.[0] as MutationOptions

    const createdExpenses = await options.mutationFn(variables)
    options.onSuccess(createdExpenses, variables)

    expect(mocks.createExpenses).toHaveBeenCalledWith([
      { ...variables[0]!, user_id: 'user-1' },
      { ...variables[1]!, user_id: 'user-1' },
    ])
    expect(mocks.markExpenseSaved).toHaveBeenCalledOnce()
    expect(mocks.invalidateQueries.mock.calls.map(([options]) => options)).toEqual([
      { queryKey: queryKeys.expenses.byPlan('plan-1') },
      { queryKey: queryKeys.expenses.summary('plan-1') },
      { queryKey: queryKeys.expenses.overviewSnapshotsAll() },
      { queryKey: queryKeys.expenses.lastForPlan('plan-1') },
      { queryKey: queryKeys.expenses.dateRanges('plan-1') },
      { queryKey: queryKeys.expenses.categories('plan-1') },
      { queryKey: queryKeys.plans.items('plan-1') },
      { queryKey: queryKeys.expenses.recentAll() },
      { queryKey: queryKeys.plans.list('user-1') },
      { queryKey: queryKeys.plans.detail('plan-1', 'user-1') },
    ])
  })
})
