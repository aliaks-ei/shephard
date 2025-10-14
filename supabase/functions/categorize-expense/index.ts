import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import OpenAI from 'https://esm.sh/openai@5.12.2'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
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

    let categories
    let categoriesError

    if (planId) {
      const { data: planItems, error: itemsError } = await supabaseClient
        .from('plan_items')
        .select('category_id, categories(id, name)')
        .eq('plan_id', planId)

      categoriesError = itemsError

      if (planItems) {
        const categoryMap = new Map()
        planItems.forEach((item) => {
          if (item.categories && !categoryMap.has(item.categories.id)) {
            categoryMap.set(item.categories.id, item.categories)
          }
        })
        categories = Array.from(categoryMap.values())
      }
    } else {
      const { data, error } = await supabaseClient
        .from('categories')
        .select('id, name')
        .order('name')

      categories = data
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

    const instructions = `You are an expense categorization assistant. Analyze the expense name and suggest the most appropriate category from the user's list.

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
      - confidence must be between 0 and 1 (use 0.8+ for strong matches, 0.5-0.8 for reasonable matches, below 0.5 for weak matches)
      - reasoning must be concise (max 50 words)
      - If no good match exists, pick the closest one but use confidence < 0.5
      - Return only a single json object as the answer
    `

    const response = await openai.responses.create({
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
    })

    const result = JSON.parse(response.output_text || '{}')

    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === result.categoryName?.toLowerCase(),
    )

    if (matchedCategory) {
      result.categoryId = matchedCategory.id
      result.categoryName = matchedCategory.name
    } else {
      result.categoryId = categories[0].id
      result.categoryName = categories[0].name
      result.confidence = 0
      result.reasoning = 'No strong match found, suggesting default category'
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          categoryId: result.categoryId,
          categoryName: result.categoryName,
          confidence: result.confidence,
          reasoning: result.reasoning,
        },
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
        },
      }),
      { headers: corsHeaders },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    )
  }
})
