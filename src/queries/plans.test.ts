import { beforeEach, describe, expect, it, vi } from 'vitest'

import { queryKeys } from './query-keys'
import { useCreatePlanWithItemsMutation, usePlanDetailQuery } from './plans'

const mocks = vi.hoisted(() => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
  invalidateQueries: vi.fn(),
  createPlanWithItems: vi.fn(),
  getEntityLoadErrorKind: vi.fn(),
}))

vi.mock('@tanstack/vue-query', () => ({
  useMutation: mocks.useMutation,
  useQuery: mocks.useQuery,
  useQueryClient: () => ({
    invalidateQueries: mocks.invalidateQueries,
  }),
}))

vi.mock('src/api', () => ({
  getPlans: vi.fn(),
  getPlanWithItems: vi.fn(),
  createPlan: vi.fn(),
  createPlanWithItems: mocks.createPlanWithItems,
  updatePlan: vi.fn(),
  updatePlanWithItems: vi.fn(),
  deletePlan: vi.fn(),
  createPlanItems: vi.fn(),
  deletePlanItems: vi.fn(),
  batchUpdatePlanItems: vi.fn(),
  getPlanItems: vi.fn(),
  getEntityLoadErrorKind: mocks.getEntityLoadErrorKind,
}))

vi.mock('src/api/plans', () => ({
  updatePlanItemCompletion: vi.fn(),
  updatePlanItemsCompletion: vi.fn(),
}))

vi.mock('src/stores/user', () => ({
  useUserStore: () => ({
    userProfile: { id: 'user-1' },
  }),
}))

vi.mock('./query-error-handler', () => ({
  createSpecificErrorHandler: vi.fn(() => vi.fn()),
  createMutationErrorHandler: vi.fn(() => vi.fn()),
}))

type MutationOptions = {
  mutationFn: (variables: {
    plan: {
      name: string
      start_date: string
      end_date: string
      template_id: string
      status: string
    }
    items: Array<{
      name: string
      category_id: string
      amount: number
      is_fixed_payment: boolean
    }>
  }) => Promise<{ id: string }>
  onSuccess: (data: { id: string }) => void
}

type QueryOptions = {
  queryKey: { value: readonly unknown[] }
  enabled: { value: boolean }
  retry: (failureCount: number, error: Error) => boolean
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.useMutation.mockImplementation((options) => options)
  mocks.useQuery.mockImplementation((options) => options)
})

describe('plan query contracts', () => {
  it('invalidates every plan-dependent cache after an atomic create', async () => {
    const variables = {
      plan: {
        name: 'Summer',
        start_date: '2026-07-01',
        end_date: '2026-07-31',
        template_id: 'template-1',
        status: 'active',
      },
      items: [
        {
          name: 'Food',
          category_id: 'category-1',
          amount: 500,
          is_fixed_payment: false,
        },
      ],
    }
    mocks.createPlanWithItems.mockResolvedValue({ id: 'plan-1' })

    useCreatePlanWithItemsMutation()
    const options = mocks.useMutation.mock.calls[0]?.[0] as MutationOptions

    const createdPlan = await options.mutationFn(variables)
    options.onSuccess(createdPlan)

    expect(mocks.createPlanWithItems).toHaveBeenCalledWith(variables.plan, variables.items)
    expect(mocks.invalidateQueries.mock.calls.map(([options]) => options)).toEqual([
      { queryKey: queryKeys.plans.list('user-1') },
      { queryKey: queryKeys.plans.detail('plan-1', 'user-1') },
      { queryKey: queryKeys.plans.items('plan-1') },
      { queryKey: queryKeys.expenses.byPlan('plan-1') },
      { queryKey: queryKeys.expenses.summary('plan-1') },
      { queryKey: queryKeys.expenses.overviewSnapshotsAll() },
      { queryKey: queryKeys.expenses.dateRanges('plan-1') },
      { queryKey: queryKeys.expenses.categories('plan-1') },
      { queryKey: queryKeys.expenses.recentAll() },
    ])
  })

  it('keys detail data by plan and user and avoids retrying terminal load errors', () => {
    usePlanDetailQuery('plan-1', 'user-1')
    const options = mocks.useQuery.mock.calls[0]?.[0] as QueryOptions
    const error = new Error('load failed')

    expect(options.queryKey.value).toEqual(queryKeys.plans.detail('plan-1', 'user-1'))
    expect(options.enabled.value).toBe(true)

    mocks.getEntityLoadErrorKind.mockReturnValueOnce('not-found')
    expect(options.retry(0, error)).toBe(false)

    mocks.getEntityLoadErrorKind.mockReturnValueOnce('access-denied')
    expect(options.retry(0, error)).toBe(false)

    mocks.getEntityLoadErrorKind.mockReturnValueOnce('transient')
    expect(options.retry(0, error)).toBe(true)
    expect(options.retry(1, error)).toBe(false)
  })
})
