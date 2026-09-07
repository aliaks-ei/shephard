import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useExpenseActions } from './useExpenseActions'
import type { ExpenseWithCategory } from 'src/api'

const mockMutateAsync = vi.fn()

vi.mock('src/queries/expenses', () => ({
  useDeleteExpenseMutation: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: ref(false),
  })),
}))

const mockExpense: ExpenseWithCategory = {
  id: 'expense-1',
  plan_id: 'plan-1',
  category_id: 'cat-1',
  name: 'Groceries',
  amount: 100,
  expense_date: '2024-01-15',
  user_id: 'user-1',
  plan_item_id: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  currency: 'USD',
  original_amount: null,
  original_currency: null,
  categories: {
    id: 'cat-1',
    name: 'Food',
    color: '#FF5733',
    icon: 'eva-shopping-bag-outline',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockMutateAsync.mockResolvedValue(undefined)
  // Reset the module-level singleton state between tests.
  useExpenseActions().cancelPendingDelete()
})

describe('useExpenseActions', () => {
  describe('confirmDeleteExpense', () => {
    it('stores the expense as pending without deleting it', () => {
      const { confirmDeleteExpense, pendingDeleteExpense, isDeletingExpense } = useExpenseActions()

      confirmDeleteExpense(mockExpense)

      expect(pendingDeleteExpense.value).toStrictEqual(mockExpense)
      expect(isDeletingExpense.value).toBe(false)
      expect(mockMutateAsync).not.toHaveBeenCalled()
    })

    it('shares pending state across composable instances', () => {
      const first = useExpenseActions()
      const second = useExpenseActions()

      first.confirmDeleteExpense(mockExpense)

      expect(second.pendingDeleteExpense.value).toStrictEqual(mockExpense)
    })
  })

  describe('confirmPendingDelete', () => {
    it('deletes the pending expense, runs onSuccess, and clears state', async () => {
      const onSuccess = vi.fn()
      const {
        confirmDeleteExpense,
        confirmPendingDelete,
        pendingDeleteExpense,
        isDeletingExpense,
      } = useExpenseActions()

      confirmDeleteExpense(mockExpense, onSuccess)
      await confirmPendingDelete()

      expect(mockMutateAsync).toHaveBeenCalledWith({
        expenseId: 'expense-1',
        planId: 'plan-1',
      })
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(pendingDeleteExpense.value).toBeNull()
      expect(isDeletingExpense.value).toBe(false)
    })

    it('sets isDeletingExpense while the mutation is in flight', async () => {
      let resolveMutation: () => void = () => {}
      mockMutateAsync.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveMutation = resolve
          }),
      )
      const { confirmDeleteExpense, confirmPendingDelete, isDeletingExpense } = useExpenseActions()

      confirmDeleteExpense(mockExpense)
      const pending = confirmPendingDelete()

      expect(isDeletingExpense.value).toBe(true)

      resolveMutation()
      await pending

      expect(isDeletingExpense.value).toBe(false)
    })

    it('does nothing when there is no pending expense', async () => {
      const { confirmPendingDelete } = useExpenseActions()

      await confirmPendingDelete()

      expect(mockMutateAsync).not.toHaveBeenCalled()
    })

    it('clears state without calling onSuccess when the mutation fails', async () => {
      mockMutateAsync.mockRejectedValue(new Error('boom'))
      const onSuccess = vi.fn()
      const {
        confirmDeleteExpense,
        confirmPendingDelete,
        pendingDeleteExpense,
        isDeletingExpense,
      } = useExpenseActions()

      confirmDeleteExpense(mockExpense, onSuccess)
      await expect(confirmPendingDelete()).resolves.toBeUndefined()

      expect(onSuccess).not.toHaveBeenCalled()
      expect(pendingDeleteExpense.value).toBeNull()
      expect(isDeletingExpense.value).toBe(false)
    })
  })

  describe('cancelPendingDelete', () => {
    it('clears the pending expense without deleting', () => {
      const { confirmDeleteExpense, cancelPendingDelete, pendingDeleteExpense } =
        useExpenseActions()

      confirmDeleteExpense(mockExpense)
      cancelPendingDelete()

      expect(pendingDeleteExpense.value).toBeNull()
      expect(mockMutateAsync).not.toHaveBeenCalled()
    })
  })

  describe('deleteExpense', () => {
    it('deletes immediately and calls onSuccess', async () => {
      const onSuccess = vi.fn()
      const { deleteExpense, pendingDeleteExpense } = useExpenseActions()

      await deleteExpense(mockExpense, onSuccess)

      expect(mockMutateAsync).toHaveBeenCalledWith({
        expenseId: 'expense-1',
        planId: 'plan-1',
      })
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(pendingDeleteExpense.value).toBeNull()
    })
  })
})
