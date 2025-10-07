import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { useExpenseRegistration } from './useExpenseRegistration'
import { useExpensesStore } from 'src/stores/expenses'
import { usePlansStore } from 'src/stores/plans'
import { useCategoriesStore } from 'src/stores/categories'
import { useNotificationStore } from 'src/stores/notification'
import type { Tables } from 'src/lib/supabase/types'

type Plan = Tables<'plans'>
type PlanItem = Tables<'plan_items'>
type Category = Tables<'categories'>

vi.mock('src/api/plans', () => ({
  getPlanItems: vi.fn(),
  updatePlanItemCompletion: vi.fn(),
}))

let pinia: TestingPinia

beforeEach(() => {
  pinia = createTestingPinia({ createSpy: vi.fn })
  setActivePinia(pinia)
  vi.clearAllMocks()
})

describe('useExpenseRegistration', () => {
  const mockPlan: Plan = {
    id: 'plan-1',
    name: 'Monthly Budget',
    start_date: '2024-01-01',
    end_date: '2024-01-31',
    status: 'active',
    total: 1000,
    currency: 'USD',
    owner_id: 'user-1',
    template_id: 'template-1',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  }

  const mockCategory: Category = {
    id: 'cat-1',
    name: 'Food',
    color: '#FF5733',
    icon: 'eva-shopping-bag-outline',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  }

  const mockPlanItems: PlanItem[] = [
    {
      id: 'item-1',
      plan_id: 'plan-1',
      category_id: 'cat-1',
      name: 'Groceries',
      amount: 100,
      is_completed: false,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  ]

  describe('initialization', () => {
    it('initializes with default form values', () => {
      const { form } = useExpenseRegistration()

      expect(form.value.planId).toBeNull()
      expect(form.value.categoryId).toBeNull()
      expect(form.value.name).toBe('')
      expect(form.value.amount).toBeNull()
      expect(form.value.expenseDate).toBeTruthy()
      expect(form.value.planItemId).toBeNull()
    })

    it('loads plans and categories on initialize', async () => {
      const plansStore = usePlansStore()
      const categoriesStore = useCategoriesStore()

      const { initialize } = useExpenseRegistration()
      await initialize(false)

      expect(plansStore.loadPlans).toHaveBeenCalled()
      expect(categoriesStore.loadCategories).toHaveBeenCalled()
    })

    it('auto-selects most recently used plan when configured', async () => {
      const plansStore = usePlansStore()
      const expensesStore = useExpensesStore()
      // @ts-expect-error - Testing Pinia computed
      plansStore.plansForExpenses = [
        { ...mockPlan, updated_at: '2024-01-02' },
        { ...mockPlan, id: 'plan-2', updated_at: '2024-01-03' },
      ]

      const { getPlanItems } = await import('src/api/plans')
      vi.mocked(getPlanItems).mockResolvedValue(mockPlanItems)

      const { initialize, form } = useExpenseRegistration()
      await initialize(true)

      expect(form.value.planId).toBe('plan-2')
      expect(expensesStore.loadExpenseSummaryForPlan).toHaveBeenCalledWith('plan-2')
    })

    it('uses default plan ID when provided', async () => {
      const defaultPlanId = ref('plan-1')
      const expensesStore = useExpensesStore()

      const { getPlanItems } = await import('src/api/plans')
      vi.mocked(getPlanItems).mockResolvedValue(mockPlanItems)

      const { initialize, form } = useExpenseRegistration(defaultPlanId)
      await initialize(false)

      expect(form.value.planId).toBe('plan-1')
      expect(expensesStore.loadExpenseSummaryForPlan).toHaveBeenCalledWith('plan-1')
    })
  })

  describe('mostRecentlyUsedPlan', () => {
    it('returns most recently updated plan', () => {
      const plansStore = usePlansStore()
      // @ts-expect-error - Testing Pinia computed
      plansStore.plansForExpenses = [
        { ...mockPlan, updated_at: '2024-01-02' },
        { ...mockPlan, id: 'plan-2', updated_at: '2024-01-03' },
        { ...mockPlan, id: 'plan-3', updated_at: '2024-01-01' },
      ]

      const { mostRecentlyUsedPlan } = useExpenseRegistration()

      expect(mostRecentlyUsedPlan.value?.id).toBe('plan-2')
    })

    it('returns null when no plans available', () => {
      const plansStore = usePlansStore()
      // @ts-expect-error - Testing Pinia computed
      plansStore.plansForExpenses = []

      const { mostRecentlyUsedPlan } = useExpenseRegistration()

      expect(mostRecentlyUsedPlan.value).toBeNull()
    })
  })

  describe('planOptions', () => {
    it('maps plans to plan options', () => {
      const plansStore = usePlansStore()
      // @ts-expect-error - Testing Pinia computed
      plansStore.plansForExpenses = [mockPlan]

      const { planOptions } = useExpenseRegistration()

      expect(planOptions.value).toHaveLength(1)
      expect(planOptions.value[0]).toMatchObject({
        label: 'Monthly Budget',
        value: 'plan-1',
        currency: 'USD',
      })
    })
  })

  describe('categoryOptions', () => {
    it('returns categories with expense summary data', () => {
      const plansStore = usePlansStore()
      const categoriesStore = useCategoriesStore()
      const expensesStore = useExpensesStore()

      plansStore.plans = [mockPlan]
      categoriesStore.categories = [{ ...mockCategory, templates: [] }]
      expensesStore.expenseSummary = [
        {
          category_id: 'cat-1',
          planned_amount: 500,
          actual_amount: 150,
          remaining_amount: 350,
          expense_count: 1,
        },
      ]

      const { form, categoryOptions } = useExpenseRegistration()
      form.value.planId = 'plan-1'

      expect(categoryOptions.value).toHaveLength(1)
      expect(categoryOptions.value[0]).toMatchObject({
        label: 'Food',
        value: 'cat-1',
        plannedAmount: 500,
        actualAmount: 150,
        remainingAmount: 350,
      })
    })

    it('returns empty array when no plan selected', () => {
      const { categoryOptions } = useExpenseRegistration()

      expect(categoryOptions.value).toEqual([])
    })
  })

  describe('budgetWarning', () => {
    it('shows warning when expense exceeds budget', () => {
      const plansStore = usePlansStore()
      const categoriesStore = useCategoriesStore()
      const expensesStore = useExpensesStore()

      plansStore.plans = [mockPlan]
      categoriesStore.categories = [{ ...mockCategory, templates: [] }]
      expensesStore.expenseSummary = [
        {
          category_id: 'cat-1',
          planned_amount: 100,
          actual_amount: 80,
          remaining_amount: 20,
          expense_count: 1,
        },
      ]

      const { form, budgetWarning } = useExpenseRegistration()
      form.value.planId = 'plan-1'
      form.value.categoryId = 'cat-1'
      form.value.amount = 50

      expect(budgetWarning.value).toContain('exceed the budget')
    })

    it('returns empty string when within budget', () => {
      const plansStore = usePlansStore()
      const categoriesStore = useCategoriesStore()
      const expensesStore = useExpensesStore()

      plansStore.plans = [mockPlan]
      categoriesStore.categories = [{ ...mockCategory, templates: [] }]
      expensesStore.expenseSummary = [
        {
          category_id: 'cat-1',
          planned_amount: 100,
          actual_amount: 50,
          remaining_amount: 50,
          expense_count: 1,
        },
      ]

      const { form, budgetWarning } = useExpenseRegistration()
      form.value.planId = 'plan-1'
      form.value.categoryId = 'cat-1'
      form.value.amount = 20

      expect(budgetWarning.value).toBe('')
    })
  })

  describe('loadPlanItems', () => {
    it('loads plan items and filters completed ones', async () => {
      const { getPlanItems } = await import('src/api/plans')
      vi.mocked(getPlanItems).mockResolvedValue([
        ...mockPlanItems,
        { ...mockPlanItems[0]!, id: 'item-2', is_completed: true },
      ])

      const { loadPlanItems, planItems } = useExpenseRegistration()
      await loadPlanItems('plan-1')

      expect(planItems.value).toHaveLength(1)
      expect(planItems.value[0]?.is_completed).toBe(false)
    })

    it('handles error when loading plan items fails', async () => {
      const notificationStore = useNotificationStore()
      const { getPlanItems } = await import('src/api/plans')
      vi.mocked(getPlanItems).mockRejectedValue(new Error('Network error'))

      const { loadPlanItems, planItems } = useExpenseRegistration()
      await loadPlanItems('plan-1')

      expect(planItems.value).toEqual([])
      expect(notificationStore.showError).toHaveBeenCalledWith('Failed to load plan items')
    })
  })

  describe('onPlanSelected', () => {
    it('resets form state when plan is selected', async () => {
      const expensesStore = useExpensesStore()
      const { getPlanItems } = await import('src/api/plans')
      vi.mocked(getPlanItems).mockResolvedValue(mockPlanItems)

      const { onPlanSelected, form, selectedPlanItems } = useExpenseRegistration()
      form.value.categoryId = 'cat-1'
      selectedPlanItems.value = [mockPlanItems[0]!]

      await onPlanSelected('plan-1')

      expect(form.value.categoryId).toBeNull()
      expect(selectedPlanItems.value).toEqual([])
      expect(expensesStore.loadExpenseSummaryForPlan).toHaveBeenCalledWith('plan-1')
    })
  })

  describe('quick select mode', () => {
    it('proceeds to finalize phase when items selected', () => {
      const { proceedToFinalize, quickSelectPhase, selectedPlanItems } = useExpenseRegistration()
      selectedPlanItems.value = [mockPlanItems[0]!]

      proceedToFinalize()

      expect(quickSelectPhase.value).toBe('finalize')
    })

    it('shows error when trying to finalize without items', () => {
      const notificationStore = useNotificationStore()
      const { proceedToFinalize, quickSelectPhase } = useExpenseRegistration()

      proceedToFinalize()

      expect(quickSelectPhase.value).toBe('selection')
      expect(notificationStore.showError).toHaveBeenCalledWith(
        'Please select at least one item to continue',
      )
    })

    it('goes back to selection phase', () => {
      const { goBackToSelection, quickSelectPhase } = useExpenseRegistration()
      quickSelectPhase.value = 'finalize'

      goBackToSelection()

      expect(quickSelectPhase.value).toBe('selection')
    })

    it('removes selected item', () => {
      const { removeSelectedItem, selectedPlanItems, quickSelectPhase } = useExpenseRegistration()
      selectedPlanItems.value = [mockPlanItems[0]!]
      quickSelectPhase.value = 'finalize'

      removeSelectedItem('item-1')

      expect(selectedPlanItems.value).toEqual([])
      expect(quickSelectPhase.value).toBe('selection')
    })
  })

  describe('handleQuickSelectSubmit', () => {
    it('registers multiple expenses successfully', async () => {
      const expensesStore = useExpensesStore()
      const notificationStore = useNotificationStore()
      const { updatePlanItemCompletion } = await import('src/api/plans')
      vi.mocked(updatePlanItemCompletion).mockResolvedValue()

      const onSuccess = vi.fn()
      const { handleQuickSelectSubmit, selectedPlanItems, form } = useExpenseRegistration()
      selectedPlanItems.value = [mockPlanItems[0]!]
      form.value.expenseDate = '2024-01-15'

      await handleQuickSelectSubmit(onSuccess)

      expect(expensesStore.addExpense).toHaveBeenCalled()
      expect(updatePlanItemCompletion).toHaveBeenCalledWith('item-1', true)
      expect(notificationStore.showSuccess).toHaveBeenCalledWith(
        '1 expense registered successfully!',
      )
      expect(onSuccess).toHaveBeenCalled()
    })

    it('shows error when no items selected', async () => {
      const notificationStore = useNotificationStore()
      const onSuccess = vi.fn()
      const { handleQuickSelectSubmit } = useExpenseRegistration()

      await handleQuickSelectSubmit(onSuccess)

      expect(notificationStore.showError).toHaveBeenCalledWith('Please select at least one item')
      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('shows error when no date selected', async () => {
      const notificationStore = useNotificationStore()
      const onSuccess = vi.fn()
      const { handleQuickSelectSubmit, selectedPlanItems, form } = useExpenseRegistration()
      selectedPlanItems.value = [mockPlanItems[0]!]
      form.value.expenseDate = ''

      await handleQuickSelectSubmit(onSuccess)

      expect(notificationStore.showError).toHaveBeenCalledWith('Please select an expense date')
      expect(onSuccess).not.toHaveBeenCalled()
    })
  })

  describe('handleCustomEntrySubmit', () => {
    it('registers single expense successfully', async () => {
      const expensesStore = useExpensesStore()
      const notificationStore = useNotificationStore()
      const { updatePlanItemCompletion } = await import('src/api/plans')
      vi.mocked(updatePlanItemCompletion).mockResolvedValue()

      const onSuccess = vi.fn()
      const { handleCustomEntrySubmit, form } = useExpenseRegistration()
      form.value.planId = 'plan-1'
      form.value.categoryId = 'cat-1'
      form.value.name = 'Test Expense'
      form.value.amount = 50

      await handleCustomEntrySubmit(true, onSuccess)

      expect(expensesStore.addExpense).toHaveBeenCalledWith({
        plan_id: 'plan-1',
        category_id: 'cat-1',
        name: 'Test Expense',
        amount: 50,
        expense_date: expect.any(String),
        plan_item_id: null,
      })
      expect(notificationStore.showSuccess).toHaveBeenCalledWith('Expense registered successfully!')
      expect(onSuccess).toHaveBeenCalled()
    })

    it('marks plan item as completed when planItemId is provided', async () => {
      const { updatePlanItemCompletion } = await import('src/api/plans')
      vi.mocked(updatePlanItemCompletion).mockResolvedValue()

      const onSuccess = vi.fn()
      const { handleCustomEntrySubmit, form } = useExpenseRegistration()
      form.value.planId = 'plan-1'
      form.value.categoryId = 'cat-1'
      form.value.name = 'Test Expense'
      form.value.amount = 50
      form.value.planItemId = 'item-1'

      await handleCustomEntrySubmit(true, onSuccess)

      expect(updatePlanItemCompletion).toHaveBeenCalledWith('item-1', true)
    })

    it('shows error when form is not valid', async () => {
      const notificationStore = useNotificationStore()
      const onSuccess = vi.fn()
      const { handleCustomEntrySubmit } = useExpenseRegistration()

      await handleCustomEntrySubmit(false, onSuccess)

      expect(notificationStore.showError).toHaveBeenCalledWith(
        'Please fix the form errors before submitting',
      )
      expect(onSuccess).not.toHaveBeenCalled()
    })
  })

  describe('canSubmit', () => {
    it('returns true for valid quick select submission', () => {
      const { canSubmit, currentMode, quickSelectPhase, selectedPlanItems, form } =
        useExpenseRegistration()
      currentMode.value = 'quick-select'
      quickSelectPhase.value = 'finalize'
      selectedPlanItems.value = [mockPlanItems[0]!]
      form.value.expenseDate = '2024-01-15'

      expect(canSubmit.value).toBe(true)
    })

    it('returns true for valid custom entry submission', () => {
      const { canSubmit, currentMode, form } = useExpenseRegistration()
      currentMode.value = 'custom-entry'
      form.value.planId = 'plan-1'
      form.value.categoryId = 'cat-1'
      form.value.name = 'Test'
      form.value.amount = 50

      expect(canSubmit.value).toBe(true)
    })

    it('returns false when required fields missing', () => {
      const { canSubmit, currentMode } = useExpenseRegistration()
      currentMode.value = 'custom-entry'

      expect(canSubmit.value).toBe(false)
    })
  })

  describe('resetForm', () => {
    it('resets all form state', () => {
      const { resetForm, form, selectedPlanItems, currentMode } = useExpenseRegistration()
      form.value.planId = 'plan-1'
      form.value.name = 'Test'
      selectedPlanItems.value = [mockPlanItems[0]!]
      currentMode.value = 'custom-entry'

      resetForm()

      expect(form.value.planId).toBeNull()
      expect(form.value.name).toBe('')
      expect(selectedPlanItems.value).toEqual([])
      expect(currentMode.value).toBe('quick-select')
    })
  })
})
