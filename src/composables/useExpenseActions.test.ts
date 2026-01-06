import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { useExpenseActions } from './useExpenseActions'
import { useExpensesStore } from 'src/stores/expenses'
import type { ExpenseWithCategory } from 'src/api'

vi.mock('quasar', () => ({
  Dialog: {
    create: vi.fn(),
  },
  Dark: {
    set: vi.fn(),
  },
}))

let pinia: TestingPinia

beforeEach(() => {
  pinia = createTestingPinia({ createSpy: vi.fn })
  setActivePinia(pinia)
  vi.clearAllMocks()
})

describe('useExpenseActions', () => {
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
    currency: null,
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

  describe('confirmDeleteExpense', () => {
    it('shows confirmation dialog with correct content', async () => {
      const { Dialog } = await import('quasar')
      const mockCreate = vi.mocked(Dialog.create)
      mockCreate.mockReturnValue({
        onOk: vi.fn().mockReturnThis(),
        onCancel: vi.fn().mockReturnThis(),
        onDismiss: vi.fn().mockReturnThis(),
      } as unknown as ReturnType<typeof Dialog.create>)

      const { confirmDeleteExpense } = useExpenseActions()

      confirmDeleteExpense(mockExpense)

      expect(mockCreate).toHaveBeenCalledWith({
        title: 'Delete Expense?',
        message: 'Are you sure you want to delete "Groceries"?',
        persistent: true,
        ok: {
          label: 'Delete',
          color: 'negative',
          unelevated: true,
        },
        cancel: {
          label: 'Cancel',
          flat: true,
          color: 'text-white',
        },
      })
    })

    it('deletes expense when confirmed', async () => {
      const { Dialog } = await import('quasar')
      const expensesStore = useExpensesStore()

      expensesStore.removeExpense = vi.fn().mockResolvedValue(undefined)

      let onOkCallback: (() => void) | undefined
      const mockCreate = vi.mocked(Dialog.create)
      mockCreate.mockReturnValue({
        onOk: vi.fn((callback) => {
          onOkCallback = callback
          return {
            onCancel: vi.fn().mockReturnThis(),
            onDismiss: vi.fn().mockReturnThis(),
          }
        }),
        onCancel: vi.fn().mockReturnThis(),
        onDismiss: vi.fn().mockReturnThis(),
      } as unknown as ReturnType<typeof Dialog.create>)

      const { confirmDeleteExpense } = useExpenseActions()

      confirmDeleteExpense(mockExpense)

      expect(onOkCallback).toBeDefined()
      if (onOkCallback) {
        onOkCallback()
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(expensesStore.removeExpense).toHaveBeenCalledWith('expense-1')
      }
    })

    it('calls onSuccess callback after deletion', async () => {
      const { Dialog } = await import('quasar')
      const expensesStore = useExpensesStore()
      const onSuccess = vi.fn()

      expensesStore.removeExpense = vi.fn().mockResolvedValue(undefined)

      let onOkCallback: (() => void) | undefined
      const mockCreate = vi.mocked(Dialog.create)
      mockCreate.mockReturnValue({
        onOk: vi.fn((callback) => {
          onOkCallback = callback
          return {
            onCancel: vi.fn().mockReturnThis(),
            onDismiss: vi.fn().mockReturnThis(),
          }
        }),
        onCancel: vi.fn().mockReturnThis(),
        onDismiss: vi.fn().mockReturnThis(),
      } as unknown as ReturnType<typeof Dialog.create>)

      const { confirmDeleteExpense } = useExpenseActions()

      confirmDeleteExpense(mockExpense, onSuccess)

      expect(onOkCallback).toBeDefined()
      if (onOkCallback) {
        onOkCallback()
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(onSuccess).toHaveBeenCalled()
      }
    })

    it('does not call onSuccess if not provided', async () => {
      const { Dialog } = await import('quasar')
      const expensesStore = useExpensesStore()

      expensesStore.removeExpense = vi.fn().mockResolvedValue(undefined)

      let onOkCallback: (() => void) | undefined
      const mockCreate = vi.mocked(Dialog.create)
      mockCreate.mockReturnValue({
        onOk: vi.fn((callback) => {
          onOkCallback = callback
          return {
            onCancel: vi.fn().mockReturnThis(),
            onDismiss: vi.fn().mockReturnThis(),
          }
        }),
        onCancel: vi.fn().mockReturnThis(),
        onDismiss: vi.fn().mockReturnThis(),
      } as unknown as ReturnType<typeof Dialog.create>)

      const { confirmDeleteExpense } = useExpenseActions()

      confirmDeleteExpense(mockExpense)

      expect(onOkCallback).toBeDefined()
      if (onOkCallback) {
        onOkCallback()
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    })
  })
})
