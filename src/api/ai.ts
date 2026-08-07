import { FunctionRegion } from '@supabase/supabase-js'
import { supabase } from 'src/lib/supabase/client'

export type CategorySuggestion = {
  categoryId: string
  categoryName: string
  confidence: number
  reasoning: string
  source?: 'plan_item' | 'previous_choice' | 'category_name' | 'semantic_match' | 'model'
}

export type CategoryDetectionUnavailableReason =
  | 'model_timeout'
  | 'model_error'
  | 'invalid_model_response'
  | 'no_matching_category'

export type CategoryDetectionResult =
  | {
      status: 'selected' | 'suggested'
      suggestion: CategorySuggestion
    }
  | {
      status: 'unavailable'
      suggestion: null
      reason: CategoryDetectionUnavailableReason
    }

export type PhotoAnalysisResult = {
  expenseName: string
  amount: number
  categoryId: string
  categoryName: string
  confidence: number
  reasoning: string
}

export type CategorizationDeviceContext = {
  locale?: string
  timeZone?: string
}

const unavailableReasons = new Set<CategoryDetectionUnavailableReason>([
  'model_timeout',
  'model_error',
  'invalid_model_response',
  'no_matching_category',
])

function getCategorizationDeviceContext(): CategorizationDeviceContext {
  const locale = typeof navigator !== 'undefined' ? navigator.language : undefined
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return {
    ...(locale ? { locale } : {}),
    ...(timeZone ? { timeZone } : {}),
  }
}

export async function suggestExpenseCategory(
  expenseName: string,
  planId?: string,
): Promise<CategoryDetectionResult> {
  const { data, error } = await supabase.functions.invoke('categorize-expense', {
    body: {
      expenseName,
      planId,
      deviceContext: getCategorizationDeviceContext(),
    },
    region: FunctionRegion.EuCentral1,
  })

  if (error) {
    throw new Error(`Failed to categorize expense: ${error.message}`)
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Unknown error occurred')
  }

  if (!data.data) {
    const reason = unavailableReasons.has(data.reason) ? data.reason : 'no_matching_category'
    return {
      status: 'unavailable',
      suggestion: null,
      reason,
    }
  }

  const status =
    data.outcome === 'selected' || data.outcome === 'suggested'
      ? data.outcome
      : data.data.confidence > 0.65
        ? 'selected'
        : 'suggested'

  return {
    status,
    suggestion: data.data,
  }
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
