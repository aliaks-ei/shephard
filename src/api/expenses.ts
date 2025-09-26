import type { Tables, TablesInsert, TablesUpdate } from 'src/lib/supabase/types'
import { BaseAPIService } from './base'

export type Expense = Tables<'expenses'>
export type ExpenseInsert = TablesInsert<'expenses'>
export type ExpenseUpdate = TablesUpdate<'expenses'>
export type ExpenseWithCategory = Expense & {
  categories: Tables<'categories'>
}

export type PlanExpenseSummary = {
  category_id: string
  planned_amount: number
  actual_amount: number
  remaining_amount: number
  expense_count: number
}

const expenseService = new BaseAPIService<'expenses', Expense, ExpenseInsert, ExpenseUpdate>({
  tableName: 'expenses',
  uniqueConstraintName: 'unique_expense_name_per_plan_category',
  entityTypeName: 'EXPENSE',
})

export async function getExpensesByPlan(planId: string): Promise<ExpenseWithCategory[]> {
  const { data, error } = await expenseService.supabase
    .from('expenses')
    .select('*, categories(*)')
    .eq('plan_id', planId)
    .order('expense_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createExpense(expense: ExpenseInsert): Promise<Expense> {
  return expenseService.create(expense)
}

export async function updateExpense(id: string, updates: ExpenseUpdate): Promise<Expense> {
  return expenseService.update(id, updates)
}

export async function deleteExpense(id: string): Promise<void> {
  return expenseService.delete(id)
}

export async function getPlanExpenseSummary(planId: string): Promise<PlanExpenseSummary[]> {
  const { data, error } = await expenseService.supabase.rpc('get_plan_expense_summary', {
    p_plan_id: planId,
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
    .select('*, categories(*)')
    .eq('plan_id', planId)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate)
    .order('expense_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getExpensesByCategory(
  planId: string,
  categoryId: string,
): Promise<ExpenseWithCategory[]> {
  const { data, error } = await expenseService.supabase
    .from('expenses')
    .select('*, categories(*)')
    .eq('plan_id', planId)
    .eq('category_id', categoryId)
    .order('expense_date', { ascending: false })

  if (error) throw error
  return data || []
}
