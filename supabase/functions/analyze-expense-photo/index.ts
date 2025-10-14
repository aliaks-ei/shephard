import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import OpenAI from 'https://esm.sh/openai@5.12.2'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

interface AnalyzePhotoRequest {
  imageBase64: string
  planId?: string
  currency: string
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

    const { imageBase64, planId, currency } = requestBody as AnalyzePhotoRequest

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Image data is required' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Validate data URL format
    if (!imageBase64.startsWith('data:image/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid image data format. Expected data URL.' }),
        { status: 400, headers: corsHeaders },
      )
    }

    // Validate image format - only allow formats OpenAI supports
    const mimeType = imageBase64.split(',')[0]?.split(':')[1]?.split(';')[0]
    const allowedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    if (!mimeType || !allowedFormats.includes(mimeType)) {
      return new Response(
        JSON.stringify({
          error: `Unsupported image format: ${mimeType}. Please use JPEG, PNG, WebP, or HEIC (which will be converted to JPEG).`,
          receivedFormat: mimeType,
        }),
        { status: 400, headers: corsHeaders },
      )
    }

    // Extract base64 portion for size check
    const base64Data = imageBase64.split(',')[1]
    if (!base64Data) {
      return new Response(JSON.stringify({ error: 'Invalid base64 image data' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const imageSizeBytes = (base64Data.length * 3) / 4
    if (imageSizeBytes > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Image size exceeds 5MB limit' }), {
        status: 400,
        headers: corsHeaders,
      })
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

    const instructions = `
      You are an expense receipt analyzer. Analyze this expense receipt/photo and extract:

      1. The expense name/description (keep it brief and descriptive)
      2. The total amount (numbers only, no currency symbols)
      3. The most appropriate category from the user's list

      User's categories: ${categoryList}
      User's currency: ${currency}

      You must respond in JSON format. Respond ONLY with valid JSON in this exact format:
      {
        "expenseName": "brief-descriptive-name",
        "amount": 123.45,
        "categoryName": "exact-category-name-from-list",
        "confidence": 0.95,
        "reasoning": "brief explanation of what you see"
      }

      Rules:
      - expenseName should be concise (2-5 words max), like "Grocery Shopping" or "Gas Station"
      - amount must be a number (extract from receipt total, ignore currency symbols)
      - categoryName must EXACTLY match one from the list above (case-insensitive)
      - confidence must be between 0 and 1:
        * 0.8-1.0: Clear receipt with readable text and obvious category match
        * 0.5-0.8: Partial information visible or uncertain category
        * 0-0.5: Unclear image, can't read text, or no receipt visible
      - reasoning: briefly explain what text/details you recognized (max 50 words)
      - If image is too blurry or unclear to read, use low confidence (< 0.5)
      - If no receipt/expense document is visible, use confidence 0

      Return only a single JSON object.
    `

    const response = await openai.responses.create({
      model: 'gpt-5-nano',
      instructions,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Analyze this expense receipt and extract the details in JSON format.',
            },
            {
              type: 'input_image',
              image_url: imageBase64,
            },
          ],
        },
      ],
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

    if (!matchedCategory) {
      result.categoryId = categories[0].id
      result.categoryName = categories[0].name
      result.confidence = Math.min(result.confidence || 0, 0.3)
      result.reasoning = 'Could not match category, using default'
    } else {
      result.categoryId = matchedCategory.id
      result.categoryName = matchedCategory.name
    }

    if (!result.expenseName || !result.amount || result.amount <= 0) {
      result.confidence = Math.min(result.confidence || 0, 0.3)
      result.reasoning = 'Could not extract valid expense details from image'
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          expenseName: result.expenseName || 'Unknown Expense',
          amount: result.amount || 0,
          categoryId: result.categoryId,
          categoryName: result.categoryName,
          confidence: result.confidence || 0,
          reasoning: result.reasoning || 'No details provided',
        },
      }),
      { headers: corsHeaders },
    )
  } catch (error) {
    console.error('Error in analyze-expense-photo:', error)
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
