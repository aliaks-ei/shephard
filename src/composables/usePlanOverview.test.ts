import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { usePlanOverview } from './usePlanOverview'
import type { PlanWithItems, ExpenseWithCategory, PlanExpenseSummary } from 'src/api'
import type { Tables } from 'src/lib/supabase/types'

type Category = Tables<'categories'>

const {
  mockPlans,
  mockExpenses,
  mockTotalExpensesAmount,
  mockSortedExpenses,
  mockExpensesByCategory,
  mockExpenseSummary,
  mockCategories,
} = vi.hoisted(() => ({
  mockPlans: { value: [] as PlanWithItems[] },
  mockExpenses: { value: [] as ExpenseWithCategory[] },
  mockTotalExpensesAmount: { value: 0 },
  mockSortedExpenses: { value: [] as ExpenseWithCategory[] },
  mockExpensesByCategory: { value: {} as Record<string, ExpenseWithCategory[]> },
  mockExpenseSummary: { value: [] as PlanExpenseSummary[] },
  mockCategories: { value: [] as Category[] },
}))

vi.mock('src/queries/plans', () => ({
  usePlansQuery: () => ({ plans: mockPlans }),
}))

vi.mock('src/queries/expenses', () => ({
  useExpensesByPlanQuery: () => ({
    expenses: mockExpenses,
    totalExpensesAmount: mockTotalExpensesAmount,
    sortedExpenses: mockSortedExpenses,
    expensesByCategory: mockExpensesByCategory,
  }),
  useExpenseSummaryQuery: () => ({
    expenseSummary: mockExpenseSummary,
  }),
}))

vi.mock('src/queries/categories', () => ({
  useCategoriesQuery: () => ({
    categories: mockCategories,
  }),
}))

vi.mock('src/stores/user', () => ({
  useUserStore: () => ({
    userProfile: { id: 'user-1' },
    preferences: { currency: 'USD' },
  }),
}))

beforeEach(() => {
  mockPlans.value = []
  mockExpenses.value = []
  mockTotalExpensesAmount.value = 0
  mockSortedExpenses.value = []
  mockExpensesByCategory.value = {}
  mockExpenseSummary.value = []
  mockCategories.value = []
})

describe('usePlanOverview', () => {
  const mockPlanWithItems: PlanWithItems = {
    id: 'plan-1',
    name: 'Monthly Budget',
    start_date: '2024-01-01',
    end_date: '2024-01-31',
    status: 'active',
    total: 1000,
    owner_id: 'user-1',
    template_id: 'template-1',
    currency: 'USD',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    plan_items: [
      {
        id: 'item-1',
        plan_id: 'plan-1',
        category_id: 'cat-1',
        name: 'Groceries',
        amount: 500,
        is_completed: false,
        is_fixed_payment: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      {
        id: 'item-2',
        plan_id: 'plan-1',
        category_id: 'cat-2',
        name: 'Transport',
        amount: 300,
        is_completed: false,
        is_fixed_payment: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ],
  }

  const testCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Food',
      color: '#FF5733',
      icon: 'eva-shopping-bag-outline',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: 'cat-2',
      name: 'Transport',
      color: '#3357FF',
      icon: 'eva-car-outline',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  ]

  const testExpenses: ExpenseWithCategory[] = [
    {
      id: 'expense-1',
      plan_id: 'plan-1',
      category_id: 'cat-1',
      name: 'Weekly shopping',
      amount: 150,
      expense_date: '2024-01-05',
      user_id: 'user-1',
      plan_item_id: null,
      created_at: '2024-01-05',
      updated_at: '2024-01-05',
      currency: null,
      original_amount: null,
      original_currency: null,
      categories: testCategories[0]!,
    },
  ]

  describe('currentPlanWithItems', () => {
    it('returns plan from argument when provided', () => {
      const planArg = ref(mockPlanWithItems)
      const { totalBudget } = usePlanOverview('plan-1', planArg)

      expect(totalBudget.value).toBe(800)
    })

    it('returns null when planArg is null', () => {
      mockPlans.value = [mockPlanWithItems]

      const { totalBudget } = usePlanOverview('plan-1', ref(null))

      expect(totalBudget.value).toBe(0)
    })

    it('returns null when plan is not found', () => {
      mockPlans.value = []

      const { totalBudget } = usePlanOverview('non-existent', ref(null))

      expect(totalBudget.value).toBe(0)
    })
  })

  describe('totalBudget', () => {
    it('calculates total from plan items', () => {
      const planArg = ref(mockPlanWithItems)
      const { totalBudget } = usePlanOverview('plan-1', planArg)

      expect(totalBudget.value).toBe(800)
    })

    it('falls back to plan.total when plan has empty items array', () => {
      const planWithoutItems = {
        ...mockPlanWithItems,
        plan_items: [],
      }
      const planArg = ref(planWithoutItems)
      const { totalBudget } = usePlanOverview('plan-1', planArg)

      expect(totalBudget.value).toBe(1000)
    })

    it('returns 0 when plan is null', () => {
      const { totalBudget } = usePlanOverview('non-existent', ref(null))

      expect(totalBudget.value).toBe(0)
    })
  })

  describe('totalSpent', () => {
    it('returns total expenses amount from store', () => {
      mockTotalExpensesAmount.value = 350

      const { totalSpent } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(totalSpent.value).toBe(350)
    })
  })

  describe('remainingBudget', () => {
    it('calculates remaining budget correctly with only fixed items', () => {
      mockTotalExpensesAmount.value = 350

      mockExpenseSummary.value = [
        {
          category_id: 'cat-1',
          planned_amount: 500,
          actual_amount: 150,
          remaining_amount: 500, // Fixed item, not completed, so full amount remains
          expense_count: 1,
        },
        {
          category_id: 'cat-2',
          planned_amount: 300,
          actual_amount: 200,
          remaining_amount: 300, // Fixed item, not completed, so full amount remains
          expense_count: 1,
        },
      ]
      mockCategories.value = testCategories

      const { remainingBudget } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(remainingBudget.value).toBe(800)
    })

    it('calculates remaining budget correctly with fixed and non-fixed items', () => {
      mockTotalExpensesAmount.value = 120

      const planWithMixedItems: PlanWithItems = {
        ...mockPlanWithItems,
        plan_items: [
          {
            id: 'item-1',
            plan_id: 'plan-1',
            category_id: 'cat-1',
            name: 'Rent',
            amount: 100,
            is_completed: false,
            is_fixed_payment: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          {
            id: 'item-2',
            plan_id: 'plan-1',
            category_id: 'cat-2',
            name: 'Bills',
            amount: 50,
            is_completed: false,
            is_fixed_payment: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          {
            id: 'item-3',
            plan_id: 'plan-1',
            category_id: 'cat-1',
            name: 'Groceries',
            amount: 200,
            is_completed: false,
            is_fixed_payment: false,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      }

      // Set up expense summary for each category
      mockExpenseSummary.value = [
        {
          category_id: 'cat-1',
          planned_amount: 300,
          actual_amount: 100,
          remaining_amount: 200, // calculated by the utility
          expense_count: 1,
        },
        {
          category_id: 'cat-2',
          planned_amount: 50,
          actual_amount: 20,
          remaining_amount: 50, // fixed item, not completed
          expense_count: 1,
        },
      ]
      mockCategories.value = testCategories

      const { remainingBudget } = usePlanOverview('plan-1', ref(planWithMixedItems))

      expect(remainingBudget.value).toBe(250)
    })

    it('calculates remaining budget correctly when expenses exceed non-fixed items', () => {
      mockTotalExpensesAmount.value = 300

      const planWithMixedItems: PlanWithItems = {
        ...mockPlanWithItems,
        plan_items: [
          {
            id: 'item-1',
            plan_id: 'plan-1',
            category_id: 'cat-1',
            name: 'Rent',
            amount: 100,
            is_completed: false,
            is_fixed_payment: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          {
            id: 'item-2',
            plan_id: 'plan-1',
            category_id: 'cat-2',
            name: 'Groceries',
            amount: 200,
            is_completed: false,
            is_fixed_payment: false,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      }

      // Set up expense summary for each category
      mockExpenseSummary.value = [
        {
          category_id: 'cat-1',
          planned_amount: 100,
          actual_amount: 50,
          remaining_amount: 100, // fixed, not completed
          expense_count: 1,
        },
        {
          category_id: 'cat-2',
          planned_amount: 200,
          actual_amount: 250,
          remaining_amount: 0, // non-fixed, expenses exceed budget
          expense_count: 1,
        },
      ]
      mockCategories.value = testCategories

      const { remainingBudget } = usePlanOverview('plan-1', ref(planWithMixedItems))

      expect(remainingBudget.value).toBe(100)
    })

    it('excludes completed fixed items from calculation', () => {
      mockTotalExpensesAmount.value = 0

      const planWithCompletedItems: PlanWithItems = {
        ...mockPlanWithItems,
        plan_items: [
          {
            id: 'item-1',
            plan_id: 'plan-1',
            category_id: 'cat-1',
            name: 'Rent',
            amount: 100,
            is_completed: true, // Completed
            is_fixed_payment: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          {
            id: 'item-2',
            plan_id: 'plan-1',
            category_id: 'cat-2',
            name: 'Bills',
            amount: 50,
            is_completed: false, // Not completed
            is_fixed_payment: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      }

      // Set up expense summary for each category
      mockExpenseSummary.value = [
        {
          category_id: 'cat-1',
          planned_amount: 100,
          actual_amount: 100,
          remaining_amount: 0, // completed, so nothing remaining
          expense_count: 1,
        },
        {
          category_id: 'cat-2',
          planned_amount: 50,
          actual_amount: 0,
          remaining_amount: 50, // not completed, full amount remains
          expense_count: 0,
        },
      ]
      mockCategories.value = testCategories

      const { remainingBudget } = usePlanOverview('plan-1', ref(planWithCompletedItems))

      expect(remainingBudget.value).toBe(50)
    })
  })

  describe('categoryBudgets', () => {
    it('creates category budgets from expense summary', () => {
      mockExpenseSummary.value = [
        {
          category_id: 'cat-1',
          planned_amount: 500,
          actual_amount: 150,
          remaining_amount: 350,
          expense_count: 1,
        },
        {
          category_id: 'cat-2',
          planned_amount: 300,
          actual_amount: 100,
          remaining_amount: 200,
          expense_count: 1,
        },
      ]
      mockCategories.value = testCategories

      const { categoryBudgets } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(categoryBudgets.value).toHaveLength(2)
      expect(categoryBudgets.value[0]).toMatchObject({
        categoryId: 'cat-2',
        categoryName: 'Transport',
        plannedAmount: 300,
        actualAmount: 100,
        // Still to pay = (non-completed fixed: $300) + max(0, non-fixed: $0 - expenses: $100) = $300
        remainingAmount: 300,
      })
    })

    it('uses plan items amounts when available', () => {
      mockExpenseSummary.value = [
        {
          category_id: 'cat-1',
          planned_amount: 0,
          actual_amount: 150,
          remaining_amount: -150,
          expense_count: 1,
        },
      ]
      mockCategories.value = testCategories

      const { categoryBudgets } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      const foodBudget = categoryBudgets.value.find((b) => b.categoryId === 'cat-1')
      expect(foodBudget?.plannedAmount).toBe(500)
    })

    it('filters out categories without category data', () => {
      mockExpenseSummary.value = [
        {
          category_id: 'cat-999',
          planned_amount: 100,
          actual_amount: 50,
          remaining_amount: 50,
          expense_count: 1,
        },
      ]
      mockCategories.value = testCategories

      const { categoryBudgets } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(categoryBudgets.value).toHaveLength(0)
    })

    it('sorts by percentage used descending', () => {
      mockExpenseSummary.value = [
        {
          category_id: 'cat-1',
          planned_amount: 500,
          actual_amount: 100,
          remaining_amount: 400,
          expense_count: 1,
        },
        {
          category_id: 'cat-2',
          planned_amount: 300,
          actual_amount: 250,
          remaining_amount: 50,
          expense_count: 1,
        },
      ]
      mockCategories.value = testCategories

      const { categoryBudgets } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(categoryBudgets.value[0]?.categoryId).toBe('cat-2')
      expect(categoryBudgets.value[1]?.categoryId).toBe('cat-1')
    })
  })

  describe('recentExpenses', () => {
    it('returns up to 10 most recent expenses', () => {
      mockSortedExpenses.value = testExpenses

      const { recentExpenses } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(recentExpenses.value).toHaveLength(1)
      expect(recentExpenses.value[0]?.id).toBe('expense-1')
    })

    it('limits to 10 expenses', () => {
      const manyExpenses = Array.from({ length: 15 }, (_, i) => ({
        ...testExpenses[0]!,
        id: `expense-${i}`,
      }))
      mockSortedExpenses.value = manyExpenses

      const { recentExpenses } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(recentExpenses.value).toHaveLength(10)
    })
  })

  describe('expensesByCategory', () => {
    it('returns expenses grouped by category from store', () => {
      const groupedExpenses = {
        'cat-1': [testExpenses[0]!],
      }
      mockExpensesByCategory.value = groupedExpenses

      const { expensesByCategory } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(expensesByCategory.value).toEqual(groupedExpenses)
    })
  })

  describe('planHealth', () => {
    it('returns healthy status when utilization is below 80%', () => {
      mockTotalExpensesAmount.value = 400
      mockExpenseSummary.value = []
      mockCategories.value = testCategories

      const { planHealth } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(planHealth.value.status).toBe('healthy')
      expect(planHealth.value.budgetUtilization).toBe(50)
    })

    it('returns warning status when utilization is between 80% and 100%', () => {
      mockTotalExpensesAmount.value = 700
      mockExpenseSummary.value = []
      mockCategories.value = testCategories

      const { planHealth } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(planHealth.value.status).toBe('warning')
      expect(planHealth.value.budgetUtilization).toBeCloseTo(87.5)
    })

    it('returns critical status when utilization exceeds 100%', () => {
      mockTotalExpensesAmount.value = 900
      mockExpenseSummary.value = []
      mockCategories.value = testCategories

      const { planHealth } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(planHealth.value.status).toBe('critical')
      expect(planHealth.value.budgetUtilization).toBeCloseTo(112.5)
    })

    it('counts overBudget and nearLimit categories', () => {
      mockTotalExpensesAmount.value = 300
      mockExpenseSummary.value = [
        {
          category_id: 'cat-1',
          planned_amount: 500,
          actual_amount: 450,
          remaining_amount: 50,
          expense_count: 1,
        },
        {
          category_id: 'cat-2',
          planned_amount: 300,
          actual_amount: 350,
          remaining_amount: -50,
          expense_count: 1,
        },
      ]
      mockCategories.value = testCategories

      const { planHealth } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(planHealth.value.overBudgetCategories).toBe(1)
      expect(planHealth.value.nearLimitCategories).toBe(1)
      expect(planHealth.value.totalCategories).toBe(2)
    })
  })

  describe('reactivity', () => {
    it('reacts to planArg changes', () => {
      const planArg = ref<PlanWithItems | null>(mockPlanWithItems)

      const { totalBudget } = usePlanOverview('plan-1', planArg)

      expect(totalBudget.value).toBe(800)

      const updatedPlan: PlanWithItems = {
        ...mockPlanWithItems,
        id: 'plan-2',
        plan_items: [
          {
            id: 'item-1',
            plan_id: 'plan-2',
            category_id: 'cat-1',
            name: 'Groceries',
            amount: 1000,
            is_completed: false,
            is_fixed_payment: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      }
      planArg.value = updatedPlan

      expect(totalBudget.value).toBe(1000)
    })
  })
})
