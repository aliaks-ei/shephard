import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import OpenAI from 'https://esm.sh/openai@5.12.2'
import { createClient } from '@supabase/supabase-js'
import { z } from 'https://esm.sh/zod@3.24.1'
import {
  createResponseWithRetry,
  isCategory,
  isRecord,
  parseModelJsonObject,
  sortCategoriesDeterministically,
  type Category,
} from '../_shared/ai-utils.ts'
import {
  buildCategorizationInstructions,
  buildCategoryContexts,
  buildJevCriteria,
  decideJevOutcome,
  extractCategorizationContext,
  findCategoryNameMatch,
  findExactCategoryMatch,
  findMemoryCategoryMatch,
  findSemanticCategoryMatch,
  type CategorizeMemory,
  type CategorizePlanItem,
  type CategorizationContext,
} from './helpers.ts'
import { buildCorsHeaders } from '../_shared/notification-utils.ts'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
  maxRetries: 0,
})

const OPENAI_MODEL = 'gpt-5.6-luna'
const OPENAI_TIMEOUT_MS = 2500
const JEV_MODEL = 'jev-1.13.0'
const JEV_TIMEOUT_MS = 1000
const JEV_API_URL = 'https://api.typesafe.ai/v1/systemone'
const MAX_EXPENSE_NAME_LENGTH = 128
const MAX_MEMORY_EXPENSES = 120

const clampUnitInterval = (value: number): number => Math.min(1, Math.max(0, value))

const categorySuggestionSchema = z.object({
  categoryIndex: z.coerce.number().int().min(1),
  confidence: z.coerce.number().finite().transform(clampUnitInterval),
})

const jevResponseSchema = z.object({
  model: z.string(),
  answers: z.object({
    category: z.object({
      choice: z.string(),
      confidence: z.number().finite().transform(clampUnitInterval),
    }),
  }),
})

const requestJevCategory = (
  expenseName: string,
  context: CategorizationContext | null,
  criteria: Record<string, string | null>,
) =>
  createResponseWithRetry({
    maxAttempts: 1,
    timeoutMs: JEV_TIMEOUT_MS,
    operation: async () => {
      const response = await fetch(JEV_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('TYPESAFE_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: JEV_MODEL,
          state: { expense_name: expenseName, ...context },
          questions: {
            category: {
              type: 'choice',
              instructions: 'Which budget category does this expense belong to?',
              criteria,
            },
          },
        }),
      })

      if (!response.ok) {
        throw Object.assign(new Error(`Jev request failed with status ${response.status}`), {
          status: response.status,
        })
      }

      return jevResponseSchema.parse(await response.json())
    },
  })

type CategorizeRequest = {
  deviceContext?: unknown
  expenseName: string
  planId?: string
}

type ExpenseMemoryRow = {
  name: unknown
  category_id: unknown
}

type SuggestionSource =
  | 'plan_item'
  | 'previous_choice'
  | 'category_name'
  | 'semantic_match'
  | 'model'
type UnavailableReason =
  | 'model_timeout'
  | 'model_error'
  | 'invalid_model_response'
  | 'no_matching_category'
type FallbackReason = 'jev_error' | 'jev_timeout' | 'jev_low_confidence'

const isTimeoutError = (error: unknown): boolean =>
  error instanceof Error && error.message.toLowerCase().includes('timed out')

const getModelErrorMetadata = (error: unknown): Record<string, unknown> => {
  const errorRecord = isRecord(error) ? error : {}
  return {
    name: error instanceof Error ? error.name : undefined,
    status: typeof errorRecord.status === 'number' ? errorRecord.status : undefined,
    code: typeof errorRecord.code === 'string' ? errorRecord.code : undefined,
    param: typeof errorRecord.param === 'string' ? errorRecord.param : undefined,
    type: typeof errorRecord.type === 'string' ? errorRecord.type : undefined,
  }
}

Deno.serve(async (req) => {
  const requestStartedAt = performance.now()
  const corsHeaders = buildCorsHeaders(req.headers.get('Origin'))

  const logOutcome = (outcome: 'selected' | 'suggested' | 'unavailable', source?: string) => {
    console.log(
      JSON.stringify({
        event: 'expense_category_detection',
        outcome,
        source,
        totalMs: Math.round(performance.now() - requestStartedAt),
      }),
    )
  }

  const suggestionResponse = (
    outcome: 'selected' | 'suggested',
    suggestion: {
      categoryId: string
      categoryName: string
      confidence: number
      reasoning: string
      source: SuggestionSource
    },
  ) => {
    logOutcome(outcome, suggestion.source)
    return new Response(JSON.stringify({ success: true, outcome, data: suggestion }), {
      headers: corsHeaders,
    })
  }

  const unavailableResponse = (reason: UnavailableReason) => {
    logOutcome('unavailable', reason)
    return new Response(
      JSON.stringify({ success: true, outcome: 'unavailable', reason, data: null }),
      { headers: corsHeaders },
    )
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    )

    const accessToken = authHeader.replace(/^Bearer\s+/i, '')
    const { data: claimsData, error: authError } = await supabaseClient.auth.getClaims(accessToken)
    const userId = typeof claimsData?.claims.sub === 'string' ? claimsData.claims.sub : null

    if (authError || !userId) {
      if (authError) {
        console.error('Auth error in categorize-expense:', authError)
      }
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    let requestBody
    try {
      requestBody = await req.json()
    } catch (parseError) {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const { deviceContext, expenseName, planId } = requestBody as CategorizeRequest

    if (typeof expenseName !== 'string') {
      return new Response(JSON.stringify({ error: 'Expense name is required' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const trimmedExpenseName = expenseName.trim()

    if (trimmedExpenseName.length < 3) {
      return new Response(
        JSON.stringify({
          error: 'Expense name must be at least 3 characters',
        }),
        { status: 400, headers: corsHeaders },
      )
    }

    if (trimmedExpenseName.length > MAX_EXPENSE_NAME_LENGTH) {
      return new Response(
        JSON.stringify({
          error: `Expense name must be at most ${MAX_EXPENSE_NAME_LENGTH} characters`,
        }),
        { status: 400, headers: corsHeaders },
      )
    }

    let categories: Category[] | undefined
    let planItemsForCategorization: CategorizePlanItem[] = []
    let categoriesError: unknown
    const categorizationContext: CategorizationContext | null =
      extractCategorizationContext(deviceContext)
    let categorizationMemories: CategorizeMemory[] = []

    const expenseMemoryPromise = supabaseClient
      .from('expenses')
      .select('name, category_id')
      .eq('user_id', userId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(MAX_MEMORY_EXPENSES)

    if (planId) {
      const [
        { data: planItems, error: itemsError },
        { data: expenseMemoryRows, error: expenseMemoryError },
      ] = await Promise.all([
        supabaseClient
          .from('plan_items')
          .select('name, category_id, categories(id, name)')
          .eq('plan_id', planId),
        expenseMemoryPromise,
      ])

      categoriesError = itemsError
      if (expenseMemoryError) {
        console.error('Failed to fetch categorization memories:', expenseMemoryError)
      }

      if (planItems) {
        const categoryMap = new Map<string, Category>()
        planItems.forEach((item) => {
          const categoryValue = Array.isArray(item.categories)
            ? item.categories[0]
            : item.categories
          if (isCategory(categoryValue) && !categoryMap.has(categoryValue.id)) {
            categoryMap.set(categoryValue.id, categoryValue)
          }

          if (typeof item.name === 'string' && typeof item.category_id === 'string') {
            planItemsForCategorization.push({
              categoryId: item.category_id,
              name: item.name,
            })
          }
        })
        categories = sortCategoriesDeterministically(Array.from(categoryMap.values()))
      }

      categorizationMemories = (expenseMemoryRows ?? [])
        .map((memory): CategorizeMemory | null => {
          const row = memory as ExpenseMemoryRow
          return typeof row.name === 'string' && typeof row.category_id === 'string'
            ? { categoryId: row.category_id, name: row.name }
            : null
        })
        .filter((memory): memory is CategorizeMemory => memory !== null)
    } else {
      const [{ data, error }, { data: expenseMemoryRows, error: expenseMemoryError }] =
        await Promise.all([
          supabaseClient.from('categories').select('id, name').order('name'),
          expenseMemoryPromise,
        ])

      categories = sortCategoriesDeterministically((data ?? []).filter(isCategory))
      categoriesError = error
      if (expenseMemoryError) {
        console.error('Failed to fetch categorization memories:', expenseMemoryError)
      }

      categorizationMemories = (expenseMemoryRows ?? [])
        .map((memory): CategorizeMemory | null => {
          const row = memory as ExpenseMemoryRow
          return typeof row.name === 'string' && typeof row.category_id === 'string'
            ? { categoryId: row.category_id, name: row.name }
            : null
        })
        .filter((memory): memory is CategorizeMemory => memory !== null)
    }

    if (categoriesError) {
      console.error('Failed to fetch categories in categorize-expense:', categoriesError)
      return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), {
        status: 500,
        headers: corsHeaders,
      })
    }

    if (!categories || categories.length === 0) {
      return new Response(
        JSON.stringify({
          error: planId
            ? 'No categories found in this plan. Please add items to the plan first.'
            : 'No categories found. Please create categories first.',
        }),
        { status: 400, headers: corsHeaders },
      )
    }

    const categoryContexts = buildCategoryContexts(
      categories,
      planItemsForCategorization,
      categorizationMemories,
    )
    const exactMatch = findExactCategoryMatch(trimmedExpenseName, categoryContexts)

    if (exactMatch) {
      return suggestionResponse('selected', {
        categoryId: exactMatch.id,
        categoryName: exactMatch.name,
        confidence: 0.98,
        reasoning: 'Matched the expense name to an existing planned item.',
        source: 'plan_item',
      })
    }

    const memoryMatch = findMemoryCategoryMatch(trimmedExpenseName, categoryContexts)

    if (memoryMatch) {
      return suggestionResponse('selected', {
        categoryId: memoryMatch.id,
        categoryName: memoryMatch.name,
        confidence: 0.96,
        reasoning: 'Matched the expense name to a previous user choice.',
        source: 'previous_choice',
      })
    }

    const categoryNameMatch = findCategoryNameMatch(trimmedExpenseName, categoryContexts)

    if (categoryNameMatch) {
      return suggestionResponse('selected', {
        categoryId: categoryNameMatch.id,
        categoryName: categoryNameMatch.name,
        confidence: 0.9,
        reasoning: 'Matched the expense name to a category name.',
        source: 'category_name',
      })
    }

    const semanticMatch = findSemanticCategoryMatch(trimmedExpenseName, categoryContexts)

    if (semanticMatch) {
      return suggestionResponse('selected', {
        categoryId: semanticMatch.id,
        categoryName: semanticMatch.name,
        confidence: 0.88,
        reasoning: 'Matched a common expense type to a category.',
        source: 'semantic_match',
      })
    }

    const { keys: jevOptionKeys, criteria: jevCriteria } = buildJevCriteria(categoryContexts)
    let jevLowConfidenceMatch: { category: Category; confidence: number } | null = null
    let fallbackReason: FallbackReason

    const jevStartedAt = performance.now()
    try {
      const jevResponse = await requestJevCategory(
        trimmedExpenseName,
        categorizationContext,
        jevCriteria,
      )
      const answer = jevResponse.answers.category
      const jevCategory = categoryContexts[jevOptionKeys.indexOf(answer.choice)]

      if (!jevCategory) {
        throw new Error('Jev returned an unknown category option')
      }

      console.log(
        JSON.stringify({
          event: 'expense_category_model_success',
          model: jevResponse.model,
          modelMs: Math.round(performance.now() - jevStartedAt),
          jevConfidence: answer.confidence,
        }),
      )

      const jevOutcome = decideJevOutcome(answer.confidence)

      if (jevOutcome !== 'fallback') {
        return suggestionResponse(jevOutcome, {
          categoryId: jevCategory.id,
          categoryName: jevCategory.name,
          confidence: answer.confidence,
          reasoning:
            jevOutcome === 'selected'
              ? 'Matched by category detection.'
              : 'Not confident enough to select automatically.',
          source: 'model',
        })
      }

      jevLowConfidenceMatch = { category: jevCategory, confidence: answer.confidence }
      fallbackReason = 'jev_low_confidence'
    } catch (jevError) {
      fallbackReason = isTimeoutError(jevError) ? 'jev_timeout' : 'jev_error'
      console.warn('Jev category model failed; trying OpenAI:', {
        fallbackReason,
        ...getModelErrorMetadata(jevError),
      })
    }

    // When OpenAI cannot answer, a low-confidence Jev match is still better than nothing.
    const openAiUnavailableResponse = (reason: UnavailableReason) =>
      jevLowConfidenceMatch
        ? suggestionResponse('suggested', {
            categoryId: jevLowConfidenceMatch.category.id,
            categoryName: jevLowConfidenceMatch.category.name,
            confidence: jevLowConfidenceMatch.confidence,
            reasoning: 'Not confident enough to select automatically.',
            source: 'model',
          })
        : unavailableResponse(reason)

    const instructions = buildCategorizationInstructions(categoryContexts, categorizationContext)

    const categorySuggestionJsonSchema = {
      type: 'object',
      additionalProperties: false,
      required: ['categoryIndex', 'confidence'],
      properties: {
        categoryIndex: {
          type: 'integer',
          minimum: 1,
          maximum: categories.length,
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
        },
      },
    }

    const modelStartedAt = performance.now()
    let response

    try {
      response = await createResponseWithRetry({
        maxAttempts: 1,
        timeoutMs: OPENAI_TIMEOUT_MS,
        operation: () =>
          openai.responses.create({
            model: OPENAI_MODEL,
            instructions,
            input: trimmedExpenseName,
            reasoning: { effort: 'none' },
            max_output_tokens: 64,
            store: false,
            text: {
              format: {
                type: 'json_schema',
                name: 'expense_category_suggestion',
                schema: categorySuggestionJsonSchema,
                strict: true,
              },
              verbosity: 'low',
            },
          }),
      })
    } catch (openAiError) {
      console.error('OpenAI category model failed:', {
        model: OPENAI_MODEL,
        fallbackReason,
        ...getModelErrorMetadata(openAiError),
      })
      return openAiUnavailableResponse(
        isTimeoutError(openAiError) ? 'model_timeout' : 'model_error',
      )
    }

    console.log(
      JSON.stringify({
        event: 'expense_category_model_success',
        model: OPENAI_MODEL,
        serviceTier: response.service_tier,
        modelMs: Math.round(performance.now() - modelStartedAt),
        jevConfidence: jevLowConfidenceMatch?.confidence,
        fallbackReason,
      }),
    )

    const parsedModelOutput = parseModelJsonObject(response.output_text)
    const validatedSuggestion = categorySuggestionSchema.safeParse(parsedModelOutput)

    if (!validatedSuggestion.success) {
      return openAiUnavailableResponse('invalid_model_response')
    }

    const suggestion = validatedSuggestion.data

    const hasValidCategoryIndex =
      suggestion.categoryIndex >= 1 && suggestion.categoryIndex <= categories.length
    const matchedCategory = hasValidCategoryIndex ? categories[suggestion.categoryIndex - 1] : null

    if (!matchedCategory) {
      return openAiUnavailableResponse('no_matching_category')
    }

    const outcome = suggestion.confidence > 0.65 ? 'selected' : 'suggested'
    return suggestionResponse(outcome, {
      categoryId: matchedCategory.id,
      categoryName: matchedCategory.name,
      confidence: suggestion.confidence,
      reasoning:
        outcome === 'selected'
          ? 'Matched by category detection.'
          : 'Not confident enough to select automatically.',
      source: 'model',
    })
  } catch (error) {
    console.error('Error in categorize-expense:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    )
  }
})
