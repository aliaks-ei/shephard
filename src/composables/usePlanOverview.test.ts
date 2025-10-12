import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { usePlanOverview } from './usePlanOverview'
import { usePlansStore } from 'src/stores/plans'
import { useExpensesStore } from 'src/stores/expenses'
import { useCategoriesStore } from 'src/stores/categories'
import type { PlanWithItems, ExpenseWithCategory } from 'src/api'
import type { Tables } from 'src/lib/supabase/types'

type Category = Tables<'categories'>

let pinia: TestingPinia

beforeEach(() => {
  pinia = createTestingPinia({ createSpy: vi.fn })
  setActivePinia(pinia)
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

  const mockCategories: Category[] = [
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

  const mockExpenses: ExpenseWithCategory[] = [
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
      categories: mockCategories[0]!,
    },
  ]

  describe('currentPlanWithItems', () => {
    it('returns plan from argument when provided', () => {
      const planArg = ref(mockPlanWithItems)
      const { totalBudget } = usePlanOverview('plan-1', planArg)

      expect(totalBudget.value).toBe(800)
    })

    it('returns plan from store when argument is not provided', () => {
      const plansStore = usePlansStore()
      plansStore.plans = [mockPlanWithItems] as unknown as typeof plansStore.plans

      const { totalBudget } = usePlanOverview('plan-1')

      expect(totalBudget.value).toBeGreaterThan(0)
    })

    it('returns null when plan is not found', () => {
      const plansStore = usePlansStore()
      plansStore.plans = []

      const { totalBudget } = usePlanOverview('non-existent')

      expect(totalBudget.value).toBe(0)
    })
  })

  describe('totalBudget', () => {
    it('calculates total from plan items', () => {
      const planArg = ref(mockPlanWithItems)
      const { totalBudget } = usePlanOverview('plan-1', planArg)

      expect(totalBudget.value).toBe(800)
    })

    it('returns 0 when plan has empty items array', () => {
      const planWithoutItems = {
        ...mockPlanWithItems,
        plan_items: [],
      }
      const planArg = ref(planWithoutItems)
      const { totalBudget } = usePlanOverview('plan-1', planArg)

      expect(totalBudget.value).toBe(0)
    })

    it('returns 0 when plan is null', () => {
      const { totalBudget } = usePlanOverview('non-existent')

      expect(totalBudget.value).toBe(0)
    })
  })

  describe('totalSpent', () => {
    it('returns total expenses amount from store', () => {
      const expensesStore = useExpensesStore()
      // @ts-expect-error - Testing Pinia computed
      expensesStore.totalExpensesAmount = 350

      const { totalSpent } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(totalSpent.value).toBe(350)
    })
  })

  describe('remainingBudget', () => {
    it('calculates remaining budget correctly with only fixed items', () => {
      const expensesStore = useExpensesStore()
      // @ts-expect-error - Testing Pinia computed
      expensesStore.totalExpensesAmount = 350

      const { remainingBudget } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      // With only non-completed fixed items ($500 + $300) and no non-fixed items:
      // Still to pay = $800 + max(0, $0 - $350) = $800
      expect(remainingBudget.value).toBe(800)
    })

    it('calculates remaining budget correctly with fixed and non-fixed items', () => {
      const expensesStore = useExpensesStore()
      // @ts-expect-error - Testing Pinia computed
      expensesStore.totalExpensesAmount = 120

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

      const { remainingBudget } = usePlanOverview('plan-1', ref(planWithMixedItems))

      // Fixed items: $100 + $50 = $150
      // Non-fixed items: $200
      // Expenses: $120
      // Still to pay = $150 + ($200 - $120) = $230
      expect(remainingBudget.value).toBe(230)
    })

    it('calculates remaining budget correctly when expenses exceed non-fixed items', () => {
      const expensesStore = useExpensesStore()
      // @ts-expect-error - Testing Pinia computed
      expensesStore.totalExpensesAmount = 300

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

      const { remainingBudget } = usePlanOverview('plan-1', ref(planWithMixedItems))

      // Fixed items: $100
      // Non-fixed items: $200
      // Expenses: $300
      // Still to pay = $100 + max(0, $200 - $300) = $100 + $0 = $100
      expect(remainingBudget.value).toBe(100)
    })

    it('excludes completed fixed items from calculation', () => {
      const expensesStore = useExpensesStore()
      // @ts-expect-error - Testing Pinia computed
      expensesStore.totalExpensesAmount = 0

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

      const { remainingBudget } = usePlanOverview('plan-1', ref(planWithCompletedItems))

      // Only non-completed fixed items: $50
      // No non-fixed items, no expenses
      // Still to pay = $50 + max(0, $0 - $0) = $50
      expect(remainingBudget.value).toBe(50)
    })
  })

  describe('categoryBudgets', () => {
    it('creates category budgets from expense summary', () => {
      const expensesStore = useExpensesStore()
      const categoriesStore = useCategoriesStore()

      expensesStore.expenseSummary = [
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
      categoriesStore.categories = mockCategories.map((c) => ({ ...c, templates: [] }))

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
      const expensesStore = useExpensesStore()
      const categoriesStore = useCategoriesStore()

      expensesStore.expenseSummary = [
        {
          category_id: 'cat-1',
          planned_amount: 0,
          actual_amount: 150,
          remaining_amount: -150,
          expense_count: 1,
        },
      ]
      categoriesStore.categories = mockCategories.map((c) => ({ ...c, templates: [] }))

      const { categoryBudgets } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      const foodBudget = categoryBudgets.value.find((b) => b.categoryId === 'cat-1')
      expect(foodBudget?.plannedAmount).toBe(500)
    })

    it('filters out categories without category data', () => {
      const expensesStore = useExpensesStore()
      const categoriesStore = useCategoriesStore()

      expensesStore.expenseSummary = [
        {
          category_id: 'cat-999',
          planned_amount: 100,
          actual_amount: 50,
          remaining_amount: 50,
          expense_count: 1,
        },
      ]
      categoriesStore.categories = mockCategories.map((c) => ({ ...c, templates: [] }))

      const { categoryBudgets } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(categoryBudgets.value).toHaveLength(0)
    })

    it('sorts by percentage used descending', () => {
      const expensesStore = useExpensesStore()
      const categoriesStore = useCategoriesStore()

      expensesStore.expenseSummary = [
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
      categoriesStore.categories = mockCategories.map((c) => ({ ...c, templates: [] }))

      const { categoryBudgets } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(categoryBudgets.value[0]?.categoryId).toBe('cat-2')
      expect(categoryBudgets.value[1]?.categoryId).toBe('cat-1')
    })
  })

  describe('recentExpenses', () => {
    it('returns up to 10 most recent expenses', () => {
      const expensesStore = useExpensesStore()
      // @ts-expect-error - Testing Pinia computed
      expensesStore.sortedExpenses = mockExpenses

      const { recentExpenses } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(recentExpenses.value).toHaveLength(1)
      expect(recentExpenses.value[0]?.id).toBe('expense-1')
    })

    it('limits to 10 expenses', () => {
      const expensesStore = useExpensesStore()
      const manyExpenses = Array.from({ length: 15 }, (_, i) => ({
        ...mockExpenses[0]!,
        id: `expense-${i}`,
      }))
      // @ts-expect-error - Testing Pinia computed
      expensesStore.sortedExpenses = manyExpenses

      const { recentExpenses } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(recentExpenses.value).toHaveLength(10)
    })
  })

  describe('expensesByCategory', () => {
    it('returns expenses grouped by category from store', () => {
      const expensesStore = useExpensesStore()
      const mockExpensesByCategory = {
        'cat-1': [mockExpenses[0]!],
      }
      // @ts-expect-error - Testing Pinia computed
      expensesStore.expensesByCategory = mockExpensesByCategory

      const { expensesByCategory } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(expensesByCategory.value).toEqual(mockExpensesByCategory)
    })
  })

  describe('planHealth', () => {
    it('returns healthy status when utilization is below 80%', () => {
      const expensesStore = useExpensesStore()
      const categoriesStore = useCategoriesStore()

      // @ts-expect-error - Testing Pinia computed
      expensesStore.totalExpensesAmount = 400
      expensesStore.expenseSummary = []
      categoriesStore.categories = mockCategories.map((c) => ({ ...c, templates: [] }))

      const { planHealth } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(planHealth.value.status).toBe('healthy')
      expect(planHealth.value.budgetUtilization).toBe(50)
    })

    it('returns warning status when utilization is between 80% and 100%', () => {
      const expensesStore = useExpensesStore()
      const categoriesStore = useCategoriesStore()

      // @ts-expect-error - Testing Pinia computed
      expensesStore.totalExpensesAmount = 700
      expensesStore.expenseSummary = []
      categoriesStore.categories = mockCategories.map((c) => ({ ...c, templates: [] }))

      const { planHealth } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(planHealth.value.status).toBe('warning')
      expect(planHealth.value.budgetUtilization).toBeCloseTo(87.5)
    })

    it('returns critical status when utilization exceeds 100%', () => {
      const expensesStore = useExpensesStore()
      const categoriesStore = useCategoriesStore()

      // @ts-expect-error - Testing Pinia computed
      expensesStore.totalExpensesAmount = 900
      expensesStore.expenseSummary = []
      categoriesStore.categories = mockCategories.map((c) => ({ ...c, templates: [] }))

      const { planHealth } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(planHealth.value.status).toBe('critical')
      expect(planHealth.value.budgetUtilization).toBeCloseTo(112.5)
    })

    it('counts overBudget and nearLimit categories', () => {
      const expensesStore = useExpensesStore()
      const categoriesStore = useCategoriesStore()

      // @ts-expect-error - Testing Pinia computed
      expensesStore.totalExpensesAmount = 300
      expensesStore.expenseSummary = [
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
      categoriesStore.categories = mockCategories.map((c) => ({ ...c, templates: [] }))

      const { planHealth } = usePlanOverview('plan-1', ref(mockPlanWithItems))

      expect(planHealth.value.overBudgetCategories).toBe(1)
      expect(planHealth.value.nearLimitCategories).toBe(1)
      expect(planHealth.value.totalCategories).toBe(2)
    })
  })

  describe('reactivity', () => {
    it('reacts to planId changes', () => {
      const planIdRef = ref('plan-1')
      const plansStore = usePlansStore()
      plansStore.plans = [
        mockPlanWithItems,
        {
          ...mockPlanWithItems,
          id: 'plan-2',
          total: 2000,
        },
      ] as unknown as typeof plansStore.plans

      const { totalBudget } = usePlanOverview(planIdRef)

      planIdRef.value = 'plan-2'

      expect(totalBudget.value).toBeGreaterThan(0)
    })
  })
})
