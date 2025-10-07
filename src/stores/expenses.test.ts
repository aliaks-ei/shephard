import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'

import { useExpensesStore } from './expenses'
import { useUserStore } from './user'
import { useError } from 'src/composables/useError'
import * as expensesApi from 'src/api/expenses'
import * as plansApi from 'src/api/plans'
import { createMockExpenses, createMockExpenseSummaries } from 'test/fixtures/expenses'
import { createMockUserStoreData } from 'test/fixtures/users'
import { createMockPlanItem } from 'test/fixtures/plans'

vi.mock('src/composables/useError', () => ({
  useError: vi.fn(),
}))

vi.mock('src/api/expenses', () => ({
  getExpensesByPlan: vi.fn(),
  getPlanExpenseSummary: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  getExpensesByDateRange: vi.fn(),
  getExpensesByCategory: vi.fn(),
}))

vi.mock('src/api/plans', () => ({
  getPlanItems: vi.fn(),
  updatePlanItemCompletion: vi.fn(),
}))

vi.mock('./user', () => ({
  useUserStore: vi.fn(),
}))

vi.mock('./auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('./preferences', () => ({
  usePreferencesStore: vi.fn(),
}))

describe('Expenses Store', () => {
  const mockHandleError = vi.fn()
  const mockUserStoreData = createMockUserStoreData()
  const mockExpenses = createMockExpenses(3)
  const mockExpenseSummary = createMockExpenseSummaries(2)
  const mockPlanItems = [createMockPlanItem(), createMockPlanItem({ id: 'item-2' })]

  let expensesStore: ReturnType<typeof useExpensesStore>

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useError).mockReturnValue({
      handleError: mockHandleError,
    })

    vi.mocked(useUserStore).mockReturnValue(
      mockUserStoreData as unknown as ReturnType<typeof useUserStore>,
    )

    createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })
    expensesStore = useExpensesStore()
  })

  describe('State Management', () => {
    it('should initialize with empty state', () => {
      expect(expensesStore.expenses).toEqual([])
      expect(expensesStore.expenseSummary).toEqual([])
      expect(expensesStore.isLoading).toBe(false)
      expect(expensesStore.currentPlanId).toBeNull()
    })

    it('should calculate userId correctly', () => {
      expect(expensesStore.userId).toBe('user-1')
    })

    it('should calculate totalExpensesAmount correctly', () => {
      expensesStore.expenses = mockExpenses
      const expectedTotal = mockExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      expect(expensesStore.totalExpensesAmount).toBe(expectedTotal)
    })

    it('should return sorted expenses by date', () => {
      const unsortedExpenses = [
        { ...mockExpenses[2]!, expense_date: '2024-01-10' },
        { ...mockExpenses[0]!, expense_date: '2024-01-15' },
        { ...mockExpenses[1]!, expense_date: '2024-01-12' },
      ]
      expensesStore.expenses = unsortedExpenses

      const sorted = expensesStore.sortedExpenses
      expect(sorted[0]?.expense_date).toBe('2024-01-15')
      expect(sorted[1]?.expense_date).toBe('2024-01-12')
      expect(sorted[2]?.expense_date).toBe('2024-01-10')
    })

    it('should group expenses by category', () => {
      expensesStore.expenses = mockExpenses
      const grouped = expensesStore.expensesByCategory

      expect(grouped['cat-1']).toBeDefined()
      expect(grouped['cat-1']?.length).toBeGreaterThan(0)
    })
  })

  describe('loadExpensesForPlan', () => {
    it('should load expenses successfully', async () => {
      vi.mocked(expensesApi.getExpensesByPlan).mockResolvedValue(mockExpenses)

      await expensesStore.loadExpensesForPlan('plan-1')

      expect(expensesApi.getExpensesByPlan).toHaveBeenCalledWith('plan-1')
      expect(expensesStore.expenses).toEqual(mockExpenses)
      expect(expensesStore.currentPlanId).toBe('plan-1')
      expect(expensesStore.isLoading).toBe(false)
    })

    it('should not load expenses if userId is null', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      expensesStore = useExpensesStore()

      await expensesStore.loadExpensesForPlan('plan-1')

      expect(expensesApi.getExpensesByPlan).not.toHaveBeenCalled()
    })

    it('should handle errors when loading expenses', async () => {
      const error = new Error('Failed to load')
      vi.mocked(expensesApi.getExpensesByPlan).mockRejectedValue(error)

      await expensesStore.loadExpensesForPlan('plan-1')

      expect(mockHandleError).toHaveBeenCalledWith('EXPENSES.LOAD_FAILED', error, {
        planId: 'plan-1',
      })
      expect(expensesStore.isLoading).toBe(false)
    })
  })

  describe('loadExpenseSummaryForPlan', () => {
    it('should load expense summary successfully', async () => {
      vi.mocked(expensesApi.getPlanExpenseSummary).mockResolvedValue(mockExpenseSummary)

      await expensesStore.loadExpenseSummaryForPlan('plan-1')

      expect(expensesApi.getPlanExpenseSummary).toHaveBeenCalledWith('plan-1')
      expect(expensesStore.expenseSummary).toEqual(mockExpenseSummary)
    })

    it('should not load summary if userId is null', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      expensesStore = useExpensesStore()

      await expensesStore.loadExpenseSummaryForPlan('plan-1')

      expect(expensesApi.getPlanExpenseSummary).not.toHaveBeenCalled()
    })

    it('should handle errors when loading summary', async () => {
      const error = new Error('Failed to load summary')
      vi.mocked(expensesApi.getPlanExpenseSummary).mockRejectedValue(error)

      await expensesStore.loadExpenseSummaryForPlan('plan-1')

      expect(mockHandleError).toHaveBeenCalledWith('EXPENSES.LOAD_SUMMARY_FAILED', error, {
        planId: 'plan-1',
      })
    })
  })

  describe('addExpense', () => {
    const newExpenseData = {
      plan_id: 'plan-1',
      category_id: 'cat-1',
      amount: 100,
      name: 'New expense',
      expense_date: '2024-01-20',
    }

    it('should create expense successfully', async () => {
      const createdExpense = { ...mockExpenses[0]!, ...newExpenseData }
      vi.mocked(expensesApi.createExpense).mockResolvedValue(createdExpense)
      vi.mocked(expensesApi.getExpensesByPlan).mockResolvedValue([...mockExpenses, createdExpense])
      vi.mocked(expensesApi.getPlanExpenseSummary).mockResolvedValue(mockExpenseSummary)

      expensesStore.currentPlanId = 'plan-1'
      const result = await expensesStore.addExpense(newExpenseData)

      expect(expensesApi.createExpense).toHaveBeenCalledWith({
        ...newExpenseData,
        user_id: 'user-1',
      })
      expect(result.success).toBe(true)
      expect(result.data).toEqual(createdExpense)
    })

    it('should return failure if userId is null', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      expensesStore = useExpensesStore()

      const result = await expensesStore.addExpense(newExpenseData)

      expect(result.success).toBe(false)
      expect(expensesApi.createExpense).not.toHaveBeenCalled()
    })

    it('should handle plan not found error', async () => {
      const error = new Error('violates foreign key constraint "expenses_plan_id_fkey"')
      vi.mocked(expensesApi.createExpense).mockRejectedValue(error)

      const result = await expensesStore.addExpense(newExpenseData)

      expect(mockHandleError).toHaveBeenCalledWith('EXPENSES.PLAN_NOT_FOUND', error, {
        planId: 'plan-1',
      })
      expect(result.success).toBe(false)
    })

    it('should handle plan item not found error', async () => {
      const error = new Error('violates foreign key constraint "expenses_plan_item_id_fkey"')
      vi.mocked(expensesApi.createExpense).mockRejectedValue(error)

      const result = await expensesStore.addExpense({
        ...newExpenseData,
        plan_item_id: 'item-1',
      })

      expect(mockHandleError).toHaveBeenCalledWith('EXPENSES.PLAN_ITEM_NOT_FOUND', error, {
        planItemId: 'item-1',
      })
      expect(result.success).toBe(false)
    })

    it('should handle general errors', async () => {
      const error = new Error('General error')
      vi.mocked(expensesApi.createExpense).mockRejectedValue(error)

      const result = await expensesStore.addExpense(newExpenseData)

      expect(mockHandleError).toHaveBeenCalledWith('EXPENSES.CREATE_FAILED', error)
      expect(result.success).toBe(false)
    })
  })

  describe('editExpense', () => {
    it('should update expense successfully', async () => {
      const updates = { amount: 150, name: 'Updated expense' }
      const updatedExpense = { ...mockExpenses[0]!, ...updates }
      vi.mocked(expensesApi.updateExpense).mockResolvedValue(updatedExpense)
      vi.mocked(expensesApi.getPlanExpenseSummary).mockResolvedValue(mockExpenseSummary)

      expensesStore.expenses = [...mockExpenses]
      expensesStore.currentPlanId = 'plan-1'

      const result = await expensesStore.editExpense('expense-1', updates)

      expect(expensesApi.updateExpense).toHaveBeenCalledWith('expense-1', updates)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedExpense)
      expect(expensesStore.expenses[0]?.amount).toBe(150)
    })

    it('should return failure if userId is null', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      expensesStore = useExpensesStore()

      const result = await expensesStore.editExpense('expense-1', { amount: 150 })

      expect(result.success).toBe(false)
      expect(expensesApi.updateExpense).not.toHaveBeenCalled()
    })

    it('should handle errors when updating expense', async () => {
      const error = new Error('Failed to update')
      vi.mocked(expensesApi.updateExpense).mockRejectedValue(error)

      const result = await expensesStore.editExpense('expense-1', { amount: 150 })

      expect(mockHandleError).toHaveBeenCalledWith('EXPENSES.UPDATE_FAILED', error, {
        expenseId: 'expense-1',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('removeExpense', () => {
    it('should delete expense successfully', async () => {
      vi.mocked(expensesApi.deleteExpense).mockResolvedValue()
      vi.mocked(expensesApi.getPlanExpenseSummary).mockResolvedValue(mockExpenseSummary)

      expensesStore.expenses = [...mockExpenses]
      expensesStore.currentPlanId = 'plan-1'

      const result = await expensesStore.removeExpense('expense-1')

      expect(expensesApi.deleteExpense).toHaveBeenCalledWith('expense-1')
      expect(result.success).toBe(true)
      expect(expensesStore.expenses).not.toContainEqual(
        expect.objectContaining({ id: 'expense-1' }),
      )
    })

    it('should update plan item completion when last expense is deleted', async () => {
      const expenseWithItem = { ...mockExpenses[0]!, plan_item_id: 'item-1' }
      vi.mocked(expensesApi.deleteExpense).mockResolvedValue()
      vi.mocked(plansApi.updatePlanItemCompletion).mockResolvedValue()
      vi.mocked(expensesApi.getPlanExpenseSummary).mockResolvedValue(mockExpenseSummary)

      expensesStore.expenses = [expenseWithItem]
      expensesStore.currentPlanId = 'plan-1'

      await expensesStore.removeExpense('expense-1')

      expect(plansApi.updatePlanItemCompletion).toHaveBeenCalledWith('item-1', false)
    })

    it('should not update plan item if other expenses remain', async () => {
      const expenseWithItem1 = { ...mockExpenses[0]!, id: 'expense-1', plan_item_id: 'item-1' }
      const expenseWithItem2 = { ...mockExpenses[1]!, id: 'expense-2', plan_item_id: 'item-1' }
      vi.mocked(expensesApi.deleteExpense).mockResolvedValue()
      vi.mocked(expensesApi.getPlanExpenseSummary).mockResolvedValue(mockExpenseSummary)

      expensesStore.expenses = [expenseWithItem1, expenseWithItem2]
      expensesStore.currentPlanId = 'plan-1'

      await expensesStore.removeExpense('expense-1')

      expect(plansApi.updatePlanItemCompletion).not.toHaveBeenCalled()
    })

    it('should return failure if userId is null', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      expensesStore = useExpensesStore()

      const result = await expensesStore.removeExpense('expense-1')

      expect(result.success).toBe(false)
      expect(expensesApi.deleteExpense).not.toHaveBeenCalled()
    })

    it('should handle errors when deleting expense', async () => {
      const error = new Error('Failed to delete')
      vi.mocked(expensesApi.deleteExpense).mockRejectedValue(error)

      expensesStore.expenses = [...mockExpenses]
      const result = await expensesStore.removeExpense('expense-1')

      expect(mockHandleError).toHaveBeenCalledWith('EXPENSES.DELETE_FAILED', error, {
        expenseId: 'expense-1',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('loadExpensesByDateRange', () => {
    it('should load expenses by date range successfully', async () => {
      vi.mocked(expensesApi.getExpensesByDateRange).mockResolvedValue(mockExpenses)

      const result = await expensesStore.loadExpensesByDateRange(
        'plan-1',
        '2024-01-01',
        '2024-01-31',
      )

      expect(expensesApi.getExpensesByDateRange).toHaveBeenCalledWith(
        'plan-1',
        '2024-01-01',
        '2024-01-31',
      )
      expect(result).toEqual(mockExpenses)
    })

    it('should not load if userId is null', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      expensesStore = useExpensesStore()

      await expensesStore.loadExpensesByDateRange('plan-1', '2024-01-01', '2024-01-31')

      expect(expensesApi.getExpensesByDateRange).not.toHaveBeenCalled()
    })

    it('should handle errors', async () => {
      const error = new Error('Failed to load')
      vi.mocked(expensesApi.getExpensesByDateRange).mockRejectedValue(error)

      await expensesStore.loadExpensesByDateRange('plan-1', '2024-01-01', '2024-01-31')

      expect(mockHandleError).toHaveBeenCalledWith('EXPENSES.LOAD_DATE_RANGE_FAILED', error, {
        planId: 'plan-1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })
    })
  })

  describe('loadExpensesByCategory', () => {
    it('should load expenses by category successfully', async () => {
      vi.mocked(expensesApi.getExpensesByCategory).mockResolvedValue(mockExpenses)

      const result = await expensesStore.loadExpensesByCategory('plan-1', 'cat-1')

      expect(expensesApi.getExpensesByCategory).toHaveBeenCalledWith('plan-1', 'cat-1')
      expect(result).toEqual(mockExpenses)
    })

    it('should not load if userId is null', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      expensesStore = useExpensesStore()

      await expensesStore.loadExpensesByCategory('plan-1', 'cat-1')

      expect(expensesApi.getExpensesByCategory).not.toHaveBeenCalled()
    })

    it('should handle errors', async () => {
      const error = new Error('Failed to load')
      vi.mocked(expensesApi.getExpensesByCategory).mockRejectedValue(error)

      await expensesStore.loadExpensesByCategory('plan-1', 'cat-1')

      expect(mockHandleError).toHaveBeenCalledWith('EXPENSES.LOAD_CATEGORY_FAILED', error, {
        planId: 'plan-1',
        categoryId: 'cat-1',
      })
    })
  })

  describe('getExpensesForPlanItem', () => {
    it('should filter expenses by plan item id', () => {
      const expensesWithItems = [
        { ...mockExpenses[0]!, plan_item_id: 'item-1' },
        { ...mockExpenses[1]!, plan_item_id: 'item-2' },
        { ...mockExpenses[2]!, plan_item_id: 'item-1' },
      ]
      expensesStore.expenses = expensesWithItems

      const result = expensesStore.getExpensesForPlanItem('item-1')

      expect(result).toHaveLength(2)
      expect(result.every((exp) => exp.plan_item_id === 'item-1')).toBe(true)
    })
  })

  describe('getPlanItemTrackingData', () => {
    it('should get plan items successfully', async () => {
      vi.mocked(plansApi.getPlanItems).mockResolvedValue(mockPlanItems)

      const result = await expensesStore.getPlanItemTrackingData('plan-1')

      expect(plansApi.getPlanItems).toHaveBeenCalledWith('plan-1')
      expect(result).toEqual(mockPlanItems)
    })

    it('should handle errors and return empty array', async () => {
      const error = new Error('Failed to load')
      vi.mocked(plansApi.getPlanItems).mockRejectedValue(error)

      const result = await expensesStore.getPlanItemTrackingData('plan-1')

      expect(mockHandleError).toHaveBeenCalledWith('EXPENSES.LOAD_PLAN_ITEMS_FAILED', error, {
        planId: 'plan-1',
      })
      expect(result).toEqual([])
    })
  })

  describe('getItemCompletionStatus', () => {
    it('should return completed status for completed item', () => {
      const completedItem = { ...mockPlanItems[0]!, is_completed: true, amount: 100 }

      const result = expensesStore.getItemCompletionStatus(completedItem)

      expect(result.isCompleted).toBe(true)
      expect(result.remainingAmount).toBe(0)
      expect(result.progress).toBe(1)
    })

    it('should return incomplete status for incomplete item', () => {
      const incompleteItem = { ...mockPlanItems[0]!, is_completed: false, amount: 100 }

      const result = expensesStore.getItemCompletionStatus(incompleteItem)

      expect(result.isCompleted).toBe(false)
      expect(result.remainingAmount).toBe(100)
      expect(result.progress).toBe(0)
    })
  })

  describe('reset', () => {
    it('should reset store to initial state', () => {
      expensesStore.expenses = mockExpenses
      expensesStore.expenseSummary = mockExpenseSummary
      expensesStore.currentPlanId = 'plan-1'
      expensesStore.isLoading = true

      expensesStore.reset()

      expect(expensesStore.expenses).toEqual([])
      expect(expensesStore.expenseSummary).toEqual([])
      expect(expensesStore.currentPlanId).toBeNull()
      expect(expensesStore.isLoading).toBe(false)
    })
  })
})
