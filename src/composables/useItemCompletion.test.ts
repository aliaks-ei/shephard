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

vi.mock('src/composables/useBanner', () => ({
  useBanner: vi.fn(() => ({
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

  it('updates completion first and then deletes related expenses when unchecking', async () => {
    mockGetExpensesForPlanItem.mockReturnValue([{ id: 'exp-1' }, { id: 'exp-2' }])

    const planId = ref('plan-1')
    const { toggleItemCompletion } = useItemCompletion(planId)

    await toggleItemCompletion({ ...planItem }, false)

    expect(mockCompletionMutateAsync).toHaveBeenCalledWith({
      itemId: 'item-1',
      isCompleted: false,
      planId: 'plan-1',
    })
    expect(mockDeleteExpensesBatchMutateAsync).toHaveBeenCalledTimes(1)
    expect(mockDeleteExpensesBatchMutateAsync).toHaveBeenCalledWith({
      expenseIds: ['exp-1', 'exp-2'],
      planId: 'plan-1',
    })
  })

  it('still marks item incomplete when unchecking item with no linked expenses', async () => {
    mockGetExpensesForPlanItem.mockReturnValue([])

    const { toggleItemCompletion } = useItemCompletion(ref('plan-1'))

    await toggleItemCompletion({ ...planItem }, false)

    expect(mockDeleteExpensesBatchMutateAsync).not.toHaveBeenCalled()
    expect(mockCompletionMutateAsync).toHaveBeenCalledWith({
      itemId: 'item-1',
      isCompleted: false,
      planId: 'plan-1',
    })
  })

  it('creates an expense when checking an incomplete item', async () => {
    const { toggleItemCompletion } = useItemCompletion(ref('plan-1'))

    await toggleItemCompletion({ ...planItem, is_completed: false }, true)

    expect(mockCreateExpenseMutateAsync).toHaveBeenCalledTimes(1)
    expect(mockCompletionMutateAsync).toHaveBeenNthCalledWith(1, {
      itemId: 'item-1',
      isCompleted: true,
      planId: 'plan-1',
    })
  })

  it('rolls completion back if expense creation fails while checking', async () => {
    mockCreateExpenseMutateAsync.mockRejectedValueOnce(new Error('create failed'))

    const { toggleItemCompletion } = useItemCompletion(ref('plan-1'))
    const item = { ...planItem, is_completed: false }

    await toggleItemCompletion(item, true)

    expect(mockCompletionMutateAsync).toHaveBeenNthCalledWith(1, {
      itemId: 'item-1',
      isCompleted: true,
      planId: 'plan-1',
    })
    expect(mockCompletionMutateAsync).toHaveBeenNthCalledWith(2, {
      itemId: 'item-1',
      isCompleted: false,
      planId: 'plan-1',
    })
    expect(item.is_completed).toBe(false)
    expect(mockShowError).toHaveBeenCalledWith(
      'Failed to mark item as completed. Please try again.',
    )
  })

  it('rolls completion back if delete fails while unchecking', async () => {
    mockGetExpensesForPlanItem.mockReturnValue([{ id: 'exp-1' }])
    mockDeleteExpensesBatchMutateAsync.mockRejectedValueOnce(new Error('delete failed'))

    const { toggleItemCompletion } = useItemCompletion(ref('plan-1'))
    const item = { ...planItem, is_completed: true }

    await toggleItemCompletion(item, false)

    expect(mockCompletionMutateAsync).toHaveBeenNthCalledWith(1, {
      itemId: 'item-1',
      isCompleted: false,
      planId: 'plan-1',
    })
    expect(mockCompletionMutateAsync).toHaveBeenNthCalledWith(2, {
      itemId: 'item-1',
      isCompleted: true,
      planId: 'plan-1',
    })
    expect(item.is_completed).toBe(true)
    expect(mockShowError).toHaveBeenCalledWith(
      'Failed to mark item as incomplete. Please try again.',
    )
  })
})
