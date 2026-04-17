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
import { buildCorsHeaders } from '../_shared/notification-utils.ts'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

const OPENAI_TIMEOUT_MS = 15000
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/

const clampUnitInterval = (value: number): number => Math.min(1, Math.max(0, value))

const photoAnalysisSchema = z.object({
  expenseName: z.string().trim().min(1).max(120),
  amount: z.coerce.number().finite(),
  categoryIndex: z.coerce.number().int().min(1),
  confidence: z.coerce.number().finite().transform(clampUnitInterval),
  reasoning: z.string().trim().min(1).max(300),
})

interface AnalyzePhotoRequest {
  imageBase64: string
  planId?: string
  currency: string
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('Origin'))

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
      if (authError) {
        console.error('Auth error in analyze-expense-photo:', authError)
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

    const { imageBase64, planId, currency } = requestBody as AnalyzePhotoRequest

    if (typeof currency !== 'string' || !CURRENCY_CODE_PATTERN.test(currency)) {
      return new Response(JSON.stringify({ error: 'Currency must be a 3-letter ISO 4217 code' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    if (planId !== undefined && (typeof planId !== 'string' || planId.length > 64)) {
      return new Response(JSON.stringify({ error: 'Invalid planId' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

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
      console.error('Failed to fetch categories in analyze-expense-photo:', categoriesError)
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

    const categoryList = categories.map((c, idx) => `${idx + 1}. ${c.name}`).join('\n')

    const instructions = `
      <task>
      Extract expense details from the image and assign the best category.
      </task>

      <categories>
      ${categoryList}
      </categories>

      <currency>
      ${currency}
      </currency>

      <rules>
      - Return only valid JSON that follows the output schema.
      - expenseName should be concise (2-5 words).
      - amount must be a numeric total (no currency symbol).
      - categoryIndex must be the 1-based index from the categories list.
      - confidence must be between 0 and 1.
      - reasoning must be short (max 50 words).
      - For blurry/no-receipt images, set low confidence (0 to 0.5).
      </rules>
    `

    const photoAnalysisJsonSchema = {
      type: 'object',
      additionalProperties: false,
      required: ['expenseName', 'amount', 'categoryIndex', 'confidence', 'reasoning'],
      properties: {
        expenseName: {
          type: 'string',
          minLength: 1,
          maxLength: 120,
        },
        amount: {
          type: 'number',
          minimum: 0,
        },
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
          maxLength: 300,
        },
      },
    }

    const response = await createResponseWithRetry({
      timeoutMs: OPENAI_TIMEOUT_MS,
      operation: () =>
        openai.responses.create({
          model: 'gpt-5-mini',
          instructions,
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: 'Extract the structured expense details from this image.',
                },
                {
                  type: 'input_image',
                  image_url: imageBase64,
                },
              ],
            },
          ],
          reasoning: { effort: 'minimal' },
          max_output_tokens: 220,
          store: false,
          text: {
            format: {
              type: 'json_schema',
              name: 'expense_photo_analysis',
              schema: photoAnalysisJsonSchema,
              strict: true,
            },
            verbosity: 'low',
          },
        }),
    })

    const fallbackAnalysis = {
      expenseName: 'Unknown Expense',
      amount: 0,
      categoryIndex: 1,
      confidence: 0,
      reasoning: 'Could not extract valid expense details from image',
    }
    const parsedModelOutput = parseModelJsonObject(response.output_text)
    const validatedAnalysis = photoAnalysisSchema.safeParse(parsedModelOutput)
    const analysis = validatedAnalysis.success ? validatedAnalysis.data : fallbackAnalysis

    const hasValidCategoryIndex =
      analysis.categoryIndex >= 1 && analysis.categoryIndex <= categories.length
    const matchedCategory = hasValidCategoryIndex ? categories[analysis.categoryIndex - 1] : null

    const categoryId = matchedCategory?.id ?? categories[0].id
    const categoryName = matchedCategory?.name ?? categories[0].name
    let confidence = matchedCategory ? analysis.confidence : Math.min(analysis.confidence, 0.3)
    let reasoning = matchedCategory ? analysis.reasoning : 'Could not match category, using default'
    const expenseName = analysis.expenseName || 'Unknown Expense'
    const amount = Number.isFinite(analysis.amount) && analysis.amount > 0 ? analysis.amount : 0

    if (amount <= 0) {
      confidence = Math.min(confidence, 0.3)
      reasoning = 'Could not extract valid expense details from image'
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          expenseName,
          amount,
          categoryId,
          categoryName,
          confidence,
          reasoning,
        },
      }),
      { headers: corsHeaders },
    )
  } catch (error) {
    console.error('Error in analyze-expense-photo:', error)
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
