import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useItemCompletion } from './useItemCompletion'
import type { PlanItem } from 'src/api/plans'

const mockGetExpensesForPlanItem = vi.fn()
const mockCreateExpenseMutateAsync = vi.fn()
const mockDeleteExpensesBatchMutateAsync = vi.fn()
const mockCompletionMutateAsync = vi.fn()
const mockShowError = vi.fn()

vi.mock('src/queries/expenses', () => ({
  useExpensesByPlanQuery: vi.fn(() => ({
    getExpensesForPlanItem: mockGetExpensesForPlanItem,
  })),
  useCreateExpenseMutation: vi.fn(() => ({
    mutateAsync: mockCreateExpenseMutateAsync,
  })),
  useDeleteExpensesBatchMutation: vi.fn(() => ({
    mutateAsync: mockDeleteExpensesBatchMutateAsync,
  })),
}))

vi.mock('src/queries/plans', () => ({
  useUpdatePlanItemCompletionMutation: vi.fn(() => ({
    mutateAsync: mockCompletionMutateAsync,
  })),
}))

vi.mock('src/stores/notification', () => ({
  useNotificationStore: vi.fn(() => ({
    showError: mockShowError,
  })),
}))

describe('useItemCompletion', () => {
  const planItem: PlanItem = {
    id: 'item-1',
    plan_id: 'plan-1',
    category_id: 'cat-1',
    name: 'Groceries',
    amount: 120,
    is_completed: true,
    is_fixed_payment: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateExpenseMutateAsync.mockResolvedValue(undefined)
    mockDeleteExpensesBatchMutateAsync.mockResolvedValue(undefined)
    mockCompletionMutateAsync.mockResolvedValue(undefined)
  })

  it('deletes all related expenses in a single batch call when unchecking an item', async () => {
    mockGetExpensesForPlanItem.mockReturnValue([{ id: 'exp-1' }, { id: 'exp-2' }])

    const planId = ref('plan-1')
    const { toggleItemCompletion } = useItemCompletion(planId)

    await toggleItemCompletion({ ...planItem }, false)

    expect(mockDeleteExpensesBatchMutateAsync).toHaveBeenCalledTimes(1)
    expect(mockDeleteExpensesBatchMutateAsync).toHaveBeenCalledWith({
      expenseIds: ['exp-1', 'exp-2'],
      planId: 'plan-1',
      planItemId: 'item-1',
      hasRemainingExpensesForItem: false,
    })
    expect(mockCompletionMutateAsync).toHaveBeenCalledWith({
      itemId: 'item-1',
      isCompleted: false,
      planId: 'plan-1',
    })
  })

  it('shows an error and aborts when unchecking item with no linked expenses', async () => {
    mockGetExpensesForPlanItem.mockReturnValue([])

    const { toggleItemCompletion } = useItemCompletion(ref('plan-1'))

    await toggleItemCompletion({ ...planItem }, false)

    expect(mockShowError).toHaveBeenCalledWith('No expenses found to remove for this item')
    expect(mockDeleteExpensesBatchMutateAsync).not.toHaveBeenCalled()
    expect(mockCompletionMutateAsync).not.toHaveBeenCalled()
  })

  it('creates an expense when checking an incomplete item', async () => {
    const { toggleItemCompletion } = useItemCompletion(ref('plan-1'))

    await toggleItemCompletion({ ...planItem, is_completed: false }, true)

    expect(mockCreateExpenseMutateAsync).toHaveBeenCalledTimes(1)
    expect(mockCompletionMutateAsync).toHaveBeenCalledWith({
      itemId: 'item-1',
      isCompleted: true,
      planId: 'plan-1',
    })
  })
})
