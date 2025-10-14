import { supabase } from 'src/lib/supabase/client'

export type CategorySuggestion = {
  categoryId: string
  categoryName: string
  confidence: number
  reasoning: string
}

export async function suggestExpenseCategory(
  expenseName: string,
  planId?: string,
): Promise<CategorySuggestion> {
  const { data, error } = await supabase.functions.invoke('categorize-expense', {
    body: { expenseName, planId },
  })

  if (error) {
    throw new Error(`Failed to categorize expense: ${error.message}`)
  }

  if (!data.success) {
    throw new Error(data.error || 'Unknown error occurred')
  }

  return data.data
}
