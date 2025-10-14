import { supabase } from 'src/lib/supabase/client'

export type CategorySuggestion = {
  categoryId: string
  categoryName: string
  confidence: number
  reasoning: string
}

export type PhotoAnalysisResult = {
  expenseName: string
  amount: number
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

export async function analyzeExpensePhoto(
  imageBase64: string,
  planId?: string,
  currency: string = 'EUR',
): Promise<PhotoAnalysisResult> {
  const { data, error } = await supabase.functions.invoke('analyze-expense-photo', {
    body: {
      imageBase64,
      planId,
      currency,
    },
  })

  if (error) {
    throw new Error(`Failed to analyze photo: ${error.message}`)
  }

  if (!data.success) {
    throw new Error(data.error || 'Unknown error occurred')
  }

  return data.data
}
