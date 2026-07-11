import { vi, beforeEach, it, expect, describe } from 'vitest'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from 'src/lib/supabase/client'
import {
  getAllExpensesByPlanForExport,
  getExpensesByPlanPage,
  getExpensesByCategoryPage,
  getRecentExpensesForPlan,
  getRecentExpensesPageForUser,
  getExpenseIdsForPlanItem,
  getPlanOverviewSnapshots,
  getLastExpenseForPlan,
  createExpense,
  updateExpense,
  deleteExpense,
  deleteExpenses,
  getPlanExpenseSummary,
  getExpensesByDateRange,
  type Expense,
  type ExpenseWithCategory,
  type ExpenseInsert,
  type PlanExpenseSummary,
} from './expenses'

const createPostgrestError = (message: string, code = '23505'): PostgrestError =>
  ({
    message,
    details: '',
    hint: '',
    code,
  }) as PostgrestError

const mockExpense: Expense = {
  id: 'expense-1',
  plan_id: 'plan-1',
  category_id: 'category-1',
  user_id: 'user-1',
  amount: 50.0,
  name: 'Groceries shopping',
  expense_date: '2023-01-15',
  created_at: '2023-01-15T12:00:00Z',
  updated_at: '2023-01-15T12:00:00Z',
  plan_item_id: null,
  currency: null,
  original_amount: null,
  original_currency: null,
}

const mockExpenseWithCategory: ExpenseWithCategory = {
  ...mockExpense,
  categories: {
    id: 'category-1',
    name: 'Groceries',
    color: '#22c55e',
    icon: 'eva-shopping-cart-outline',
    created_at: '2023-01-01T12:00:00Z',
    updated_at: '2023-01-01T12:00:00Z',
  },
}

vi.mock('src/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
    rpc: vi.fn(),
  },
}))

const mockSupabase = vi.mocked(supabase, true)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getAllExpensesByPlanForExport', () => {
  it('should return expenses with categories for a plan', async () => {
    const expenses = [mockExpenseWithCategory]

    const mockOrder2 = vi.fn().mockResolvedValue({
      data: expenses,
      error: null,
    })
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getAllExpensesByPlanForExport('plan-1')

    expect(mockFrom).toHaveBeenCalledWith('expenses')
    expect(mockSelect).toHaveBeenCalledWith('*, categories(*)')
    expect(mockEq).toHaveBeenCalledWith('plan_id', 'plan-1')
    expect(mockOrder1).toHaveBeenCalledWith('expense_date', { ascending: false })
    expect(mockOrder2).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual(expenses)
  })

  it('should return empty array when no expenses found', async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    })
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getAllExpensesByPlanForExport('plan-1')

    expect(result).toEqual([])
  })

  it('should throw error when query fails', async () => {
    const mockError = createPostgrestError('Failed to fetch expenses')
    const mockOrder2 = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(getAllExpensesByPlanForExport('plan-1')).rejects.toThrow(
      'Failed to fetch expenses',
    )
  })
})

describe('bounded expense reads', () => {
  it('ranges plan history instead of downloading the full plan', async () => {
    const range = vi.fn().mockResolvedValue({
      data: [mockExpenseWithCategory],
      error: null,
    })
    const order3 = vi.fn().mockReturnValue({ range })
    const order2 = vi.fn().mockReturnValue({ order: order3 })
    const order1 = vi.fn().mockReturnValue({ order: order2 })
    const eq = vi.fn().mockReturnValue({ order: order1 })
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq }),
    } as never)

    const result = await getExpensesByPlanPage('plan-1', { offset: 40, limit: 40 })

    expect(range).toHaveBeenCalledWith(40, 79)
    expect(result).toEqual([mockExpenseWithCategory])
  })

  it('loads dashboard plan aggregates through one RPC', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [],
      error: null,
    } as never)

    await getPlanOverviewSnapshots(['plan-1', 'plan-2'])

    expect(mockSupabase.rpc.mock.calls).toContainEqual([
      'get_plan_overview_snapshots',
      {
        p_plan_ids: ['plan-1', 'plan-2'],
      },
    ])
  })

  it('limits recent plan history explicitly', async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [mockExpenseWithCategory],
      error: null,
    })
    const order3 = vi.fn().mockReturnValue({ limit })
    const order2 = vi.fn().mockReturnValue({ order: order3 })
    const order1 = vi.fn().mockReturnValue({ order: order2 })
    const eq = vi.fn().mockReturnValue({ order: order1 })
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq }),
    } as never)

    await getRecentExpensesForPlan('plan-1', 10)

    expect(limit).toHaveBeenCalledWith(10)
  })

  it('ranges category history and caps oversized pages', async () => {
    const range = vi.fn().mockResolvedValue({
      data: [mockExpenseWithCategory],
      error: null,
    })
    const order3 = vi.fn().mockReturnValue({ range })
    const order2 = vi.fn().mockReturnValue({ order: order3 })
    const order1 = vi.fn().mockReturnValue({ order: order2 })
    const categoryEq = vi.fn().mockReturnValue({ order: order1 })
    const planEq = vi.fn().mockReturnValue({ eq: categoryEq })
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: planEq }),
    } as never)

    await getExpensesByCategoryPage('plan-1', 'category-1', {
      offset: 0,
      limit: 1_000,
    })

    expect(range).toHaveBeenCalledWith(0, 99)
  })

  it('passes search and sort through the shared user activity RPC', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [],
      error: null,
    } as never)

    await getRecentExpensesPageForUser('user-1', {
      offset: 40,
      limit: 40,
      search: ' groceries ',
      categoryId: 'category-1',
      sortBy: 'amount-desc',
    })

    expect(mockSupabase.rpc.mock.calls).toContainEqual([
      'get_recent_expenses_page',
      {
        p_user_id: 'user-1',
        p_limit: 40,
        p_offset: 40,
        p_search: 'groceries',
        p_category_id: 'category-1',
        p_sort_by: 'amount-desc',
      },
    ])
  })

  it('selects only IDs for plan-item reconciliation', async () => {
    const itemEq = vi.fn().mockResolvedValue({
      data: [{ id: 'expense-1' }],
      error: null,
    })
    const planEq = vi.fn().mockReturnValue({ eq: itemEq })
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: planEq }),
    } as never)

    const ids = await getExpenseIdsForPlanItem('plan-1', 'item-1')

    expect(ids).toEqual(['expense-1'])
    expect(planEq).toHaveBeenCalledWith('plan_id', 'plan-1')
    expect(itemEq).toHaveBeenCalledWith('plan_item_id', 'item-1')
  })
})

describe('createExpense', () => {
  it('should create a new expense successfully and update plan timestamp', async () => {
    const newExpense: ExpenseInsert = {
      plan_id: 'plan-1',
      category_id: 'category-1',
      user_id: 'user-1',
      amount: 75.5,
      name: 'New expense',
      expense_date: '2023-01-20',
    }

    const mockSingle = vi.fn().mockResolvedValue({
      data: { ...mockExpense, ...newExpense },
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })

    // Mock for updating plan timestamp
    const mockPlanEq = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    })
    const mockPlanUpdate = vi.fn().mockReturnValue({ eq: mockPlanEq })

    // Setup mock to handle both expenses table and plans table
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'expenses') {
        return { insert: mockInsert }
      }
      if (table === 'plans') {
        return { update: mockPlanUpdate }
      }
      return {}
    })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await createExpense(newExpense)

    expect(mockFrom).toHaveBeenCalledWith('expenses')
    expect(mockInsert).toHaveBeenCalledWith(newExpense)
    expect(mockSelect).toHaveBeenCalledWith()
    expect(result).toEqual({ ...mockExpense, ...newExpense })

    // Verify plan timestamp was updated
    expect(mockFrom).toHaveBeenCalledWith('plans')
    expect(mockPlanUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        updated_at: expect.any(String),
      }),
    )
    expect(mockPlanEq).toHaveBeenCalledWith('id', 'plan-1')
  })

  it('should create expense successfully even if plan timestamp update fails', async () => {
    const newExpense: ExpenseInsert = {
      plan_id: 'plan-1',
      category_id: 'category-1',
      user_id: 'user-1',
      amount: 75.5,
      name: 'New expense',
      expense_date: '2023-01-20',
    }

    const mockSingle = vi.fn().mockResolvedValue({
      data: { ...mockExpense, ...newExpense },
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })

    // Mock plan update to fail
    const mockPlanEq = vi.fn().mockResolvedValue({
      data: null,
      error: createPostgrestError('Failed to update plan'),
    })
    const mockPlanUpdate = vi.fn().mockReturnValue({ eq: mockPlanEq })

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'expenses') {
        return { insert: mockInsert }
      }
      if (table === 'plans') {
        return { update: mockPlanUpdate }
      }
      return {}
    })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await createExpense(newExpense)

    expect(result).toEqual({ ...mockExpense, ...newExpense })
    expect(mockPlanUpdate).toHaveBeenCalled()
  })

  it('should throw error when creation fails', async () => {
    const newExpense: ExpenseInsert = {
      plan_id: 'plan-1',
      category_id: 'category-1',
      user_id: 'user-1',
      amount: 75.5,
      name: 'New expense',
      expense_date: '2023-01-20',
    }

    const mockError = createPostgrestError('Failed to create expense')
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(createExpense(newExpense)).rejects.toThrow('Failed to create expense')
  })
})

describe('updateExpense', () => {
  it('should update an expense successfully', async () => {
    const updates = { amount: 100.0, name: 'Updated expense' }

    const mockSingle = vi.fn().mockResolvedValue({
      data: { ...mockExpense, ...updates },
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockMatch = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ match: mockMatch })
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await updateExpense('expense-1', updates)

    expect(mockFrom).toHaveBeenCalledWith('expenses')
    expect(mockUpdate).toHaveBeenCalledWith(updates)
    expect(mockMatch).toHaveBeenCalledWith({ id: 'expense-1' })
    expect(mockSelect).toHaveBeenCalledWith()
    expect(result).toEqual({ ...mockExpense, ...updates })
  })

  it('should throw error when update fails', async () => {
    const updates = { amount: 100.0 }
    const mockError = createPostgrestError('Failed to update expense')

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockMatch = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ match: mockMatch })
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(updateExpense('expense-1', updates)).rejects.toThrow('Failed to update expense')
  })
})

describe('deleteExpense', () => {
  it('deletes an expense and reconciles its plan item atomically', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: 1, error: null })

    await deleteExpense('expense-1')

    expect(mockSupabase.rpc.mock.calls).toContainEqual([
      'delete_expenses_and_reconcile',
      {
        p_expense_ids: ['expense-1'],
      },
    ])
  })

  it('deletes an expense batch in the same reconciliation transaction', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: 2, error: null })

    await deleteExpenses(['expense-1', 'expense-2'])

    expect(mockSupabase.rpc.mock.calls).toContainEqual([
      'delete_expenses_and_reconcile',
      {
        p_expense_ids: ['expense-1', 'expense-2'],
      },
    ])
  })

  it('should throw error when deletion fails', async () => {
    const mockError = createPostgrestError('Failed to delete expense')
    mockSupabase.rpc.mockResolvedValue({ data: null, error: mockError })

    await expect(deleteExpense('expense-1')).rejects.toThrow('Failed to delete expense')
  })
})

describe('getPlanExpenseSummary', () => {
  it('should return expense summary for a plan', async () => {
    const summary: PlanExpenseSummary[] = [
      {
        category_id: 'category-1',
        planned_amount: 500,
        actual_amount: 450,
        remaining_amount: 50,
        expense_count: 5,
      },
    ]

    const rpcSpy = vi.spyOn(mockSupabase, 'rpc')
    rpcSpy.mockResolvedValue({
      data: summary,
      error: null,
    })

    const result = await getPlanExpenseSummary('plan-1')

    expect(rpcSpy).toHaveBeenCalledWith('get_plan_expense_summary', {
      p_plan_id: 'plan-1',
    })
    expect(result).toEqual(summary)
  })

  it('should return empty array when no summary data found', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [],
      error: null,
    })

    const result = await getPlanExpenseSummary('plan-1')

    expect(result).toEqual([])
  })

  it('should throw error when RPC call fails', async () => {
    const mockError = createPostgrestError('Failed to get expense summary')
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: mockError,
    })

    await expect(getPlanExpenseSummary('plan-1')).rejects.toThrow('Failed to get expense summary')
  })
})

describe('getExpensesByDateRange', () => {
  it('should return expenses within date range', async () => {
    const expenses = [mockExpenseWithCategory]

    const mockOrder = vi.fn().mockResolvedValue({
      data: expenses,
      error: null,
    })
    const mockLte = vi.fn().mockReturnValue({ order: mockOrder })
    const mockGte = vi.fn().mockReturnValue({ lte: mockLte })
    const mockEq = vi.fn().mockReturnValue({ gte: mockGte })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getExpensesByDateRange('plan-1', '2023-01-01', '2023-01-31')

    expect(mockFrom).toHaveBeenCalledWith('expenses')
    expect(mockSelect).toHaveBeenCalledWith('*, categories(*)')
    expect(mockEq).toHaveBeenCalledWith('plan_id', 'plan-1')
    expect(mockGte).toHaveBeenCalledWith('expense_date', '2023-01-01')
    expect(mockLte).toHaveBeenCalledWith('expense_date', '2023-01-31')
    expect(mockOrder).toHaveBeenCalledWith('expense_date', { ascending: false })
    expect(result).toEqual(expenses)
  })

  it('should return empty array when no expenses in range', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    })
    const mockLte = vi.fn().mockReturnValue({ order: mockOrder })
    const mockGte = vi.fn().mockReturnValue({ lte: mockLte })
    const mockEq = vi.fn().mockReturnValue({ gte: mockGte })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getExpensesByDateRange('plan-1', '2023-01-01', '2023-01-31')

    expect(result).toEqual([])
  })

  it('should throw error when query fails', async () => {
    const mockError = createPostgrestError('Failed to fetch expenses by date range')
    const mockOrder = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockLte = vi.fn().mockReturnValue({ order: mockOrder })
    const mockGte = vi.fn().mockReturnValue({ lte: mockLte })
    const mockEq = vi.fn().mockReturnValue({ gte: mockGte })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(getExpensesByDateRange('plan-1', '2023-01-01', '2023-01-31')).rejects.toThrow(
      'Failed to fetch expenses by date range',
    )
  })
})

describe('getLastExpenseForPlan', () => {
  it('should return the most recent expense for a plan', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: mockExpense,
      error: null,
    })
    const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getLastExpenseForPlan('plan-1')

    expect(mockFrom).toHaveBeenCalledWith('expenses')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('plan_id', 'plan-1')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(mockLimit).toHaveBeenCalledWith(1)
    expect(mockMaybeSingle).toHaveBeenCalled()
    expect(result).toEqual(mockExpense)
  })

  it('should return null when no expenses found', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    })
    const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    const result = await getLastExpenseForPlan('plan-1')

    expect(result).toBeNull()
  })

  it('should throw error when query fails', async () => {
    const mockError = createPostgrestError('Failed to fetch last expense')
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    })
    const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    mockSupabase.from.mockImplementation(mockFrom)

    await expect(getLastExpenseForPlan('plan-1')).rejects.toThrow('Failed to fetch last expense')
  })
})
