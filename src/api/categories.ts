import { supabase } from 'src/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from 'src/lib/supabase/types'

export type ExpenseCategory = Tables<'expense_categories'>
export type ExpenseCategoryInsert = TablesInsert<'expense_categories'>
export type ExpenseCategoryUpdate = TablesUpdate<'expense_categories'>

export async function getExpenseCategories(userId: string): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .or(`owner_id.eq.${userId},is_system.eq.true`)
    .order('is_system', { ascending: false })
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function createExpenseCategory(
  category: ExpenseCategoryInsert,
): Promise<ExpenseCategory> {
  const { data, error } = await supabase
    .from('expense_categories')
    .insert(category)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateExpenseCategory(
  id: string,
  updates: ExpenseCategoryUpdate,
): Promise<ExpenseCategory> {
  const { data, error } = await supabase
    .from('expense_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  const { error } = await supabase.from('expense_categories').delete().eq('id', id)

  if (error) throw error
}
