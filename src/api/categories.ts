import { supabase } from 'src/lib/supabase/client'
import type { Tables } from 'src/lib/supabase/types'

export type ExpenseCategory = Tables<'expense_categories'>

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}
