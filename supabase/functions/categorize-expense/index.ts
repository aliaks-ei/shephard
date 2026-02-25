import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import OpenAI from 'https://esm.sh/openai@5.12.2'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.24.1'
import {
  createResponseWithRetry,
  isCategory,
  normalizeCategoryName,
  parseModelJsonObject,
  sortCategoriesDeterministically,
  type Category,
} from '../_shared/ai-utils.ts'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

const OPENAI_TIMEOUT_MS = 12000

const clampUnitInterval = (value: number): number => Math.min(1, Math.max(0, value))

const categorySuggestionSchema = z.object({
  categoryName: z.string().trim().min(1),
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
    let categoriesError

    if (planId) {
      const { data: planItems, error: itemsError } = await supabaseClient
        .from('plan_items')
        .select('category_id, categories(id, name)')
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

    const categoryList = categories.map((c, idx) => `${idx + 1}. ${c.name}`).join('\n')

    const instructions = `
      You are an expense categorization assistant.
      Analyze the expense name and suggest the most appropriate category from the user's list.

      User's categories:
      ${categoryList}

      Respond ONLY with valid json in this exact format:
      {
        "categoryName": "exact-category-name-from-list",
        "confidence": 0.95,
        "reasoning": "brief one-sentence explanation"
      }

      Rules:
      - categoryName must EXACTLY match one from the list above (case-insensitive)
      - confidence must be between 0 and 1 (use 0.8+ for strong matches, 0.65-0.8 for reasonable matches, below 0.65 for weak matches)
      - reasoning must be concise (max 50 words)
      - If no good match exists, pick the closest one but use confidence < 0.65
      - Return only a single json object as the answer
    `

    const response = await createResponseWithRetry({
      timeoutMs: OPENAI_TIMEOUT_MS,
      operation: () =>
        openai.responses.create({
          model: 'gpt-5-nano',
          instructions,
          input: `Categorize this expense: "${expenseName}". Return a JSON object.`,
          reasoning: { effort: 'minimal' },
          text: {
            format: {
              type: 'json_object',
            },
            verbosity: 'low',
          },
        }),
    })

    const fallbackSuggestion = {
      categoryName: categories[0].name,
      confidence: 0,
      reasoning: 'No reliable category suggestion returned by AI',
    }
    const parsedModelOutput = parseModelJsonObject(response.output_text)
    const validatedSuggestion = categorySuggestionSchema.safeParse(parsedModelOutput)
    const suggestion = validatedSuggestion.success ? validatedSuggestion.data : fallbackSuggestion

    const matchedCategory = categories.find(
      (category) =>
        normalizeCategoryName(category.name) === normalizeCategoryName(suggestion.categoryName),
    )

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
