import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import OpenAI from 'https://esm.sh/openai@5.12.2'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.24.1'
import {
  createResponseWithRetry,
  isCategory,
  parseModelJsonObject,
  sortCategoriesDeterministically,
  type Category,
} from '../_shared/ai-utils.ts'
import {
  buildCategorizationInstructions,
  buildCategoryContexts,
  findExactCategoryMatch,
  type CategorizePlanItem,
} from './helpers.ts'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

const OPENAI_TIMEOUT_MS = 12000

const clampUnitInterval = (value: number): number => Math.min(1, Math.max(0, value))

const categorySuggestionSchema = z.object({
  categoryIndex: z.coerce.number().int().min(1),
  confidence: z.coerce.number().finite().transform(clampUnitInterval),
  reasoning: z.string().trim().min(1).max(200),
})

interface CategorizeRequest {
  expenseName: string
  planId?: string
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
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

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
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

    const { expenseName, planId } = requestBody as CategorizeRequest

    if (!expenseName || expenseName.trim().length < 3) {
      return new Response(
        JSON.stringify({
          error: 'Expense name must be at least 3 characters',
        }),
        { status: 400, headers: corsHeaders },
      )
    }

    let categories: Category[] | undefined
    let planItemsForCategorization: CategorizePlanItem[] = []
    let categoriesError

    if (planId) {
      const { data: planItems, error: itemsError } = await supabaseClient
        .from('plan_items')
        .select('name, category_id, categories(id, name)')
        .eq('plan_id', planId)

      categoriesError = itemsError

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
    } else {
      const { data, error } = await supabaseClient
        .from('categories')
        .select('id, name')
        .order('name')

      categories = sortCategoriesDeterministically((data ?? []).filter(isCategory))
      categoriesError = error
    }

    if (categoriesError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch categories', details: categoriesError.message }),
        { status: 500, headers: corsHeaders },
      )
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

    const categoryContexts = buildCategoryContexts(categories, planItemsForCategorization)
    const exactMatch = findExactCategoryMatch(expenseName, categoryContexts)

    if (exactMatch) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            categoryId: exactMatch.id,
            categoryName: exactMatch.name,
            confidence: 0.98,
            reasoning: 'Matched the expense name to an existing planned item.',
          },
        }),
        { headers: corsHeaders },
      )
    }

    const instructions = buildCategorizationInstructions(categoryContexts, expenseName)

    const categorySuggestionJsonSchema = {
      type: 'object',
      additionalProperties: false,
      required: ['categoryIndex', 'confidence', 'reasoning'],
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
        reasoning: {
          type: 'string',
          minLength: 1,
          maxLength: 200,
        },
      },
    }

    const response = await createResponseWithRetry({
      timeoutMs: OPENAI_TIMEOUT_MS,
      operation: () =>
        openai.responses.create({
          model: 'gpt-5-nano',
          instructions,
          input: expenseName.trim(),
          reasoning: { effort: 'minimal' },
          max_output_tokens: 120,
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

    const fallbackSuggestion = {
      categoryIndex: 1,
      confidence: 0,
      reasoning: 'No reliable category suggestion returned by AI',
    }
    const parsedModelOutput = parseModelJsonObject(response.output_text)
    const validatedSuggestion = categorySuggestionSchema.safeParse(parsedModelOutput)
    const suggestion = validatedSuggestion.success ? validatedSuggestion.data : fallbackSuggestion

    const hasValidCategoryIndex =
      suggestion.categoryIndex >= 1 && suggestion.categoryIndex <= categories.length
    const matchedCategory = hasValidCategoryIndex ? categories[suggestion.categoryIndex - 1] : null

    const categoryId = matchedCategory?.id ?? categories[0].id
    const categoryName = matchedCategory?.name ?? categories[0].name
    const confidence = matchedCategory ? suggestion.confidence : 0
    const reasoning = matchedCategory
      ? suggestion.reasoning
      : 'No strong match found, suggesting default category'

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          categoryId,
          categoryName,
          confidence,
          reasoning,
        },
      }),
      { headers: corsHeaders },
    )
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
