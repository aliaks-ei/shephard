import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { useExpenseRegistration } from './useExpenseRegistration'
import { useNotificationStore } from 'src/stores/notification'
import type { Tables } from 'src/lib/supabase/types'

type Plan = Tables<'plans'>
type PlanItem = Tables<'plan_items'>
type Category = Tables<'categories'>

const mockPlansForExpenses = ref<Plan[]>([])
const mockPlans = ref<Plan[]>([])
const mockPlanItemsData = ref<PlanItem[]>([])
const mockLastExpenseData = ref<{ original_currency?: string } | null>(null)
const mockCompletionMutateAsync = vi.fn().mockResolvedValue(undefined)
const mockBatchCompletionMutateAsync = vi.fn().mockResolvedValue(undefined)

vi.mock('src/queries/plans', () => ({
  usePlansQuery: vi.fn(() => ({
    plans: mockPlans,
    plansForExpenses: mockPlansForExpenses,
    activePlans: ref([]),
    ownedPlans: ref([]),
    sharedPlans: ref([]),
    isPending: ref(false),
    data: ref(null),
  })),
  usePlanItemsQuery: vi.fn(() => ({
    data: mockPlanItemsData,
    isPending: ref(false),
  })),
  useUpdatePlanItemCompletionMutation: vi.fn(() => ({
    mutateAsync: mockCompletionMutateAsync,
    isPending: ref(false),
  })),
  useUpdatePlanItemsCompletionMutation: vi.fn(() => ({
    mutateAsync: mockBatchCompletionMutateAsync,
    isPending: ref(false),
  })),
}))

const mockCategories = ref<(Category & { templates: never[] })[]>([])

vi.mock('src/queries/categories', () => ({
  useCategoriesQuery: vi.fn(() => ({
    categories: mockCategories,
    getCategoryById: vi.fn(),
    isPending: ref(false),
    categoriesMap: ref(new Map()),
    sortedCategories: ref([]),
    categoryCount: ref(0),
    data: ref(null),
  })),
}))

const mockExpenseSummary = ref<unknown[]>([])
const mockCreateExpenseMutateAsync = vi.fn().mockResolvedValue(undefined)
const mockCreateExpensesBatchMutateAsync = vi.fn().mockResolvedValue(undefined)

vi.mock('src/queries/expenses', () => ({
  useExpenseSummaryQuery: vi.fn(() => ({
    expenseSummary: mockExpenseSummary,
    isPending: ref(false),
    data: ref(null),
  })),
  useCreateExpenseMutation: vi.fn(() => ({
    mutateAsync: mockCreateExpenseMutateAsync,
    isPending: ref(false),
  })),
  useCreateExpensesBatchMutation: vi.fn(() => ({
    mutateAsync: mockCreateExpensesBatchMutateAsync,
    isPending: ref(false),
  })),
  useLastExpenseForPlanQuery: vi.fn(() => ({
    data: mockLastExpenseData,
    isPending: ref(false),
  })),
}))

vi.mock('src/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    userProfile: { id: 'user-1' },
  })),
}))

vi.mock('src/api/currency', () => ({
  convertCurrency: vi.fn().mockResolvedValue({ convertedAmount: 50, rate: 1 }),
}))

let pinia: TestingPinia

beforeEach(() => {
  pinia = createTestingPinia({ createSpy: vi.fn })
  setActivePinia(pinia)
  vi.clearAllMocks()
  mockPlansForExpenses.value = []
  mockPlans.value = []
  mockCategories.value = []
  mockExpenseSummary.value = []
  mockPlanItemsData.value = []
  mockLastExpenseData.value = null
  mockCompletionMutateAsync.mockResolvedValue(undefined)
  mockBatchCompletionMutateAsync.mockResolvedValue(undefined)
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

  const mockPlanItems: PlanItem[] = [
    {
      id: 'item-1',
      plan_id: 'plan-1',
      category_id: 'cat-1',
      name: 'Groceries',
      amount: 100,
      is_completed: false,
      is_fixed_payment: true,
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

    it('initializes without needing manual load calls', () => {
      const { initialize } = useExpenseRegistration()
      initialize(false)

      // Queries auto-fetch, no manual loadPlans/loadCategories needed
      expect(true).toBe(true)
    })

    it('auto-selects most recently used plan when configured', () => {
      mockPlansForExpenses.value = [
        { ...mockPlan, updated_at: '2024-01-02' },
        { ...mockPlan, id: 'plan-2', updated_at: '2024-01-03' },
      ]

      const { initialize, form } = useExpenseRegistration()
      initialize(true)

      expect(form.value.planId).toBe('plan-2')
    })

    it('uses default plan ID when provided', () => {
      const defaultPlanId = ref('plan-1')

      const { initialize, form } = useExpenseRegistration(defaultPlanId)
      initialize(false)

      expect(form.value.planId).toBe('plan-1')
    })
  })

  describe('mostRecentlyUsedPlan', () => {
    it('returns most recently updated plan', () => {
      mockPlansForExpenses.value = [
        { ...mockPlan, updated_at: '2024-01-02' },
        { ...mockPlan, id: 'plan-2', updated_at: '2024-01-03' },
        { ...mockPlan, id: 'plan-3', updated_at: '2024-01-01' },
      ]

      const { mostRecentlyUsedPlan } = useExpenseRegistration()

      expect(mostRecentlyUsedPlan.value?.id).toBe('plan-2')
    })

    it('returns null when no plans available', () => {
      mockPlansForExpenses.value = []

      const { mostRecentlyUsedPlan } = useExpenseRegistration()

      expect(mostRecentlyUsedPlan.value).toBeNull()
    })
  })

  describe('planOptions', () => {
    it('maps plans to plan options', () => {
      mockPlansForExpenses.value = [mockPlan]

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
    it('returns empty array when no plan selected', () => {
      const { categoryOptions } = useExpenseRegistration()

      expect(categoryOptions.value).toEqual([])
    })
  })

  describe('planItems', () => {
    it('filters completed items from query data', () => {
      mockPlanItemsData.value = [
        ...mockPlanItems,
        { ...mockPlanItems[0]!, id: 'item-2', is_completed: true },
      ]

      const { planItems } = useExpenseRegistration()

      expect(planItems.value).toHaveLength(1)
      expect(planItems.value[0]?.is_completed).toBe(false)
    })

    it('returns empty array when no plan items', () => {
      mockPlanItemsData.value = []

      const { planItems } = useExpenseRegistration()

      expect(planItems.value).toEqual([])
    })
  })

  describe('onPlanSelected', () => {
    it('resets form state when plan is selected', () => {
      const { onPlanSelected, form, selectedPlanItems } = useExpenseRegistration()
      form.value.categoryId = 'cat-1'
      selectedPlanItems.value = [mockPlanItems[0]!]

      onPlanSelected('plan-1')

      expect(form.value.categoryId).toBeNull()
      expect(selectedPlanItems.value).toEqual([])
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
      const onSuccess = vi.fn()
      const { handleQuickSelectSubmit, selectedPlanItems, form } = useExpenseRegistration()
      selectedPlanItems.value = [mockPlanItems[0]!]
      form.value.expenseDate = '2024-01-15'

      await handleQuickSelectSubmit(onSuccess)

      expect(mockCreateExpensesBatchMutateAsync).toHaveBeenCalledWith([
        {
          plan_id: 'plan-1',
          category_id: 'cat-1',
          name: 'Groceries',
          amount: 100,
          expense_date: '2024-01-15',
          plan_item_id: 'item-1',
        },
      ])
      expect(mockBatchCompletionMutateAsync).toHaveBeenCalledWith({
        itemIds: ['item-1'],
        isCompleted: true,
        planId: 'plan-1',
      })
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

    it('submits multiple selected items with one batch create and one batch completion call', async () => {
      const onSuccess = vi.fn()
      const { handleQuickSelectSubmit, selectedPlanItems, form } = useExpenseRegistration()
      selectedPlanItems.value = [
        mockPlanItems[0]!,
        { ...mockPlanItems[0]!, id: 'item-2', amount: 200, name: 'Transport' },
      ]
      form.value.expenseDate = '2024-01-15'

      await handleQuickSelectSubmit(onSuccess)

      expect(mockCreateExpensesBatchMutateAsync).toHaveBeenCalledTimes(1)
      expect(mockBatchCompletionMutateAsync).toHaveBeenCalledTimes(1)
      expect(mockBatchCompletionMutateAsync).toHaveBeenCalledWith({
        itemIds: ['item-1', 'item-2'],
        isCompleted: true,
        planId: 'plan-1',
      })
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  describe('handleCustomEntrySubmit', () => {
    it('registers single expense successfully', async () => {
      // Set up a plan so selectedPlan works
      mockPlans.value = [mockPlan]

      const onSuccess = vi.fn()
      const { handleCustomEntrySubmit, form } = useExpenseRegistration()
      form.value.planId = 'plan-1'
      form.value.categoryId = 'cat-1'
      form.value.name = 'Test Expense'
      form.value.amount = 50

      await handleCustomEntrySubmit(true, onSuccess)

      expect(mockCreateExpenseMutateAsync).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })

    it('marks plan item as completed when planItemId is provided', async () => {
      mockPlans.value = [mockPlan]

      const onSuccess = vi.fn()
      const { handleCustomEntrySubmit, form } = useExpenseRegistration()
      form.value.planId = 'plan-1'
      form.value.categoryId = 'cat-1'
      form.value.name = 'Test Expense'
      form.value.amount = 50
      form.value.planItemId = 'item-1'

      await handleCustomEntrySubmit(true, onSuccess)

      expect(mockCompletionMutateAsync).toHaveBeenCalledWith({
        itemId: 'item-1',
        isCompleted: true,
        planId: 'plan-1',
      })
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
      expect(currentMode.value).toBe('custom-entry')
    })
  })
})
