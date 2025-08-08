import { supabase } from 'src/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from 'src/lib/supabase/types'
import { BaseAPIService } from './base'

export type ExpenseCategory = Tables<'expense_categories'>
export type ExpenseCategoryInsert = TablesInsert<'expense_categories'>
export type ExpenseCategoryUpdate = TablesUpdate<'expense_categories'>

const categoryService = new BaseAPIService<
  'expense_categories',
  ExpenseCategory,
  ExpenseCategoryInsert,
  ExpenseCategoryUpdate
>({
  tableName: 'expense_categories',
  uniqueConstraintName: 'unique_expense_category_name_per_user',
  entityTypeName: 'CATEGORY',
})

export async function getExpenseCategories(userId: string): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('owner_id', userId)
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function createExpenseCategory(
  category: ExpenseCategoryInsert,
): Promise<ExpenseCategory> {
  return categoryService.create(category)
}

export async function updateExpenseCategory(
  id: string,
  updates: ExpenseCategoryUpdate,
): Promise<ExpenseCategory> {
  return categoryService.update(id, updates)
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  return categoryService.delete(id)
}
