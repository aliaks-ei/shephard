import { supabase } from 'src/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from 'src/lib/supabase/types'
import type { PostgrestError } from '@supabase/supabase-js'

export type ExpenseCategory = Tables<'expense_categories'>
export type ExpenseCategoryInsert = TablesInsert<'expense_categories'>
export type ExpenseCategoryUpdate = TablesUpdate<'expense_categories'>

const isDuplicateNameError = (error: PostgrestError) => {
  return (
    (error.code === '23505' && error.message?.includes('unique_expense_category_name_per_user')) ||
    (error.message && error.message.includes('unique_expense_category_name_per_user')) ||
    (error.message && error.message.includes('duplicate key value violates unique constraint')) ||
    (error.details && error.details.includes('unique_expense_category_name_per_user'))
  )
}

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
  const { data, error } = await supabase
    .from('expense_categories')
    .insert(category)
    .select()
    .single()

  if (error) {
    if (isDuplicateNameError(error)) {
      const duplicateError = new Error('DUPLICATE_CATEGORY_NAME')
      duplicateError.name = 'DUPLICATE_CATEGORY_NAME'
      throw duplicateError
    }

    throw error
  }

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

  if (error) {
    if (isDuplicateNameError(error)) {
      const duplicateError = new Error('DUPLICATE_CATEGORY_NAME')
      duplicateError.name = 'DUPLICATE_CATEGORY_NAME'
      throw duplicateError
    }

    throw error
  }

  return data
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  const { error } = await supabase.from('expense_categories').delete().eq('id', id)

  if (error) throw error
}
