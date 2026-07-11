import type { Tables, TablesInsert, TablesUpdate } from 'src/lib/supabase/types'
import { BaseAPIService } from './base'

export type Expense = Tables<'expenses'>
export type ExpenseInsert = TablesInsert<'expenses'>
export type ExpenseUpdate = TablesUpdate<'expenses'>
export type ExpenseWithCategory = Expense & {
  categories: Tables<'categories'>
}

export type ExpenseWithCategoryAndPlan = ExpenseWithCategory & {
  plans: Pick<Tables<'plans'>, 'id' | 'name' | 'currency'> | null
}

export type PlanExpenseSummary = {
  category_id: string
  planned_amount: number
  actual_amount: number
  remaining_amount: number
  expense_count: number
}

export type PlanOverviewSnapshotRow = PlanExpenseSummary & {
  plan_id: string
  category_name: string
  category_color: string
  category_icon: string
}

export type ExpenseSort = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

export type ExpensePageOptions = {
  offset: number
  limit: number
}

export type RecentExpensePageOptions = ExpensePageOptions & {
  search?: string
  categoryId?: string | null
  sortBy?: ExpenseSort
}

const MAX_EXPENSE_PAGE_SIZE = 100

const expenseService = new BaseAPIService<'expenses', Expense, ExpenseInsert, ExpenseUpdate>({
  tableName: 'expenses',
  uniqueConstraintName: '',
  entityTypeName: 'EXPENSE',
})

const EXPENSE_WITH_CATEGORY_SELECT = '*, categories(*)'

function normalizeExpensePage(options: ExpensePageOptions): ExpensePageOptions {
  return {
    offset: Math.max(0, Math.trunc(options.offset)),
    limit: Math.max(1, Math.min(Math.trunc(options.limit), MAX_EXPENSE_PAGE_SIZE)),
  }
}

export async function getAllExpensesByPlanForExport(
  planId: string,
): Promise<ExpenseWithCategory[]> {
  const { data, error } = await expenseService.supabase
    .from('expenses')
    .select(EXPENSE_WITH_CATEGORY_SELECT)
    .eq('plan_id', planId)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getRecentExpensesForPlan(
  planId: string,
  limit = 10,
): Promise<ExpenseWithCategory[]> {
  const page = normalizeExpensePage({ offset: 0, limit })
  const { data, error } = await expenseService.supabase
    .from('expenses')
    .select(EXPENSE_WITH_CATEGORY_SELECT)
    .eq('plan_id', planId)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(page.limit)

  if (error) throw error
  return data || []
}

export async function getExpensesByPlanPage(
  planId: string,
  options: ExpensePageOptions,
): Promise<ExpenseWithCategory[]> {
  const page = normalizeExpensePage(options)
  const { data, error } = await expenseService.supabase
    .from('expenses')
    .select(EXPENSE_WITH_CATEGORY_SELECT)
    .eq('plan_id', planId)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(page.offset, page.offset + page.limit - 1)

  if (error) throw error
  return data || []
}

export async function getExpensesByCategoryPage(
  planId: string,
  categoryId: string,
  options: ExpensePageOptions,
): Promise<ExpenseWithCategory[]> {
  const page = normalizeExpensePage(options)
  const { data, error } = await expenseService.supabase
    .from('expenses')
    .select(EXPENSE_WITH_CATEGORY_SELECT)
    .eq('plan_id', planId)
    .eq('category_id', categoryId)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(page.offset, page.offset + page.limit - 1)

  if (error) throw error
  return data || []
}

export async function getRecentExpensesPageForUser(
  userId: string,
  options: RecentExpensePageOptions,
): Promise<ExpenseWithCategoryAndPlan[]> {
  const page = normalizeExpensePage(options)
  const sortBy = options.sortBy ?? 'date-desc'
  const { data, error } = await expenseService.supabase.rpc('get_recent_expenses_page', {
    p_user_id: userId,
    p_limit: page.limit,
    p_offset: page.offset,
    p_search: options.search?.trim() || null,
    p_category_id: options.categoryId || null,
    p_sort_by: sortBy,
  })

  if (error) throw error
  return (data || []) as unknown as ExpenseWithCategoryAndPlan[]
}

export async function getExpenseIdsForPlanItem(
  planId: string,
  planItemId: string,
): Promise<string[]> {
  const { data, error } = await expenseService.supabase
    .from('expenses')
    .select('id')
    .eq('plan_id', planId)
    .eq('plan_item_id', planItemId)

  if (error) throw error
  return (data || []).map((expense) => expense.id)
}

export async function getLastExpenseForPlan(planId: string): Promise<Expense | null> {
  const { data, error } = await expenseService.supabase
    .from('expenses')
    .select('*')
    .eq('plan_id', planId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createExpense(expense: ExpenseInsert): Promise<Expense> {
  const createdExpense = await expenseService.create(expense)

  if (expense.plan_id) {
    await expenseService.supabase
      .from('plans')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', expense.plan_id)
  }

  return createdExpense
}

export async function createExpenses(expenses: ExpenseInsert[]): Promise<Expense[]> {
  if (expenses.length === 0) {
    return []
  }

  const { data, error } = await expenseService.supabase.from('expenses').insert(expenses).select()
  if (error) throw error

  const planIds = Array.from(
    new Set(
      expenses
        .map((expense) => expense.plan_id)
        .filter((planId): planId is string => typeof planId === 'string'),
    ),
  )

  if (planIds.length > 0) {
    await expenseService.supabase
      .from('plans')
      .update({ updated_at: new Date().toISOString() })
      .in('id', planIds)
  }

  return data || []
}

export async function updateExpense(id: string, updates: ExpenseUpdate): Promise<Expense> {
  return expenseService.update(id, updates)
}

export async function deleteExpensesAndReconcile(ids: string[]): Promise<number> {
  if (ids.length === 0) {
    return 0
  }

  const { data, error } = await expenseService.supabase.rpc('delete_expenses_and_reconcile', {
    p_expense_ids: ids,
  })

  if (error) throw error
  return data
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteExpensesAndReconcile([id])
}

export async function deleteExpenses(ids: string[]): Promise<void> {
  await deleteExpensesAndReconcile(ids)
}

export async function getPlanExpenseSummary(planId: string): Promise<PlanExpenseSummary[]> {
  const { data, error } = await expenseService.supabase.rpc('get_plan_expense_summary', {
    p_plan_id: planId,
  })

  if (error) throw error
  return data || []
}

export async function getPlanOverviewSnapshots(
  planIds: string[],
): Promise<PlanOverviewSnapshotRow[]> {
  if (planIds.length === 0) return []

  const { data, error } = await expenseService.supabase.rpc('get_plan_overview_snapshots', {
    p_plan_ids: planIds,
  })

  if (error) throw error
  return data || []
}

export async function getExpensesByDateRange(
  planId: string,
  startDate: string,
  endDate: string,
): Promise<ExpenseWithCategory[]> {
  const { data, error } = await expenseService.supabase
    .from('expenses')
    .select(EXPENSE_WITH_CATEGORY_SELECT)
    .eq('plan_id', planId)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate)
    .order('expense_date', { ascending: false })

  if (error) throw error
  return data || []
}
