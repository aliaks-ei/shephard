import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMockPlans, createMockTemplates } from 'test/fixtures'
import { useDashboardOverview } from './useDashboardOverview'

const plans = ref(createMockPlans())
const templates = ref(createMockTemplates())
const snapshots = ref([
  {
    plan_id: plans.value[0]!.id,
    category_id: 'category-1',
    category_name: 'Food',
    category_color: '#00897b',
    category_icon: 'eva-shopping-cart-outline',
    planned_amount: 500,
    actual_amount: 125,
    remaining_amount: 375,
    expense_count: 2,
  },
])

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('src/queries/plans', () => ({
  usePlansQuery: () => ({
    activePlans: plans,
    plansForExpenses: plans,
    isPending: ref(false),
    isError: ref(false),
    isFetching: ref(false),
    refetch: vi.fn(),
  }),
}))

vi.mock('src/queries/templates', () => ({
  useTemplatesQuery: () => ({
    templates,
    templatesCount: ref(templates.value.length),
    isPending: ref(false),
    isError: ref(false),
    isFetching: ref(false),
    refetch: vi.fn(),
  }),
}))

vi.mock('src/queries/expenses', () => ({
  usePlanOverviewSnapshotsQuery: () => ({
    snapshots,
    isPending: ref(false),
    isError: ref(false),
    isFetching: ref(false),
    refetch: vi.fn(),
  }),
  useRecentExpensesInfiniteQuery: () => ({
    expenses: ref([]),
    isPending: ref(false),
    isError: ref(false),
    isFetching: ref(false),
    refetch: vi.fn(),
  }),
}))

vi.mock('src/stores/user', () => ({
  useUserStore: () => ({
    userProfile: { id: 'user-1' },
  }),
}))

vi.mock('src/composables/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: ref(true),
    isOffline: ref(false),
  }),
}))

describe('useDashboardOverview', () => {
  beforeEach(() => {
    plans.value = createMockPlans()
    templates.value = createMockTemplates()
  })

  it('builds one prop-ready overview snapshot per active plan', () => {
    const { overviewByPlanId } = useDashboardOverview()
    const plan = plans.value[0]!

    expect(overviewByPlanId.value[plan.id]).toMatchObject({
      totalBudget: plan.total,
      totalSpent: 125,
      remainingBudget: 375,
      categoryBudgets: [
        {
          categoryId: 'category-1',
          actualAmount: 125,
          remainingAmount: 375,
        },
      ],
    })
  })
})
